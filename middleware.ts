import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// Ensure upload directories exist
async function ensureUploadDirs() {
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
  } catch (error) {
    console.error("Error creating upload directories:", error)
  }
}

export async function middleware(request: NextRequest) {
  // Try to ensure directories exist, but don't block the request if it fails
  try {
    await ensureUploadDirs()
  } catch (error) {
    console.error("Error in middleware:", error)
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: "/admin/:path*",
}

