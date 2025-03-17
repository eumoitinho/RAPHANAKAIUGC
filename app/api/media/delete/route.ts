import { NextResponse } from "next/server"
import { deleteMediaItem } from "@/lib/metadata-storage"
import { del } from "@vercel/blob"

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const fileUrl = searchParams.get("fileUrl")
    const thumbnailUrl = searchParams.get("thumbnailUrl")

    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    console.log(`API: DELETE /api/media/delete - Deleting media item ${id}`)

    // Delete the media item from metadata
    const success = await deleteMediaItem(id)

    if (!success) {
      console.log(`API: DELETE /api/media/delete - Item ${id} not found`)
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Try to delete the actual files from Blob storage if URLs are provided
    const deletePromises = []

    if (fileUrl) {
      console.log(`API: DELETE /api/media/delete - Deleting file ${fileUrl}`)
      deletePromises.push(
        del(fileUrl).catch((error) => {
          console.error(`Failed to delete file ${fileUrl}:`, error)
        }),
      )
    }

    if (thumbnailUrl) {
      console.log(`API: DELETE /api/media/delete - Deleting thumbnail ${thumbnailUrl}`)
      deletePromises.push(
        del(thumbnailUrl).catch((error) => {
          console.error(`Failed to delete thumbnail ${thumbnailUrl}:`, error)
        }),
      )
    }

    // Wait for all delete operations to complete
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises)
    }

    console.log(`API: DELETE /api/media/delete - Successfully deleted item ${id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting media item:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

