import { NextResponse } from "next/server"
import { deleteMediaItemServer } from "@/lib/server-firestore"
import { adminStorage } from "@/lib/firebase-admin"

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const filePath = searchParams.get("filePath")
    const thumbnailPath = searchParams.get("thumbnailPath")
    const bucketName = "uffa-expence-tracker-app.appspot.com"

    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    console.log(`API: DELETE /api/media/delete - Deleting media item ${id}`)

    // Delete the media item from Firestore
    const success = await deleteMediaItemServer(id)

    if (!success) {
      console.log(`API: DELETE /api/media/delete - Item ${id} not found`)
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Try to delete the actual files from Firebase Storage if paths are provided
    const deletePromises = []

    if (filePath) {
      console.log(`API: DELETE /api/media/delete - Deleting file ${filePath}`)
      deletePromises.push(
        adminStorage
          .bucket()
          .file(filePath)
          .delete()
          .catch((error) => {
            console.error(`Failed to delete file ${filePath}:`, error)
          }),
      )
    }

    if (thumbnailPath) {
      console.log(`API: DELETE /api/media/delete - Deleting thumbnail ${thumbnailPath}`)
      deletePromises.push(
        adminStorage
          .bucket()
          .file(thumbnailPath)
          .delete()
          .catch((error) => {
            console.error(`Failed to delete thumbnail ${thumbnailPath}:`, error)
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
