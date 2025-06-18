import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video') as File

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    // Simulação de extração de frames
    // Para implementação real, use FFmpeg
    const frames = [
      { timestamp: 5, frameUrl: '/placeholder.svg?height=120&width=68&text=Frame1' },
      { timestamp: 15, frameUrl: '/placeholder.svg?height=120&width=68&text=Frame2' },
      { timestamp: 25, frameUrl: '/placeholder.svg?height=120&width=68&text=Frame3' },
      { timestamp: 35, frameUrl: '/placeholder.svg?height=120&width=68&text=Frame4' },
      { timestamp: 45, frameUrl: '/placeholder.svg?height=120&width=68&text=Frame5' },
      { timestamp: 55, frameUrl: '/placeholder.svg?height=120&width=68&text=Frame6' },
    ]
    
    return NextResponse.json({ frames })
  } catch (error) {
    console.error('Error extracting frames:', error)
    return NextResponse.json(
      { error: 'Failed to extract frames' },
      { status: 500 }
    )
  }
}