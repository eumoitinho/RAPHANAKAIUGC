import { NextResponse } from "next/server"
import { getAllMediaItemsServer } from "@/lib/server-firestore"

export async function GET(): Promise<NextResponse> {
  console.log("API: GET /api/portfolio - Request received")

  try {
    // Get all media items from Firestore
    console.log("API: Fetching media items from Firestore")
    const mediaItems = await getAllMediaItemsServer()
    console.log(`API: Found ${mediaItems.length} media items`)

    // Sort by upload date (newest first)
    mediaItems.sort((a, b) => {
      const dateA = new Date(a.dateCreated as string).getTime()
      const dateB = new Date(b.dateCreated as string).getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      items: mediaItems,
      totalCount: mediaItems.length,
      usingFirestore: true,
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

