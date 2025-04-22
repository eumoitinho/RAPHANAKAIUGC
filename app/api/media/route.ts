import { NextResponse } from "next/server"
import { getAllMediaItemsServer, incrementViewsServer } from "@/lib/server-firestore"

export async function GET(): Promise<NextResponse> {
  console.log("API: GET /api/media - Request received")
  try {
    const mediaItems = await getAllMediaItemsServer()
    console.log(`API: GET /api/media - Retrieved ${mediaItems.length} items`)
    return NextResponse.json({ media: mediaItems })
  } catch (error) {
    console.error("API: Error fetching media items:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

// Endpoint to increment view count
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    const success = await incrementViewsServer(id)

    if (!success) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating view count:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
