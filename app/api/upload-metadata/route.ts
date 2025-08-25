import { NextRequest, NextResponse } from 'next/server'
import { createMedia } from '@/lib/supabase-db'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const fileUrl = formData.get('fileUrl') as string
    const fileName = formData.get('fileName') as string
    const fileType = formData.get('fileType') as string
    const title = formData.get('title') as string
    const path = formData.get('path') as string
    
    // Salvar no banco
    const mediaItem = await createMedia({
      title: title || fileName,
      description: '',
      file_url: fileUrl,
      thumbnail_url: fileUrl, // Por enquanto usar o próprio arquivo
      file_type: fileType as 'video' | 'photo',
      categories: [],
      file_name: fileName,
      file_size: 0,
      supabase_path: path,
      supabase_thumbnail_path: '',
      width: 0,
      height: 0,
      duration: null
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