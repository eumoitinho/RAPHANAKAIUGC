import { NextResponse } from "next/server"
import { addMediaItem } from "@/lib/metadata-storage"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.title || !data.fileUrl || !data.fileType || !data.categories) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Set default thumbnail URL for photos if not provided
    if (data.fileType === "photo" && !data.thumbnailUrl) {
      data.thumbnailUrl = data.fileUrl
    }

    // Add the media item
    const newItem = await addMediaItem({
      title: data.title,
      description: data.description || "",
      fileUrl: data.fileUrl,
      thumbnailUrl: data.thumbnailUrl || data.fileUrl, // Use file URL as fallback
      fileType: data.fileType,
      categories: data.categories,
      fileName: data.fileName || "",
    })

    return NextResponse.json({ success: true, item: newItem })
  } catch (error) {
    console.error("Error adding media item:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

