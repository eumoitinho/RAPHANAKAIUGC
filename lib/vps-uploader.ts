import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'

// Configurar ffmpeg-static se disponível
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath)
}

export interface UploadResult {
  fileUrl: string
  thumbnailUrl?: string
  fileName: string
  fileSize: number
  dimensions?: {
    width: number
    height: number
  }
  duration?: number
}

export class VPSUploader {
  private uploadDir: string
  private thumbnailDir: string
  private baseUrl: string
  private vpsFileUrl: string

  constructor(baseUrl?: string) {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads')
    this.thumbnailDir = path.join(this.uploadDir, 'thumbnails')
    this.baseUrl = baseUrl || ''
    
    // URLs da VPS a partir das variáveis de ambiente
    this.vpsFileUrl = process.env.VPS_FILE_URL || 'https://uploads.catalisti.com.br/uploads'
    
    console.log('🌐 VPS File URL configurada:', this.vpsFileUrl)
    
    // Garantir que os diretórios existam (para fallback local)
    this.ensureDirectories()
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }
    
    if (!fs.existsSync(this.thumbnailDir)) {
      fs.mkdirSync(this.thumbnailDir, { recursive: true })
    }

    // Criar diretórios para vídeos e fotos
    const videosDir = path.join(this.uploadDir, 'videos')
    const photosDir = path.join(this.uploadDir, 'photos')
    
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true })
    }
    
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true })
    }
  }

  async uploadFile(file: File, fileType: 'video' | 'photo'): Promise<UploadResult> {
    try {
      const fileExtension = path.extname(file.name)
      const fileName = `${uuidv4()}${fileExtension}`
      
      console.log('📤 Iniciando upload para VPS:', { fileName, fileType, size: file.size })
      
      // Preparar FormData para envio à VPS
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', fileType)
      formData.append('fileName', fileName)
      
      // Enviar arquivo diretamente para a VPS
      const vpsUploadUrl = process.env.VPS_UPLOAD_URL || 'https://uploads.catalisti.com.br'
      const response = await fetch(`${vpsUploadUrl}/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro na VPS (${response.status}): ${errorText}`)
      }
      
      const uploadResult = await response.json()
      console.log('✅ Upload na VPS concluído:', uploadResult)
      
      // Construir URLs da VPS
      const typeDir = fileType === 'video' ? 'videos' : 'photos'
      const fileUrl = `${this.vpsFileUrl}/${typeDir}/${fileName}`
      
      const result: UploadResult = {
        fileUrl,
        fileName,
        fileSize: file.size
      }

      // Para processar thumbnails, ainda precisamos temporariamente do arquivo local
      const tempFilePath = await this.saveTemporaryFile(file, fileName, typeDir)

      try {
        // Para imagens, gerar thumbnail e obter dimensões reais
        if (fileType === 'photo') {
          const thumbnailUrl = await this.generateImageThumbnail(tempFilePath, fileName)
          result.thumbnailUrl = thumbnailUrl
          
          // Obter dimensões reais da imagem
          result.dimensions = await this.getImageDimensions(tempFilePath)
        }

        // Para vídeos, gerar thumbnail do primeiro frame e obter metadados
        if (fileType === 'video') {
          const thumbnailUrl = await this.generateVideoThumbnail(tempFilePath, fileName)
          result.thumbnailUrl = thumbnailUrl
          
          // Obter duração e dimensões reais do vídeo
          const videoMeta = await this.getVideoMetadata(tempFilePath)
          result.duration = videoMeta.duration
          result.dimensions = videoMeta.dimensions
        }
      } finally {
        // Limpar arquivo temporário
        await this.cleanupTemporaryFile(tempFilePath)
      }

      return result
    } catch (error) {
      console.error('Erro no upload:', error)
      throw new Error(`Falha no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  private async saveTemporaryFile(file: File, fileName: string, typeDir: string): Promise<string> {
    const filePath = path.join(this.uploadDir, typeDir, fileName)
    
    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Salvar arquivo temporariamente para processamento
    fs.writeFileSync(filePath, buffer)
    console.log('💾 Arquivo temporário salvo:', filePath)
    
    return filePath
  }

  private async cleanupTemporaryFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log('🗑️ Arquivo temporário removido:', filePath)
      }
    } catch (error) {
      console.warn('⚠️ Erro ao remover arquivo temporário:', error)
    }
  }

  private async generateImageThumbnail(filePath: string, fileName: string): Promise<string> {
    try {
      const thumbnailName = `thumb_${path.parse(fileName).name}.webp`
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailName)
      
      // Gerar thumbnail redimensionado com Sharp no formato vertical (9:16)
      await sharp(filePath)
        .resize(216, 384, {  // 216x384 = 9:16 aspect ratio
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toFile(thumbnailPath)
      
      // Retornar URL da VPS para thumbnail
      return `${this.vpsFileUrl}/thumbnails/${thumbnailName}`
    } catch (error) {
      console.error('Erro ao gerar thumbnail da imagem:', error)
      return '/placeholder.jpg'
    }
  }

  private async generateVideoThumbnail(filePath: string, fileName: string): Promise<string> {
    return new Promise((resolve) => {
      try {
        const thumbnailName = `thumb_${path.parse(fileName).name}.jpg`
        const thumbnailPath = path.join(this.thumbnailDir, thumbnailName)
        
        // Extrair frame do vídeo usando FFmpeg
        ffmpeg(filePath)
          .screenshots({
            timestamps: ['10%'], // Pegar frame aos 10% da duração
            filename: thumbnailName,
            folder: this.thumbnailDir,
            size: '1080x1920' // Formato vertical de stories (9:16)
          })
          .on('end', () => {
            console.log('✅ Thumbnail do vídeo gerada:', thumbnailName)
            // Retornar URL da VPS para thumbnail
            resolve(`${this.vpsFileUrl}/thumbnails/${thumbnailName}`)
          })
          .on('error', (err) => {
            console.error('❌ Erro ao gerar thumbnail do vídeo:', err)
            // Fallback: copiar placeholder se existir
            const placeholderPath = path.join(process.cwd(), 'public', 'placeholder.jpg')
            if (fs.existsSync(placeholderPath)) {
              fs.copyFileSync(placeholderPath, thumbnailPath)
            }
            resolve('/placeholder.jpg')
          })
      } catch (error) {
        console.error('Erro ao configurar geração de thumbnail:', error)
        resolve('/placeholder.jpg')
      }
    })
  }

  private async getImageDimensions(filePath: string): Promise<{ width: number; height: number } | undefined> {
    try {
      const metadata = await sharp(filePath).metadata()
      return {
        width: metadata.width || 1920,
        height: metadata.height || 1080
      }
    } catch (error) {
      console.error('Erro ao obter dimensões da imagem:', error)
      return { width: 1920, height: 1080 }
    }
  }

  private async getVideoMetadata(filePath: string): Promise<{ duration?: number; dimensions?: { width: number; height: number } }> {
    return new Promise((resolve) => {
      try {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
            console.error('Erro ao obter metadados do vídeo:', err)
            resolve({ duration: 60, dimensions: { width: 1920, height: 1080 } })
            return
          }

          const videoStream = metadata.streams.find(stream => stream.codec_type === 'video')
          const duration = metadata.format.duration || 60
          const dimensions = videoStream ? {
            width: videoStream.width || 1920,
            height: videoStream.height || 1080
          } : { width: 1920, height: 1080 }

          console.log('✅ Metadados do vídeo:', { duration, dimensions })
          resolve({ duration, dimensions })
        })
      } catch (error) {
        console.error('Erro ao processar metadados:', error)
        resolve({ duration: 60, dimensions: { width: 1920, height: 1080 } })
      }
    })
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const filePath = path.join(process.cwd(), 'public', fileUrl)
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        
        // Tentar deletar thumbnail associado
        const fileName = path.basename(fileUrl)
        const thumbnailName = `thumb_${fileName}`
        const thumbnailPath = path.join(this.thumbnailDir, thumbnailName)
        
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath)
        }
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      return false
    }
  }

  getFileStats(fileUrl: string): { exists: boolean; size?: number } {
    try {
      const filePath = path.join(process.cwd(), 'public', fileUrl)
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        return { exists: true, size: stats.size }
      }
      
      return { exists: false }
    } catch (error) {
      console.error('Erro ao obter estatísticas do arquivo:', error)
      return { exists: false }
    }
  }
}

