import { listFiles } from "@/lib/firebase-storage"
import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse> {
  try {
    console.log("Listing files from Firebase Storage...")

    // Get all files from both videos and photos directories
    const videoFiles = await listFiles("videos")
    const photoFiles = await listFiles("photos")

    // Combine and format the results to match the expected structure
    const blobs = [...videoFiles, ...photoFiles].map((file) => ({
      url: file.url,
      pathname: file.fullPath,
      size: 0, // Firebase doesn't provide size in listAll, would need additional API calls
      uploadedAt: new Date().toISOString(), // Firebase doesn't provide upload date in listAll
    }))

    console.log(`Found ${blobs.length} files`)

    return NextResponse.json({ blobs })
  } catch (error) {
    console.error("Error listing files:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

