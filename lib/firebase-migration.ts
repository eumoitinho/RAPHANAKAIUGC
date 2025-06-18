import { adminDb, adminStorage } from './firebase-admin'
import { MediaService } from './media-service'
import { MediaProcessor } from './media-processor'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export interface MigrationResult {
  originalId: string
  newId?: string
  title: string
  status: 'success' | 'error'
  originalSize?: number
  newSize?: number
  compressionRatio?: string
  error?: string
}

export class FirebaseMigration {
  private mediaService: MediaService
  private processor: MediaProcessor

  constructor() {
    this.mediaService = new MediaService()
    this.processor = new MediaProcessor()
  }

  async migrateAllMedia(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = []

    try {
      // Verificar se o Firebase está configurado
      if (!adminDb || !adminStorage) {
        throw new Error('Firebase não está configurado corretamente. Verifique as variáveis de ambiente.')
      }

      // 1. Buscar todos os itens do Firestore
      console.log('Buscando itens do Firestore...')
      const snapshot = await adminDb.collection('media').get()
      
      console.log(`Encontrados ${snapshot.docs.length} itens para migrar`)

      if (snapshot.docs.length === 0) {
        console.log('Nenhum item encontrado no Firestore para migrar')
        return []
      }

      for (const doc of snapshot.docs) {
        const data = doc.data()
        console.log(`Processando item: ${data.title || doc.id}`)
        
        const result = await this.migrateMediaItem(doc.id, data)
        results.push(result)
        
        // Pequena pausa entre migrações para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      return results
    } catch (error) {
      console.error('Erro na migração:', error)
      throw error
    }
  }

  private async migrateMediaItem(originalId: string, data: any): Promise<MigrationResult> {
    try {
      console.log(`Migrando item: ${data.title}`)

      // Verificar se os dados necessários existem
      if (!data.fileUrl) {
        throw new Error('URL do arquivo não encontrada')
      }

      // 2. Baixar arquivo do Firebase Storage
      const fileBuffer = await this.downloadFromFirebase(data.fileUrl)
      const originalSize = fileBuffer.length

      console.log(`Arquivo baixado: ${originalSize} bytes`)

      // 3. Criar arquivo temporário
      const tempFile = await this.createTempFile(fileBuffer, data.fileName || `${originalId}.mp4`)

      // 4. Processar e otimizar
      let processedMedia
      if (data.fileType === 'video') {
        processedMedia = await this.processor.processVideo(tempFile)
      } else {
        processedMedia = await this.processor.processImage(tempFile)
      }

      console.log(`Arquivo processado: ${processedMedia.fileSize} bytes`)

      // 5. Baixar thumbnail se for vídeo
      let thumbnailUrl = processedMedia.optimizedPath.replace(process.cwd() + '/public', '')
      if (data.fileType === 'video' && data.thumbnailUrl && data.thumbnailUrl !== data.fileUrl) {
        try {
          const thumbnailBuffer = await this.downloadFromFirebase(data.thumbnailUrl)
          thumbnailUrl = await this.saveThumbnail(thumbnailBuffer, originalId)
          console.log(`Thumbnail salvo: ${thumbnailUrl}`)
        } catch (error) {
          console.warn('Erro ao baixar thumbnail, usando placeholder:', error)
          thumbnailUrl = '/placeholder.svg?height=400&width=300&text=Video'
        }
      }

      // 6. Salvar no MongoDB
      const newMediaItem = await this.mediaService.createMedia({
        title: data.title || 'Sem título',
        description: data.description || '',
        fileUrl: processedMedia.optimizedPath.replace(process.cwd() + '/public', ''),
        thumbnailUrl,
        fileType: data.fileType || 'photo',
        categories: data.categories || [],
        fileName: path.basename(processedMedia.optimizedPath),
        fileSize: processedMedia.fileSize,
        dimensions: processedMedia.dimensions,
        duration: processedMedia.duration,
        optimized: true
      })

      console.log(`Item salvo no MongoDB: ${newMediaItem.id}`)

      // 7. Atualizar views se existir
      if (data.views && data.views > 0) {
        console.log(`Atualizando ${data.views} views...`)
        for (let i = 0; i < Math.min(data.views, 1000); i++) { // Limitar a 1000 views para evitar timeout
          await this.mediaService.incrementViews(newMediaItem.id)
        }
      }

      const compressionRatio = ((originalSize - processedMedia.fileSize) / originalSize * 100).toFixed(1)

      return {
        originalId,
        newId: newMediaItem.id,
        title: data.title || 'Item migrado',
        status: 'success',
        originalSize,
        newSize: processedMedia.fileSize,
        compressionRatio: compressionRatio + '%'
      }

    } catch (error) {
      console.error(`Erro ao migrar ${data.title || originalId}:`, error)
      return {
        originalId,
        title: data.title || 'Item sem título',
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  private async downloadFromFirebase(firebaseUrl: string): Promise<Buffer> {
    try {
      console.log(`Baixando arquivo: ${firebaseUrl}`)
      
      // Verificar se é uma URL do Firebase Storage
      if (!firebaseUrl.includes('firebase') && !firebaseUrl.includes('googleapis.com')) {
        throw new Error('URL não é do Firebase Storage')
      }

      // Extrair o caminho do arquivo da URL do Firebase
      const url = new URL(firebaseUrl)
      let filePath = ''

      if (url.pathname.includes('/o/')) {
        // URL formato: https://firebasestorage.googleapis.com/v0/b/bucket/o/path?alt=media
        const pathMatch = url.pathname.match(/\/o\/(.+)/)
        if (!pathMatch) {
          throw new Error('Não foi possível extrair o caminho do arquivo da URL')
        }
        filePath = decodeURIComponent(pathMatch[1])
      } else {
        throw new Error('Formato de URL do Firebase não reconhecido')
      }

      console.log(`Caminho do arquivo extraído: ${filePath}`)
      
      // Baixar do Firebase Storage
      const file = adminStorage.bucket().file(filePath)
      const [exists] = await file.exists()
      
      if (!exists) {
        throw new Error(`Arquivo não encontrado no Storage: ${filePath}`)
      }
      
      const [buffer] = await file.download()
      console.log(`Arquivo baixado com sucesso: ${buffer.length} bytes`)
      
      return buffer
    } catch (error) {
      console.error('Erro ao baixar do Firebase:', error)
      throw error
    }
  }

  private async createTempFile(buffer: Buffer, originalName: string): Promise<File> {
    // Criar um objeto File a partir do buffer
    const blob = new Blob([buffer])
    return new File([blob], originalName)
  }

  private async saveThumbnail(buffer: Buffer, itemId: string): Promise<string> {
    const thumbnailsDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnails')
    
    if (!existsSync(thumbnailsDir)) {
      await mkdir(thumbnailsDir, { recursive: true })
    }

    const thumbnailPath = path.join(thumbnailsDir, `${itemId}.webp`)
    await writeFile(thumbnailPath, buffer)
    
    return `/uploads/thumbnails/${itemId}.webp`
  }
}