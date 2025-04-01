import { NextResponse } from "next/server"
import { addMediaItemServer } from "@/lib/server-firestore"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const data = await request.json()
    console.log("API: POST /api/media/add - Received data:", data)

    // Validate required fields
    if (!data.title || !data.fileUrl || !data.fileType || !data.categories) {
      console.log("API: POST /api/media/add - Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Set default thumbnail URL for photos if not provided
    if (data.fileType === "photo" && !data.thumbnailUrl) {
      data.thumbnailUrl = data.fileUrl
    }

    try {
      // Add the media item
      const newItem = await addMediaItemServer({
        title: data.title,
        description: data.description || "",
        fileUrl: data.fileUrl,
        thumbnailUrl: data.thumbnailUrl || data.fileUrl, // Use file URL as fallback
        fileType: data.fileType,
        categories: data.categories,
        fileName: data.fileName || "",
      })

      console.log("API: POST /api/media/add - Item added successfully:", newItem.id)
      return NextResponse.json({ success: true, item: newItem })
    } catch (error) {
      console.error("API: POST /api/media/add - Error adding item to Firestore:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Error adding item to Firestore" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("API: POST /api/media/add - Error processing request:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

