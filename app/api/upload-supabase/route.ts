import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, getPublicUrl, STORAGE_BUCKETS, initializeStorageBuckets } from '@/lib/supabase'
import { getMediaCollection } from '@/lib/mongodb'
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
    
    if (fileType === 'photo' || fileType === 'video') {
      try {
        // Para vídeos, vamos usar uma thumbnail padrão por enquanto
        // Em produção, você precisaria extrair um frame do vídeo
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
        }
      } catch (error) {
        console.error('Error generating thumbnail:', error)
        // Se falhar, usa a imagem original como thumbnail
      }
    }
    
    // Obter dimensões da imagem/vídeo
    let dimensions = { width: 0, height: 0 }
    if (fileType === 'photo') {
      try {
        const metadata = await sharp(buffer).metadata()
        dimensions = {
          width: metadata.width || 0,
          height: metadata.height || 0,
        }
      } catch (error) {
        console.error('Error getting image metadata:', error)
      }
    }
    
    // Salvar metadados no MongoDB
    const mediaCollection = await getMediaCollection()
    const mediaItem = {
      id: uuidv4(),
      title: title || file.name,
      description: description || '',
      fileUrl,
      thumbnailUrl,
      fileType: fileType as 'video' | 'photo',
      categories: categories || [],
      dateCreated: new Date(),
      views: 0,
      fileName: file.name,
      fileSize: file.size,
      dimensions,
      optimized: true,
      supabasePath: filePath,
      supabaseThumbnailPath: thumbnailPath,
      storageProvider: 'supabase' as const,
    }
    
    await mediaCollection.insertOne(mediaItem)
    
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

// GET - Listar arquivos do Supabase Storage
export async function GET(request: NextRequest) {
  try {
    // Buscar todos os itens do MongoDB que estão no Supabase
    const mediaCollection = await getMediaCollection()
    const items = await mediaCollection
      .find({ storageProvider: 'supabase' })
      .sort({ dateCreated: -1 })
      .toArray()
    
    return NextResponse.json({
      success: true,
      media: items.map(item => ({
        ...item,
        _id: item._id?.toString(),
      }))
    })
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    )
  }
}