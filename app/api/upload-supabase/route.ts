import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, getPublicUrl, STORAGE_BUCKETS, initializeStorageBuckets } from '@/lib/supabase'
import { createMedia, getAllMedia, deleteMedia as deleteMediaRecord } from '@/lib/supabase-db'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

// Inicializar buckets ao iniciar
initializeStorageBuckets().catch(console.error)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const categories = JSON.parse(formData.get('categories') as string || '[]')
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Determinar o tipo de arquivo
    const fileType = file.type.startsWith('video/') ? 'video' : 'photo'
    const bucket = fileType === 'video' ? STORAGE_BUCKETS.VIDEOS : STORAGE_BUCKETS.IMAGES
    
    // Gerar um nome único para o arquivo
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    const filePath = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${uniqueFileName}`
    
    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload do arquivo principal
    console.log(`Uploading ${fileType} to Supabase Storage...`)
    await uploadFile(bucket, filePath, file, {
      contentType: file.type,
    })
    
    // Obter URL pública do arquivo
    const fileUrl = getPublicUrl(bucket, filePath)
    
    // Gerar e fazer upload da thumbnail
    let thumbnailUrl = fileUrl
    let thumbnailPath = ''
    
    try {
      if (fileType === 'photo') {
        // Gerar thumbnail para imagem
        const thumbnailBuffer = await sharp(buffer)
          .resize(400, 600, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer()
        
        const thumbnailFileName = `thumb_${uniqueFileName.replace(/\.[^.]+$/, '.jpg')}`
        thumbnailPath = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${thumbnailFileName}`
        
        // Upload da thumbnail
        await uploadFile(STORAGE_BUCKETS.THUMBNAILS, thumbnailPath, new Blob([thumbnailBuffer]), {
          contentType: 'image/jpeg',
        })
        
        thumbnailUrl = getPublicUrl(STORAGE_BUCKETS.THUMBNAILS, thumbnailPath)
      } else if (fileType === 'video') {
        // Para vídeos, usar o primeiro frame como thumbnail
        try {
          // Por enquanto, usar a URL do vídeo como thumbnail
          // Em produção, você pode usar ffmpeg ou um serviço de thumbnail
          thumbnailUrl = fileUrl
        } catch (error) {
          console.error('Error generating video thumbnail:', error)
        }
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error)
    }
    
    // Obter dimensões da imagem
    let width = 0, height = 0
    if (fileType === 'photo') {
      try {
        const metadata = await sharp(buffer).metadata()
        width = metadata.width || 0
        height = metadata.height || 0
      } catch (error) {
        console.error('Error getting image metadata:', error)
      }
    }
    
    // Salvar metadados no Supabase Database
    const mediaItem = await createMedia({
      title: title || file.name,
      description: description || '',
      file_url: fileUrl,
      thumbnail_url: thumbnailUrl,
      file_type: fileType as 'video' | 'photo',
      categories: categories || [],
      views: 0,
      file_name: file.name,
      file_size: file.size,
      width,
      height,
      supabase_path: filePath,
      supabase_thumbnail_path: thumbnailPath,
    })
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: mediaItem.id,
        fileUrl,
        thumbnailUrl,
        fileType,
      }
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

// GET - Listar arquivos do Supabase
export async function GET(request: NextRequest) {
  try {
    const media = await getAllMedia()
    
    return NextResponse.json({
      success: true,
      media
    })
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar arquivo
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }
    
    await deleteMediaRecord(id)
    
    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully'
    })
    
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    )
  }
}