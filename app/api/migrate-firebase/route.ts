import { NextResponse } from 'next/server'
import { MediaService } from '@/lib/media-service'
import { getAllMediaItemsServer } from '@/lib/server-firestore'
import { MediaProcessor } from '@/lib/media-processor'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST() {
  try {
    const mediaService = new MediaService()
    const processor = new MediaProcessor()
    
    // Buscar todos os itens do Firebase
    const firebaseItems = await getAllMediaItemsServer()
    
    const migrationResults = []
    
    for (const item of firebaseItems) {
      try {
        console.log(`Migrating item: ${item.title}`)
        
        // Download do arquivo do Firebase Storage
        const response = await fetch(item.fileUrl)
        if (!response.ok) {
          throw new Error(`Failed to download ${item.fileUrl}`)
        }
        
        const buffer = await response.arrayBuffer()
        const file = new File([buffer], item.fileName || 'unknown', {
          type: item.fileType === 'video' ? 'video/mp4' : 'image/jpeg'
        })
        
        // Processar e otimizar o arquivo
        let processedMedia
        let thumbnailUrl = item.thumbnailUrl
        
        if (item.fileType === 'video') {
          processedMedia = await processor.processVideo(file)
          
          // Se tiver thumbnail, baixar e processar também
          if (item.thumbnailUrl && item.thumbnailUrl !== item.fileUrl) {
            const thumbResponse = await fetch(item.thumbnailUrl)
            if (thumbResponse.ok) {
              const thumbBuffer = await thumbResponse.arrayBuffer()
              const thumbPath = path.join(process.cwd(), 'public', 'uploads', 'thumbnails', `${item.id}.webp`)
              await writeFile(thumbPath, Buffer.from(thumbBuffer))
              thumbnailUrl = `/uploads/thumbnails/${item.id}.webp`
            }
          }
        } else {
          processedMedia = await processor.processImage(file)
          thumbnailUrl = processedMedia.optimizedPath.replace(process.cwd() + '/public', '')
        }
        
        // Criar no MongoDB
        const newItem = await mediaService.createMedia({
          title: item.title,
          description: item.description,
          fileUrl: processedMedia.optimizedPath.replace(process.cwd() + '/public', ''),
          thumbnailUrl,
          fileType: item.fileType,
          categories: item.categories,
          fileName: path.basename(processedMedia.optimizedPath),
          fileSize: processedMedia.fileSize,
          dimensions: processedMedia.dimensions,
          duration: processedMedia.duration,
          optimized: true
        })
        
        // Atualizar views se necessário
        if (item.views > 0) {
          for (let i = 0; i < item.views; i++) {
            await mediaService.incrementViews(newItem.id)
          }
        }
        
        migrationResults.push({
          originalId: item.id,
          newId: newItem.id,
          title: item.title,
          status: 'success',
          originalSize: buffer.byteLength,
          newSize: processedMedia.fileSize,
          compressionRatio: ((buffer.byteLength - processedMedia.fileSize) / buffer.byteLength * 100).toFixed(1) + '%'
        })
        
      } catch (error) {
        console.error(`Error migrating item ${item.id}:`, error)
        migrationResults.push({
          originalId: item.id,
          title: item.title,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Migration completed. ${migrationResults.filter(r => r.status === 'success').length} items migrated successfully.`,
      results: migrationResults
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    )
  }
}