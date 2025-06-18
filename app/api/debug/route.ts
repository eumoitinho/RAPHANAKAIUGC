import { NextResponse } from 'next/server'
import { MediaService } from '@/lib/media-service'

const mediaService = new MediaService()

export async function GET() {
  try {
    const stats = await mediaService.getMediaStats()
    
    return NextResponse.json({
      success: true,
      metadata: stats,
      environment: {
        database: 'MongoDB',
        storage: 'VPS Local Storage',
        mongoUri: process.env.MONGODB_URI ? 'Configured' : 'Not configured',
      },
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}