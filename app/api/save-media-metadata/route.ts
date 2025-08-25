import { NextRequest, NextResponse } from 'next/server'
import { createMedia } from '@/lib/supabase-db'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Salvar no banco
    const mediaItem = await createMedia({
      title: data.title,
      description: data.description || '',
      file_url: data.file_url,
      thumbnail_url: data.thumbnail_url,
      file_type: data.file_type as 'video' | 'photo',
      categories: data.categories || [],
      file_name: data.file_name,
      file_size: data.file_size || 0,
      supabase_path: data.supabase_path,
      supabase_thumbnail_path: data.supabase_thumbnail_path || '',
      width: 0,
      height: 0,
      duration: undefined,
      views: 0,
      date_created: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      media: mediaItem
    })
    
  } catch (error) {
    console.error('Erro salvando metadados:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar metadados' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'