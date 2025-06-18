import { NextResponse } from "next/server"
import { MediaService } from "@/lib/media-service"

const mediaService = new MediaService()

export async function GET(): Promise<NextResponse> {
  console.log("API: GET /api/portfolio - Request received")

  try {
    console.log("API: Fetching media items from MongoDB")
    const mediaItems = await mediaService.getAllMedia()
    console.log(`API: Found ${mediaItems.length} media items`)

    // Sort by upload date (newest first)
    mediaItems.sort((a, b) => {
      const dateA = new Date(a.dateCreated).getTime()
      const dateB = new Date(b.dateCreated).getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      items: mediaItems,
      totalCount: mediaItems.length,
      usingMongoDB: true,
    })
  } catch (error) {
    console.error("API: Error in portfolio endpoint:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        items: [],
      },
      { status: 500 },
    )
  }
}