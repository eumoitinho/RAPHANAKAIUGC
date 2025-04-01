import { NextResponse } from "next/server"
import { getAllMediaItemsServer } from "@/lib/server-firestore"

export async function GET(): Promise<NextResponse> {
  try {
    // Get all media items from Firestore
    const mediaItems = await getAllMediaItemsServer()

    // Calculate stats
    const totalVideos = mediaItems.filter((item) => item.fileType === "video").length
    const totalPhotos = mediaItems.filter((item) => item.fileType === "photo").length
    const totalViews = mediaItems.reduce((sum, item) => sum + (item.views || 0), 0)

    return NextResponse.json({
      success: true,
      metadata: {
        count: mediaItems.length,
        videos: totalVideos,
        photos: totalPhotos,
        views: totalViews,
      },
      environment: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "uffa-expence-tracker-app",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "uffa-expence-tracker-app.appspot.com",
        apiKeyConfigured: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      },
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

