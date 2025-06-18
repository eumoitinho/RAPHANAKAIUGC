import { NextRequest, NextResponse } from 'next/server'
import { MediaProcessor } from '@/lib/media-processor'
import { MediaService } from '@/lib/media-service'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({ 
      success: true, 
      item: mediaItem,
      optimizationInfo: {
        originalSize: file.size,
        optimizedSize: processedMedia.fileSize,
        compressionRatio: ((file.size - processedMedia.fileSize) / file.size * 100).toFixed(1) + '%'
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}