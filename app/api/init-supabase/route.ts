import { NextResponse } from 'next/server'
import { initializeStorageBuckets } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Initializing Supabase Storage buckets...')
    await initializeStorageBuckets()
    
    return NextResponse.json({
      success: true,
      message: 'Supabase Storage buckets initialized successfully',
      buckets: ['videos', 'images', 'thumbnails']
    })
  } catch (error) {
    console.error('Error initializing buckets:', error)
    return NextResponse.json(
      { 
        error: 'Failed to initialize buckets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}