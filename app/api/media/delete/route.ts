import { NextResponse } from 'next/server'
import { MediaService } from '@/lib/media-service'
import { unlink } from 'fs/promises'
import path from 'path'

const mediaService = new MediaService()

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 })
    }

    // Buscar item para obter caminhos dos arquivos
    const mediaItem = await mediaService.getMediaById(id)
    
    if (!mediaItem) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Deletar arquivos do sistema de arquivos
    try {
      const filePath = path.join(process.cwd(), 'public', mediaItem.fileUrl)
      await unlink(filePath)

      if (mediaItem.thumbnailUrl && mediaItem.thumbnailUrl !== mediaItem.fileUrl) {
        const thumbnailPath = path.join(process.cwd(), 'public', mediaItem.thumbnailUrl)
        await unlink(thumbnailPath)
      }
    } catch (fileError) {
      console.error('Error deleting files:', fileError)
      // Continue mesmo se não conseguir deletar os arquivos
    }

    // Deletar do banco de dados
    const success = await mediaService.deleteMedia(id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete from database' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    )
  }
}