import { NextRequest, NextResponse } from 'next/server'
import { MediaProcessor } from '@/lib/media-processor'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video') as File

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    const processor = new MediaProcessor()
    
    // Salvar vídeo temporariamente para extrair frames
    const buffer = Buffer.from(await videoFile.arrayBuffer())
    const tempPath = `/tmp/${Date.now()}_${videoFile.name}`
    
    // Em produção, você salvaria o arquivo no sistema de arquivos
    // Por agora, vamos simular a extração de frames
    
    const frames = await processor.extractVideoFrames(tempPath, 6)
    
    return NextResponse.json({ frames })
  } catch (error) {
    console.error('Error extracting frames:', error)
    return NextResponse.json(
      { error: 'Failed to extract frames' },
      { status: 500 }
    )
  }
}