import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

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

  constructor(baseUrl?: string) {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads')
    this.thumbnailDir = path.join(this.uploadDir, 'thumbnails')
    this.baseUrl = baseUrl || ''
    
    // Garantir que os diretórios existam
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
      
      // Determinar diretório baseado no tipo
      const typeDir = fileType === 'video' ? 'videos' : 'photos'
      const filePath = path.join(this.uploadDir, typeDir, fileName)
      
      // Converter File para Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Salvar arquivo
      fs.writeFileSync(filePath, buffer)
      
      const fileUrl = `/uploads/${typeDir}/${fileName}`
      const fileSize = buffer.length
      
      const result: UploadResult = {
        fileUrl,
        fileName,
        fileSize
      }

      // Para imagens, gerar thumbnail
      if (fileType === 'photo') {
        const thumbnailUrl = await this.generateImageThumbnail(filePath, fileName)
        result.thumbnailUrl = thumbnailUrl
        
        // Obter dimensões da imagem (implementação básica)
        result.dimensions = await this.getImageDimensions(filePath)
      }

      // Para vídeos, gerar thumbnail do primeiro frame
      if (fileType === 'video') {
        const thumbnailUrl = await this.generateVideoThumbnail(filePath, fileName)
        result.thumbnailUrl = thumbnailUrl
        
        // Obter duração do vídeo (implementação básica)
        result.duration = await this.getVideoDuration(filePath)
      }

      return result
    } catch (error) {
      console.error('Erro no upload:', error)
      throw new Error(`Falha no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  private async generateImageThumbnail(filePath: string, fileName: string): Promise<string> {
    try {
      // Para implementação básica, apenas copiar a imagem como thumbnail
      // Em produção, você usaria uma biblioteca como sharp para redimensionar
      const thumbnailName = `thumb_${fileName}`
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailName)
      
      fs.copyFileSync(filePath, thumbnailPath)
      
      return `/uploads/thumbnails/${thumbnailName}`
    } catch (error) {
      console.error('Erro ao gerar thumbnail da imagem:', error)
      return '/placeholder.jpg'
    }
  }

  private async generateVideoThumbnail(filePath: string, fileName: string): Promise<string> {
    try {
      // Para implementação básica, usar um placeholder
      // Em produção, você usaria ffmpeg para extrair um frame
      const thumbnailName = `thumb_${path.parse(fileName).name}.jpg`
      const placeholderPath = path.join(process.cwd(), 'public', 'placeholder.jpg')
      const thumbnailPath = path.join(this.thumbnailDir, thumbnailName)
      
      if (fs.existsSync(placeholderPath)) {
        fs.copyFileSync(placeholderPath, thumbnailPath)
        return `/uploads/thumbnails/${thumbnailName}`
      }
      
      return '/placeholder.jpg'
    } catch (error) {
      console.error('Erro ao gerar thumbnail do vídeo:', error)
      return '/placeholder.jpg'
    }
  }

  private async getImageDimensions(filePath: string): Promise<{ width: number; height: number } | undefined> {
    try {
      // Implementação básica - retorna dimensões padrão
      // Em produção, você usaria uma biblioteca como sharp ou image-size
      return { width: 1920, height: 1080 }
    } catch (error) {
      console.error('Erro ao obter dimensões da imagem:', error)
      return undefined
    }
  }

  private async getVideoDuration(filePath: string): Promise<number | undefined> {
    try {
      // Implementação básica - retorna duração padrão
      // Em produção, você usaria ffprobe para obter a duração real
      return 60 // 60 segundos como padrão
    } catch (error) {
      console.error('Erro ao obter duração do vídeo:', error)
      return undefined
    }
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

