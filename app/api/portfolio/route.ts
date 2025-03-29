import { NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { getAllMediaMetadata } from "@/lib/metadata-storage"

// Function to extract the file type from the path
function getFileTypeFromPath(pathname: string): "video" | "photo" {
  const lowerPath = pathname.toLowerCase()

  if (
    lowerPath.includes("videos/") ||
    lowerPath.endsWith(".mp4") ||
    lowerPath.endsWith(".webm") ||
    lowerPath.endsWith(".mov")
  ) {
    return "video"
  }

  return "photo"
}

// Function to extract categories from the path (fallback)
function getCategoriesFromPath(pathname: string): string[] {
  // Extract the filename without the path
  const filename = pathname.split("/").pop() || ""

  // Default categories if we can't extract any
  const defaultCategories = ["Sem categoria"]

  // If the filename contains certain keywords, we can use them as categories
  const possibleCategories = []

  if (filename.toLowerCase().includes("beauty")) possibleCategories.push("Beauty")
  if (filename.toLowerCase().includes("fashion") || filename.toLowerCase().includes("moda"))
    possibleCategories.push("Moda")
  if (filename.toLowerCase().includes("food") || filename.toLowerCase().includes("comida"))
    possibleCategories.push("Receitas")
  if (filename.toLowerCase().includes("pet")) possibleCategories.push("Pet")
  if (filename.toLowerCase().includes("decor")) possibleCategories.push("Decor")
  if (filename.toLowerCase().includes("wellness")) possibleCategories.push("Wellness")
  if (filename.toLowerCase().includes("ad") || filename.toLowerCase().includes("ads")) possibleCategories.push("ADS")

  return possibleCategories.length > 0 ? possibleCategories : defaultCategories
}

// Function to get all files in the uploads directory
async function getAllFiles(directory: string) {
  const files = []
  const fullPath = join(process.cwd(), "public", directory)

  if (!existsSync(fullPath)) {
    return []
  }

  const entries = await readdir(fullPath, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = join(directory, entry.name)
    const fullEntryPath = join(fullPath, entry.name)

    if (entry.isFile()) {
      const fileStat = await stat(fullEntryPath)
      files.push({
        url: `/${entryPath}`,
        pathname: entryPath,
        size: fileStat.size,
        uploadedAt: fileStat.mtime.toISOString(),
      })
    } else if (entry.isDirectory()) {
      const subDirFiles = await getAllFiles(entryPath)
      files.push(...subDirFiles)
    }
  }

  return files
}

export async function GET(): Promise<NextResponse> {
  console.log("API: GET /api/portfolio - Request received")

  try {
    // Get all files from the uploads directory
    console.log("API: Fetching files from local storage")
    const files = await getAllFiles("uploads")
    console.log(`API: Found ${files.length} files`)

    // Try to fetch metadata (but don't fail if we can't)
    let metadata: any[] = []
    try {
      console.log("API: Fetching metadata")
      metadata = await getAllMediaMetadata()
      console.log(`API: Found ${metadata.length} metadata items`)
    } catch (metadataError) {
      console.error("API: Error fetching metadata, will use file info only:", metadataError)
    }

    // Create a map of URLs to metadata for easy lookup
    const metadataMap = new Map()
    metadata.forEach((item) => {
      metadataMap.set(item.fileUrl, item)

      // Also map by filename, in case the full URL doesn't match
      if (item.fileName) {
        metadataMap.set(item.fileName, item)
      }
    })

    // Filter out non-media files
    const mediaFiles = files.filter((file) => {
      const path = file.pathname.toLowerCase()
      return (
        !path.includes("metadata.json") &&
        !path.includes("portfolio-metadata.json") &&
        (path.includes("videos/") ||
          path.includes("photos/") ||
          path.endsWith(".jpg") ||
          path.endsWith(".jpeg") ||
          path.endsWith(".png") ||
          path.endsWith(".gif") ||
          path.endsWith(".mp4") ||
          path.endsWith(".webm") ||
          path.endsWith(".mov"))
      )
    })

    // Separate thumbnails and main files
    const thumbnails = files.filter((file) => file.pathname.toLowerCase().includes("thumbnails/"))
    const thumbnailMap = new Map()

    // Create a map of thumbnails for easy association
    thumbnails.forEach((thumb) => {
      // Extract the ID or part of the name that might correspond to the main file
      const filename = thumb.pathname.split("/").pop() || ""
      const baseNameMatch = filename.match(/thumbnail-([^-]+)/)

      if (baseNameMatch && baseNameMatch[1]) {
        thumbnailMap.set(baseNameMatch[1], thumb.url)
      }

      // Also store the full path
      thumbnailMap.set(thumb.pathname, thumb.url)
    })

    // Combine files with metadata
    const portfolioItems = mediaFiles.map((file) => {
      // Check if we have metadata for this file
      const metadata = metadataMap.get(file.url) || metadataMap.get(file.pathname)

      // If we have metadata, use it
      if (metadata) {
        return {
          ...metadata,
          // Ensure we use the file URL even if the metadata has a different URL
          fileUrl: file.url,
          // Add file info that might not be in the metadata
          size: file.size,
          uploadedAt: file.uploadedAt,
        }
      }

      // Otherwise, create an item with the file info
      const filename = file.pathname.split("/").pop() || "Unnamed file"
      const fileType = getFileTypeFromPath(file.pathname)

      // Try to find a matching thumbnail
      let thumbnailUrl = null
      const baseNameMatch = filename.match(/([^-]+)/)
      if (baseNameMatch && baseNameMatch[1]) {
        thumbnailUrl = thumbnailMap.get(baseNameMatch[1])
      }

      // If we didn't find one, use a generic thumbnail based on the type
      if (!thumbnailUrl) {
        thumbnailUrl = fileType === "video" ? "/placeholder.svg?height=400&width=300&text=Video" : file.url // For photos, use the image itself as the thumbnail
      }

      return {
        id: `file-${file.pathname.replace(/[^a-zA-Z0-9]/g, "-")}`,
        title: filename.replace(/\.(jpg|jpeg|png|gif|mp4|webm|mov)$/i, "").replace(/-/g, " "),
        description: `File uploaded on ${new Date(file.uploadedAt).toLocaleDateString()}`,
        fileUrl: file.url,
        thumbnailUrl: thumbnailUrl,
        fileType: fileType,
        categories: getCategoriesFromPath(file.pathname),
        dateCreated: file.uploadedAt,
        views: 0,
        fileName: file.pathname,
        size: file.size,
      }
    })

    // Sort by upload date (newest first)
    portfolioItems.sort((a, b) => {
      const dateA = new Date(a.uploadedAt || a.dateCreated).getTime()
      const dateB = new Date(b.uploadedAt || b.dateCreated).getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      items: portfolioItems,
      totalCount: portfolioItems.length,
      usingLocalStorage: true,
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

