import { NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

async function getFilesInDirectory(directory: string) {
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
        name: entry.name,
        url: `/${entryPath}`,
        fullPath: entryPath,
        size: fileStat.size,
        uploadedAt: fileStat.mtime.toISOString(),
      })
    } else if (entry.isDirectory()) {
      const subDirFiles = await getFilesInDirectory(entryPath)
      files.push(...subDirFiles)
    }
  }

  return files
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const directory = searchParams.get("directory") || "uploads"

    const files = await getFilesInDirectory(directory)

    return NextResponse.json({
      success: true,
      files,
    })
  } catch (error) {
    console.error("Error listing files:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

