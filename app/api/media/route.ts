import { NextResponse } from "next/server"
import { getAllMediaMetadata, incrementViews } from "@/lib/metadata-storage"

export async function GET(): Promise<NextResponse> {
  try {
    const metadata = await getAllMediaMetadata()
    return NextResponse.json({ media: metadata })
  } catch (error) {
    console.error("Error fetching media metadata:", error)
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

    const success = await incrementViews(id)

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

