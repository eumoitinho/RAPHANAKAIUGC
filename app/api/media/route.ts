import { type NextRequest, NextResponse } from "next/server"
import { getAllMedia, incrementViews, deleteMedia, getMediaById, type MediaItem } from "@/lib/supabase-db"
import { deleteFile, STORAGE_BUCKETS } from "@/lib/supabase"

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("🔄 API: GET /api/media - Request received")

  try {
    console.log("📡 API: Fetching media items from Supabase")
    const mediaItems = await getAllMedia()
    console.log(`✅ API: Found ${mediaItems.length} media items`)

    // Transformar para o formato esperado pelo frontend
    const transformedItems = mediaItems.map((item: MediaItem) => ({
      id: item.id,
      title: item.title || "Sem título",
      description: item.description || "",
      fileUrl: item.file_url,
      thumbnailUrl: item.thumbnail_url || item.file_url,
      fileType: item.file_type,
      categories: item.categories || [],
      dateCreated: item.date_created || item.created_at,
      views: item.views || 0,
      fileName: item.file_name || "",
    }))

    console.log(`📤 API: Returning ${transformedItems.length} items`)

    return NextResponse.json({
      media: transformedItems,
      totalCount: transformedItems.length,
      success: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ API: Error in media endpoint:", error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        error: errorMessage,
        media: [],
        totalCount: 0,
        success: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log("📝 API: POST /api/media - Request received")

  try {
    const body = await request.json()
    console.log("📦 API: Request body:", body)

    const { id } = body

    // Handle view increment
    if (id) {
      console.log(`👁️ API: Incrementing views for media ID: ${id}`)
      await incrementViews(id)
      console.log("✅ API: Views incremented successfully")

      return NextResponse.json({
        success: true,
        message: "Views incremented",
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({ 
      error: "ID is required for view increment", 
      success: false 
    }, { status: 400 })

  } catch (error) {
    console.error("❌ API: Error in POST request:", error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// DELETE - Remover mídia
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  console.log("🗑️ API: DELETE /api/media - Request received")

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID is required", success: false },
        { status: 400 }
      )
    }

    console.log(`🗑️ API: Deleting media with ID: ${id}`)
    
    // Primeiro, buscar o item para obter os caminhos dos arquivos
    const mediaItem = await getMediaById(id)
    
    if (mediaItem) {
      console.log('📁 Media item encontrado:', mediaItem)
      
      // Deletar arquivos do Supabase Storage
      const filesToDelete = []
      
      if (mediaItem.supabase_path) {
        const bucket = mediaItem.file_type === 'video' ? STORAGE_BUCKETS.VIDEOS : STORAGE_BUCKETS.IMAGES
        filesToDelete.push({ bucket, path: mediaItem.supabase_path })
        console.log('📁 Arquivo para deletar:', { bucket, path: mediaItem.supabase_path })
      }
      
      if (mediaItem.supabase_thumbnail_path) {
        filesToDelete.push({ bucket: STORAGE_BUCKETS.THUMBNAILS, path: mediaItem.supabase_thumbnail_path })
        console.log('🖼️ Thumbnail para deletar:', { bucket: STORAGE_BUCKETS.THUMBNAILS, path: mediaItem.supabase_thumbnail_path })
      }

      // Deletar arquivos do Storage
      for (const file of filesToDelete) {
        try {
          console.log('🗑️ Deletando do storage:', file)
          await deleteFile(file.bucket, [file.path])
          console.log('✅ Storage deletado:', file)
        } catch (storageError) {
          console.warn('⚠️ Erro ao deletar do storage (continuando):', storageError)
        }
      }
    }
    
    // Deletar do banco de dados
    await deleteMedia(id)
    console.log("✅ API: Media deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Media deleted",
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error("❌ API: Error in DELETE request:", error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}