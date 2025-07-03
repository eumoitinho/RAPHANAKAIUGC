import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFile, unlink } from 'fs/promises'
import { randomUUID } from 'crypto'

// Configurações para Vercel (máximo 60s no plano hobby)
export const maxDuration = 60 // 60 segundos máximo
export const dynamic = 'force-dynamic'

ffmpeg.setFfmpegPath(ffmpegPath || '')

export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length')
    const maxSize = 50 * 1024 * 1024 // 50MB

    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 50MB.' },
        { status: 413 }
      )
    }

    const formData = await request.formData()
    const videoFile = formData.get('video') as File

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    if (videoFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 50MB.' },
        { status: 413 }
      )
    }

    // Salvar o arquivo temporariamente
    const tempVideoPath = join(tmpdir(), `${randomUUID()}-${videoFile.name}`)
    const arrayBuffer = await videoFile.arrayBuffer()
    await writeFile(tempVideoPath, Buffer.from(arrayBuffer))

    // Obter duração do vídeo
    const getDuration = () =>
      new Promise<number>((resolve, reject) => {
        ffmpeg.ffprobe(
          tempVideoPath,
          (err: Error | null, metadata: ffmpeg.FfprobeData) => {
            if (err) return reject(err)
            resolve(metadata.format.duration || 0)
          }
        )
      })

    const duration = await getDuration()
    const frameCount = 6
    const interval = duration / frameCount

    // Extrair frames
    const frames: { timestamp: number; frameUrl: string }[] = []
    const framePromises = Array.from({ length: frameCount }, async (_, i) => {
      const timestamp = Math.round(i * interval)
      const frameFilename = `${randomUUID()}-frame${i + 1}.jpg`
      const framePath = join(tmpdir(), frameFilename)

      return new Promise<{ timestamp: number; frameUrl: string }>((resolve, reject) => {
        ffmpeg(tempVideoPath)
          .seekInput(timestamp)
          .frames(1)
          .output(framePath)
          .on('end', async () => {
            // Você pode servir os frames como base64 ou salvar em storage e retornar a URL
            const frameBuffer = await readFile(framePath)
            await unlink(framePath)
            resolve({
              timestamp,
              frameUrl: `data:image/jpeg;base64,${frameBuffer.toString('base64')}`
            })
          })
          .on('error', reject)
          .run()
      })
    })

    const extractedFrames = await Promise.all(framePromises)
    await unlink(tempVideoPath)

    return NextResponse.json({
      frames: extractedFrames,
      videoInfo: {
        name: videoFile.name,
        size: videoFile.size,
        duration: Math.round(duration)
      }
    })
  } catch (error) {
    console.error('Error extracting frames:', error)
    return NextResponse.json(
      { error: 'Failed to extract frames' },
      { status: 500 }
    )
  }
}

import { readFile } from 'fs/promises'