import { type NextRequest, NextResponse } from "next/server"
import { MediaService } from "@/lib/media-service"

const mediaService = new MediaService()

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("🔄 API: GET /api/media - Request received")

  try {
    console.log("📡 API: Fetching media items from service")
    const mediaItems = await mediaService.getAllMedia()
    console.log(`✅ API: Found ${mediaItems.length} media items`)

    // Log some sample items for debugging
    if (mediaItems.length > 0) {
      console.log("📋 API: Sample media items:")
      mediaItems.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title} (${item.fileType})`)
        console.log(`     Original fields:`, Object.keys(item))
      })
    }

    // Sort by upload date (newest first)
    mediaItems.sort((a, b) => {
      const dateA = new Date(a.dateCreated || (a as any).uploadDate).getTime()
      const dateB = new Date(b.dateCreated || (b as any).uploadDate).getTime()
      return dateB - dateA
    })

    // Transform and validate items to match expected format
    const transformedItems = mediaItems.map((item) => {
      // Handle different field name variations from database
      const fileUrl = item.fileUrl || (item as any).url || ""
      const thumbnailUrl = item.thumbnailUrl || (item as any).thumbnail || ""
      const dateCreated = item.dateCreated || (item as any).uploadDate || new Date().toISOString()

      // Add protocol if missing (para URLs antigas)
      // URLs do Supabase já vêm com protocolo completo
      let processedFileUrl = fileUrl
      let processedThumbnailUrl = thumbnailUrl

      // Apenas adicionar protocolo se for necessário e não for URL do Supabase
      if (processedFileUrl && !processedFileUrl.startsWith("http") && !processedFileUrl.includes('supabase')) {
        processedFileUrl = `https://${processedFileUrl}`
      }
      if (processedThumbnailUrl && !processedThumbnailUrl.startsWith("http") && !processedThumbnailUrl.includes('supabase')) {
        processedThumbnailUrl = `https://${processedThumbnailUrl}`
      }

      return {
        id: item.id || item._id,
        title: item.title || "Sem título",
        description: item.description || "",
        fileUrl: processedFileUrl,
        thumbnailUrl: processedThumbnailUrl,
        fileType: item.fileType,
        categories: item.categories || [],
        dateCreated: dateCreated,
        views: item.views || 0,
        fileName: item.fileName || (item as any).originalName || "",
      }
    })

    // Filter out items without required fields
    const validItems = transformedItems.filter((item) => {
      const isValid = item.id && item.fileUrl && item.fileType
      if (!isValid) {
        console.warn("⚠️ API: Invalid item filtered out:", {
          id: item.id,
          hasFileUrl: !!item.fileUrl,
          hasFileType: !!item.fileType,
        })
      }
      return isValid
    })

    console.log(`📤 API: Returning ${validItems.length} validated items`)

    // Log sample transformed items
    if (validItems.length > 0) {
      console.log("🔄 API: Sample transformed items:")
      validItems.slice(0, 2).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title} (${item.fileType}) - ${item.fileUrl}`)
      })
    }

    return NextResponse.json({
      media: validItems,
      totalCount: validItems.length,
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

    const { action, data, id } = body

    // Handle media creation (for migration)
    if (action === 'create' && data) {
      console.log(`📝 API: Creating new media item: ${data.title}`)
      
      const newMedia = await mediaService.createMedia(data)
      console.log("✅ API: Media created successfully")

      return NextResponse.json({
        success: true,
        id: newMedia.id,
        message: "Media created",
        timestamp: new Date().toISOString(),
      })
    }

    // Handle view increment (existing functionality)
    if (id) {
      console.log(`👁️ API: Incrementing views for media ID: ${id}`)
      await mediaService.incrementViews(id)
      console.log("✅ API: Views incremented successfully")

      return NextResponse.json({
        success: true,
        message: "Views incremented",
        timestamp: new Date().toISOString(),
      })
    }

    console.warn("⚠️ API: No valid action or ID provided")
    return NextResponse.json({ 
      error: "Either action='create' with data, or id for view increment is required", 
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
    await mediaService.deleteMedia(id)
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
