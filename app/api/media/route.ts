import { NextResponse } from 'next/server'
import { MediaService } from '@/lib/media-service'

const mediaService = new MediaService()

export async function GET() {
  try {
    const mediaItems = await mediaService.getAllMedia()
    return NextResponse.json({ media: mediaItems })
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 })
    }

    const success = await mediaService.incrementViews(id)

    if (!success) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating view count:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}