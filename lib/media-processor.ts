import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface ProcessedMedia {
  originalPath: string
  optimizedPath: string
  thumbnailPath?: string
  fileSize: number
  dimensions: {
    width: number
    height: number
  }
  duration?: number
}

export interface VideoFrame {
  timestamp: number
  frameUrl: string
}

// Configurações de otimização
const IMAGE_CONFIG = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  format: 'webp' as const
}

export class MediaProcessor {
  private uploadsDir: string

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    this.ensureDirectories()
  }

  private async ensureDirectories() {
    const dirs = ['videos', 'photos', 'thumbnails', 'temp']
    for (const dir of dirs) {
      const dirPath = path.join(this.uploadsDir, dir)
      try {
        await fs.access(dirPath)
      } catch {
        await fs.mkdir(dirPath, { recursive: true })
      }
    }
  }

  async processImage(file: File): Promise<ProcessedMedia> {
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileId = uuidv4()
    const originalPath = path.join(this.uploadsDir, 'temp', `${fileId}_original`)
    const optimizedPath = path.join(this.uploadsDir, 'photos', `${fileId}.${IMAGE_CONFIG.format}`)

    // Salvar arquivo original temporariamente
    await fs.writeFile(originalPath, buffer)

    try {
      // Processar com Sharp
      const image = sharp(buffer)
      const metadata = await image.metadata()

      // Redimensionar se necessário
      let processedImage = image
      if (metadata.width && metadata.width > IMAGE_CONFIG.maxWidth) {
        processedImage = processedImage.resize(IMAGE_CONFIG.maxWidth, null, {
          withoutEnlargement: true
        })
      }

      // Otimizar e converter para WebP
      await processedImage
        .webp({ quality: IMAGE_CONFIG.quality })
        .toFile(optimizedPath)

      // Obter informações do arquivo otimizado
      const optimizedStats = await fs.stat(optimizedPath)
      const optimizedMetadata = await sharp(optimizedPath).metadata()

      return {
        originalPath,
        optimizedPath,
        fileSize: optimizedStats.size,
        dimensions: {
          width: optimizedMetadata.width || 0,
          height: optimizedMetadata.height || 0
        }
      }
    } finally {
      // Limpar arquivo temporário
      try {
        await fs.unlink(originalPath)
      } catch (error) {
        console.error('Error cleaning up temp file:', error)
      }
    }
  }

  async processVideo(file: File): Promise<ProcessedMedia> {
    // Por enquanto, apenas salva o vídeo sem processamento FFmpeg
    // Para implementar processamento real, instale fluent-ffmpeg
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileId = uuidv4()
    const optimizedPath = path.join(this.uploadsDir, 'videos', `${fileId}.mp4`)

    await fs.writeFile(optimizedPath, buffer)
    const stats = await fs.stat(optimizedPath)

    return {
      originalPath: optimizedPath,
      optimizedPath,
      fileSize: stats.size,
      dimensions: {
        width: 1920, // Valores padrão
        height: 1080
      },
      duration: 0
    }
  }

  async extractVideoFrames(videoPath: string, count: number = 6): Promise<VideoFrame[]> {
    // Implementação simulada - para implementação real, use FFmpeg
    const frames: VideoFrame[] = []
    
    for (let i = 0; i < count; i++) {
      frames.push({
        timestamp: i * 10, // 10 segundos entre frames
        frameUrl: `/placeholder.svg?height=120&width=68&text=Frame${i + 1}`
      })
    }
    
    return frames
  }

  async createThumbnailFromFrame(frameUrl: string, videoId: string): Promise<string> {
    // Implementação simulada
    return `/uploads/thumbnails/${videoId}.webp`
  }

  async cleanupTempFiles() {
    const tempDir = path.join(this.uploadsDir, 'temp')
    try {
      const files = await fs.readdir(tempDir)
      for (const file of files) {
        await fs.unlink(path.join(tempDir, file))
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error)
    }
  }
}