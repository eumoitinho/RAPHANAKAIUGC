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
      // 1. Buscar todos os itens do Firestore
      console.log('Buscando itens do Firestore...')
      const snapshot = await adminDb.collection('media').get()
      
      console.log(`Encontrados ${snapshot.docs.length} itens para migrar`)

      for (const doc of snapshot.docs) {
        const data = doc.data()
        const result = await this.migrateMediaItem(doc.id, data)
        results.push(result)
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

      // 2. Baixar arquivo do Firebase Storage
      const fileBuffer = await this.downloadFromFirebase(data.fileUrl)
      const originalSize = fileBuffer.length

      // 3. Criar arquivo temporário
      const tempFile = await this.createTempFile(fileBuffer, data.fileName || 'temp')

      // 4. Processar e otimizar
      let processedMedia
      if (data.fileType === 'video') {
        processedMedia = await this.processor.processVideo(tempFile)
      } else {
        processedMedia = await this.processor.processImage(tempFile)
      }

      // 5. Baixar thumbnail se for vídeo
      let thumbnailUrl = processedMedia.optimizedPath.replace(process.cwd() + '/public', '')
      if (data.fileType === 'video' && data.thumbnailUrl && data.thumbnailUrl !== data.fileUrl) {
        try {
          const thumbnailBuffer = await this.downloadFromFirebase(data.thumbnailUrl)
          thumbnailUrl = await this.saveThumbnail(thumbnailBuffer, originalId)
        } catch (error) {
          console.warn('Erro ao baixar thumbnail:', error)
        }
      }

      // 6. Salvar no MongoDB
      const newMediaItem = await this.mediaService.createMedia({
        title: data.title || 'Sem título',
        description: data.description || '',
        fileUrl: processedMedia.optimizedPath.replace(process.cwd() + '/public', ''),
        thumbnailUrl,
        fileType: data.fileType,
        categories: data.categories || [],
        fileName: path.basename(processedMedia.optimizedPath),
        fileSize: processedMedia.fileSize,
        dimensions: processedMedia.dimensions,
        duration: processedMedia.duration,
        optimized: true
      })

      // 7. Atualizar views se existir
      if (data.views && data.views > 0) {
        for (let i = 0; i < data.views; i++) {
          await this.mediaService.incrementViews(newMediaItem.id)
        }
      }

      const compressionRatio = ((originalSize - processedMedia.fileSize) / originalSize * 100).toFixed(1)

      return {
        originalId,
        newId: newMediaItem.id,
        title: data.title,
        status: 'success',
        originalSize,
        newSize: processedMedia.fileSize,
        compressionRatio: compressionRatio + '%'
      }

    } catch (error) {
      console.error(`Erro ao migrar ${data.title}:`, error)
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
      // Extrair o caminho do arquivo da URL do Firebase
      const url = new URL(firebaseUrl)
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
      
      if (!pathMatch) {
        throw new Error('URL do Firebase inválida')
      }

      const filePath = decodeURIComponent(pathMatch[1])
      
      // Baixar do Firebase Storage
      const file = adminStorage.bucket().file(filePath)
      const [buffer] = await file.download()
      
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