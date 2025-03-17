import { NextResponse } from "next/server"
import { addMediaItem } from "@/lib/metadata-storage"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const data = await request.json()
    console.log("API: POST /api/media/add - Request received", data.title)

    // Validate required fields
    if (!data.title || !data.fileUrl || !data.thumbnailUrl || !data.fileType || !data.categories) {
      console.log("API: POST /api/media/add - Missing required fields")
      return NextResponse.json(
        {
          error: "Missing required fields",
          receivedData: {
            title: !!data.title,
            fileUrl: !!data.fileUrl,
            thumbnailUrl: !!data.thumbnailUrl,
            fileType: !!data.fileType,
            categories: !!data.categories,
          },
        },
        { status: 400 },
      )
    }

    // Add the media item
    console.log("API: POST /api/media/add - Adding media item")
    const newItem = await addMediaItem({
      title: data.title,
      description: data.description || "",
      fileUrl: data.fileUrl,
      thumbnailUrl: data.thumbnailUrl,
      fileType: data.fileType,
      categories: data.categories,
      fileName: data.fileName || "",
    })

    console.log("API: POST /api/media/add - Item added successfully", newItem.id)
    return NextResponse.json({ success: true, item: newItem })
  } catch (error) {
    console.error("API: Error adding media item:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

