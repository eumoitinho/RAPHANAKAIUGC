import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
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
const VIDEO_CONFIG = {
  maxWidth: 1920,
  maxHeight: 1080,
  videoBitrate: '2000k',
  audioBitrate: '128k',
  format: 'mp4'
}

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
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileId = uuidv4()
    const originalPath = path.join(this.uploadsDir, 'temp', `${fileId}_original.${file.name.split('.').pop()}`)
    const optimizedPath = path.join(this.uploadsDir, 'videos', `${fileId}.${VIDEO_CONFIG.format}`)

    // Salvar arquivo original temporariamente
    await fs.writeFile(originalPath, buffer)

    return new Promise((resolve, reject) => {
      ffmpeg(originalPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .videoBitrate(VIDEO_CONFIG.videoBitrate)
        .audioBitrate(VIDEO_CONFIG.audioBitrate)
        .size(`${VIDEO_CONFIG.maxWidth}x${VIDEO_CONFIG.maxHeight}`)
        .autopad()
        .format(VIDEO_CONFIG.format)
        .on('end', async () => {
          try {
            // Obter informações do vídeo processado
            const stats = await fs.stat(optimizedPath)
            
            ffmpeg.ffprobe(optimizedPath, async (err, metadata) => {
              if (err) {
                reject(err)
                return
              }

              const videoStream = metadata.streams.find(s => s.codec_type === 'video')
              const duration = metadata.format.duration || 0

              // Limpar arquivo temporário
              try {
                await fs.unlink(originalPath)
              } catch (error) {
                console.error('Error cleaning up temp file:', error)
              }

              resolve({
                originalPath,
                optimizedPath,
                fileSize: stats.size,
                dimensions: {
                  width: videoStream?.width || 0,
                  height: videoStream?.height || 0
                },
                duration
              })
            })
          } catch (error) {
            reject(error)
          }
        })
        .on('error', (err) => {
          // Limpar arquivo temporário em caso de erro
          fs.unlink(originalPath).catch(console.error)
          reject(err)
        })
        .save(optimizedPath)
    })
  }

  async extractVideoFrames(videoPath: string, count: number = 6): Promise<VideoFrame[]> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, async (err, metadata) => {
        if (err) {
          reject(err)
          return
        }

        const duration = metadata.format.duration || 0
        const frames: VideoFrame[] = []
        const framePromises: Promise<void>[] = []

        for (let i = 0; i < count; i++) {
          const timestamp = (duration / (count + 1)) * (i + 1)
          const frameId = uuidv4()
          const framePath = path.join(this.uploadsDir, 'temp', `frame_${frameId}.jpg`)

          const framePromise = new Promise<void>((resolveFrame, rejectFrame) => {
            ffmpeg(videoPath)
              .seekInput(timestamp)
              .frames(1)
              .output(framePath)
              .on('end', () => {
                frames.push({
                  timestamp,
                  frameUrl: `/uploads/temp/frame_${frameId}.jpg`
                })
                resolveFrame()
              })
              .on('error', rejectFrame)
              .run()
          })

          framePromises.push(framePromise)
        }

        try {
          await Promise.all(framePromises)
          resolve(frames.sort((a, b) => a.timestamp - b.timestamp))
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  async createThumbnailFromFrame(frameUrl: string, videoId: string): Promise<string> {
    const framePath = path.join(process.cwd(), 'public', frameUrl)
    const thumbnailPath = path.join(this.uploadsDir, 'thumbnails', `${videoId}.webp`)

    await sharp(framePath)
      .resize(480, 270, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(thumbnailPath)

    // Limpar frame temporário
    try {
      await fs.unlink(framePath)
    } catch (error) {
      console.error('Error cleaning up frame file:', error)
    }

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