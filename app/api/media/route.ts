import { NextResponse } from "next/server"
import { getAllMediaMetadata, incrementViews } from "@/lib/metadata-storage"

export async function GET(): Promise<NextResponse> {
  console.log("API: GET /api/media - Request received")
  try {
    const metadata = await getAllMediaMetadata()
    console.log(`API: GET /api/media - Retrieved ${metadata.length} items`)

    if (metadata.length > 0) {
      console.log("API: Media items sample:", metadata.slice(0, 2)) // Log first two items for debugging
    } else {
      console.log("API: No media items found")
    }

    return NextResponse.json({ media: metadata })
  } catch (error) {
    console.error("API: Error fetching media metadata:", error)
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

    console.log(`API: POST /api/media - Incrementing views for item ${id}`)
    const success = await incrementViews(id)

    if (!success) {
      console.log(`API: POST /api/media - Item ${id} not found`)
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    console.log(`API: POST /api/media - Successfully incremented views for item ${id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating view count:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

