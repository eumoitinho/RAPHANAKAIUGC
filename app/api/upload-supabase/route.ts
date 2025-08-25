import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, getPublicUrl, STORAGE_BUCKETS, initializeStorageBuckets } from '@/lib/supabase'
import { createMedia, getAllMedia, deleteMedia as deleteMediaRecord } from '@/lib/supabase-db'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

// Configurar limite de tamanho
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
}

// Inicializar buckets ao iniciar
initializeStorageBuckets().catch(console.error)

export async function POST(request: NextRequest) {
  try {
    // Verificar se o Content-Length é muito grande
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 500 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 500MB allowed.' }, { status: 413 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const categories = JSON.parse(formData.get('categories') as string || '[]')
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Verificar tamanho do arquivo
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 500MB allowed.' }, { status: 413 })
    }

    // Determinar o tipo de arquivo
    const fileType = file.type.startsWith('video/') ? 'video' : 'photo'
    const bucket = fileType === 'video' ? STORAGE_BUCKETS.VIDEOS : STORAGE_BUCKETS.IMAGES
    
    // Gerar um nome único para o arquivo
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    const filePath = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${uniqueFileName}`
    
    // Para arquivos grandes, usar stream ao invés de buffer
    let buffer: Buffer | null = null
    
    // Só converter para buffer se for imagem (para gerar thumbnail)
    if (fileType === 'photo') {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }
    
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
      if (fileType === 'photo' && buffer) {
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
        // Para vídeos, gerar thumbnail usando ffmpeg
        const { generateVideoThumbnail } = await import('@/lib/video-utils')
        
        try {
          // Converter File para Buffer para o vídeo
          const videoArrayBuffer = await file.arrayBuffer()
          const videoBuffer = Buffer.from(videoArrayBuffer)
          
          // Gerar thumbnail do vídeo
          const thumbnailBuffer = await generateVideoThumbnail(videoBuffer, file.name)
          
          if (thumbnailBuffer) {
            const thumbnailFileName = `thumb_${uniqueFileName.replace(/\.[^.]+$/, '.jpg')}`
            thumbnailPath = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${thumbnailFileName}`
            
            // Upload da thumbnail
            await uploadFile(STORAGE_BUCKETS.THUMBNAILS, thumbnailPath, new Blob([thumbnailBuffer]), {
              contentType: 'image/jpeg',
            })
            
            thumbnailUrl = getPublicUrl(STORAGE_BUCKETS.THUMBNAILS, thumbnailPath)
          }
        } catch (error) {
          console.error('Error generating video thumbnail:', error)
          // Fallback: usar primeira frame ou placeholder
          thumbnailUrl = fileUrl
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