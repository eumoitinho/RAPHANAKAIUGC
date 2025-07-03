import { NextRequest, NextResponse } from 'next/server'
import { MediaProcessor } from '@/lib/media-processor'
import { MediaService } from '@/lib/media-service'
import path from 'path'

// Configurações para Vercel (máximo 60s no plano hobby)
export const maxDuration = 60 // 60 segundos máximo
export const dynamic = 'force-dynamic'

// Configurar limites de tamanho
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length')
    const maxSize = 50 * 1024 * 1024 // 50MB

    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 50MB para processamento rápido.' },
        { status: 413 }
      )
    }

    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const fileType = formData.get('fileType') as 'video' | 'photo'
    const categories = JSON.parse(formData.get('categories') as string)
    const selectedFrame = formData.get('selectedFrame') as string | null

    if (!file || !title || !fileType || !categories) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verificar tamanho do arquivo novamente
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 50MB para processamento rápido.' },
        { status: 413 }
      )
    }

    console.log(`Processing upload: ${file.name}, type: ${fileType}, size: ${file.size} bytes`)

    const processor = new MediaProcessor()
    const mediaService = new MediaService()

    let processedMedia
    let thumbnailUrl = ''

    if (fileType === 'video') {
      processedMedia = await processor.processVideo(file)
      
      if (selectedFrame) {
        thumbnailUrl = await processor.createThumbnailFromFrame(
          selectedFrame, 
          path.basename(processedMedia.optimizedPath, path.extname(processedMedia.optimizedPath))
        )
      } else {
        thumbnailUrl = '/placeholder.svg?height=400&width=300&text=Video'
      }
    } else {
      processedMedia = await processor.processImage(file)
      thumbnailUrl = processedMedia.optimizedPath.replace(process.cwd() + '/public', '')
    }

    // Criar item no banco de dados
    const mediaItem = await mediaService.createMedia({
      title,
      description,
      fileUrl: processedMedia.optimizedPath.replace(process.cwd() + '/public', ''),
      thumbnailUrl,
      fileType,
      categories,
      fileName: path.basename(processedMedia.optimizedPath),
      fileSize: processedMedia.fileSize,
      dimensions: processedMedia.dimensions,
      duration: processedMedia.duration,
      optimized: true
    })

    // Limpar arquivos temporários
    await processor.cleanupTempFiles()

    const compressionRatio = ((file.size - processedMedia.fileSize) / file.size * 100).toFixed(1)

    console.log(`Upload completed: ${mediaItem.id}, compression: ${compressionRatio}%`)

    return NextResponse.json({ 
      success: true, 
      item: mediaItem,
      optimizationInfo: {
        originalSize: file.size,
        optimizedSize: processedMedia.fileSize,
        compressionRatio: compressionRatio + '%'
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    if (error instanceof Error && (
      error.message.includes('PayloadTooLargeError') || 
      error.message.includes('Body exceeded')
    )) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tente um arquivo menor que 50MB.' },
        { status: 413 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}