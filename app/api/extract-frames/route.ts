import { NextRequest, NextResponse } from 'next/server'

// Aumentar limite de tamanho para esta rota
export const maxDuration = 60 // 60 segundos
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length')
    const maxSize = 100 * 1024 * 1024 // 100MB

    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 100MB.' },
        { status: 413 }
      )
    }

    const formData = await request.formData()
    const videoFile = formData.get('video') as File

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    console.log(`Processing video: ${videoFile.name}, size: ${videoFile.size} bytes`)

    // Verificar tamanho do arquivo
    if (videoFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 100MB.' },
        { status: 413 }
      )
    }

    // Simulação de extração de frames com base na duração estimada
    // Para implementação real, use FFmpeg
    const estimatedDuration = Math.min(60, Math.max(10, videoFile.size / (1024 * 1024))) // Estimar duração
    const frameCount = 6
    const interval = estimatedDuration / frameCount

    const frames = Array.from({ length: frameCount }, (_, i) => ({
      timestamp: Math.round(i * interval),
      frameUrl: `/placeholder.svg?height=120&width=68&text=Frame${i + 1}&time=${Math.round(i * interval)}s`
    }))
    
    console.log(`Generated ${frames.length} frames for video`)
    
    return NextResponse.json({ 
      frames,
      videoInfo: {
        name: videoFile.name,
        size: videoFile.size,
        estimatedDuration: Math.round(estimatedDuration)
      }
    })
  } catch (error) {
    console.error('Error extracting frames:', error)
    
    if (error instanceof Error && error.message.includes('PayloadTooLargeError')) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tente um arquivo menor que 100MB.' },
        { status: 413 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to extract frames' },
      { status: 500 }
    )
  }
}