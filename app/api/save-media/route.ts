import { NextRequest, NextResponse } from 'next/server'
import { createMedia } from '@/lib/supabase-db'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const {
      title,
      description,
      category,
      fileUrl,
      thumbnailUrl,
      fileType,
      fileName,
      fileSize,
      supabasePath
    } = data

    console.log('💾 Salvando mídia no banco:', {
      title,
      fileType,
      fileName,
      size: `${(fileSize / 1024 / 1024).toFixed(2)}MB`,
      category
    })

    // Criar item no formato esperado pelo banco
    const mediaItem = {
      title,
      description: description || '',
      file_url: fileUrl,
      thumbnail_url: thumbnailUrl || fileUrl,
      file_type: fileType as 'video' | 'photo',
      categories: [category], // Converter categoria única para array
      views: 0,
      file_name: fileName,
      file_size: fileSize,
      width: 0,
      height: 0,
      supabase_path: supabasePath || '',
      supabase_thumbnail_path: thumbnailUrl !== fileUrl ? supabasePath?.replace(fileName, `thumb_${fileName}`) : '',
    }

    // Salvar no banco usando a função existente
    const savedMedia = await createMedia(mediaItem)

    console.log('✅ Mídia salva no banco:', savedMedia.id)

    return NextResponse.json({
      success: true,
      data: savedMedia
    })

  } catch (error) {
    console.error('❌ Erro salvando mídia:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}