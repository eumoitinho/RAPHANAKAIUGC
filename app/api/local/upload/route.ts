import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { writeFile } from "fs/promises"
import { join } from "path"
import { mkdir } from "fs/promises"
import { existsSync } from "fs"

// Ensure upload directory exists
async function ensureUploadDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Parse the form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folderPath = (formData.get("folderPath") as string) || ""

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`Uploading file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`)

    // Generate a unique filename
    const fileExtension = file.name.split(".").pop() || ""
    const uniqueId = uuidv4()
    const fileName = `${uniqueId}.${fileExtension}`

    // Create directory structure
    const publicDir = join(process.cwd(), "public")
    const uploadsDir = join(publicDir, "uploads")
    const targetDir = join(uploadsDir, folderPath)

    await ensureUploadDir(targetDir)

    // Full path to save the file
    const filePath = join(targetDir, fileName)

    // Convert File to Buffer and save it
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Generate the public URL
    const relativePath = `uploads/${folderPath}/${fileName}`
    const url = `/${relativePath}`

    console.log(`File uploaded successfully: ${fileName}`)

    return NextResponse.json({
      success: true,
      url,
      path: relativePath,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

