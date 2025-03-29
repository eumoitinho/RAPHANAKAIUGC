import { NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

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
  try {
    console.log("Listing files from local storage...")

    // Get all files from the uploads directory
    const blobs = await getAllFiles("uploads")

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

