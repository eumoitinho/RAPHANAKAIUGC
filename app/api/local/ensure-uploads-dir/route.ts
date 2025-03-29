import { NextResponse } from "next/server"
import { mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// This route ensures that the uploads directory exists
export async function GET(): Promise<NextResponse> {
  try {
    const publicDir = join(process.cwd(), "public")
    const uploadsDir = join(publicDir, "uploads")
    const videosDir = join(uploadsDir, "videos")
    const photosDir = join(uploadsDir, "photos")
    const thumbnailsDir = join(uploadsDir, "thumbnails")

    // Create directories if they don't exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
      console.log("Created uploads directory")
    }

    if (!existsSync(videosDir)) {
      await mkdir(videosDir, { recursive: true })
      console.log("Created videos directory")
    }

    if (!existsSync(photosDir)) {
      await mkdir(photosDir, { recursive: true })
      console.log("Created photos directory")
    }

    if (!existsSync(thumbnailsDir)) {
      await mkdir(thumbnailsDir, { recursive: true })
      console.log("Created thumbnails directory")
    }

    return NextResponse.json({
      success: true,
      message: "Upload directories created successfully",
    })
  } catch (error) {
    console.error("Error creating upload directories:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

