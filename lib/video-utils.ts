import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'

// Gerar thumbnail de vídeo
export async function generateVideoThumbnail(
  videoBuffer: Buffer,
  fileName: string,
  timestamp: string = '00:00:01'
): Promise<Buffer | null> {
  try {
    // Criar arquivo temporário para o vídeo
    const tempDir = os.tmpdir()
    const tempVideoPath = path.join(tempDir, `temp_${Date.now()}_${fileName}`)
    const tempThumbPath = path.join(tempDir, `thumb_${Date.now()}.jpg`)
    
    // Salvar vídeo temporariamente
    await fs.writeFile(tempVideoPath, videoBuffer)
    
    // Gerar thumbnail usando ffmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempVideoPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(tempThumbPath),
          folder: tempDir,
          size: '400x600'
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
    })
    
    // Ler thumbnail gerada
    const thumbnailBuffer = await fs.readFile(tempThumbPath)
    
    // Limpar arquivos temporários
    await fs.unlink(tempVideoPath).catch(() => {})
    await fs.unlink(tempThumbPath).catch(() => {})
    
    return thumbnailBuffer
  } catch (error) {
    console.error('Error generating video thumbnail:', error)
    return null
  }
}

// Obter duração do vídeo
export async function getVideoDuration(videoBuffer: Buffer, fileName: string): Promise<number> {
  try {
    const tempDir = os.tmpdir()
    const tempVideoPath = path.join(tempDir, `temp_${Date.now()}_${fileName}`)
    
    await fs.writeFile(tempVideoPath, videoBuffer)
    
    const duration = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(tempVideoPath, (err, metadata) => {
        if (err) {
          reject(err)
        } else {
          resolve(metadata.format.duration || 0)
        }
      })
    })
    
    await fs.unlink(tempVideoPath).catch(() => {})
    
    return Math.round(duration)
  } catch (error) {
    console.error('Error getting video duration:', error)
    return 0
  }
}

// Obter dimensões do vídeo
export async function getVideoDimensions(
  videoBuffer: Buffer,
  fileName: string
): Promise<{ width: number; height: number }> {
  try {
    const tempDir = os.tmpdir()
    const tempVideoPath = path.join(tempDir, `temp_${Date.now()}_${fileName}`)
    
    await fs.writeFile(tempVideoPath, videoBuffer)
    
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      ffmpeg.ffprobe(tempVideoPath, (err, metadata) => {
        if (err) {
          reject(err)
        } else {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video')
          if (videoStream && videoStream.width && videoStream.height) {
            resolve({
              width: videoStream.width,
              height: videoStream.height
            })
          } else {
            resolve({ width: 0, height: 0 })
          }
        }
      })
    })
    
    await fs.unlink(tempVideoPath).catch(() => {})
    
    return dimensions
  } catch (error) {
    console.error('Error getting video dimensions:', error)
    return { width: 0, height: 0 }
  }
}