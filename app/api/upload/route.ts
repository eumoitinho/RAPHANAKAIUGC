import { NextResponse } from "next/server"
import { uploadFile } from "@/lib/firebase-storage"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const filename = (formData.get("filename") as string) || file.name
    const fileType = file.type.startsWith("video/") ? "videos" : "photos"

    // Upload to Firebase Storage
    console.log(`Uploading file: ${filename}, size: ${file.size} bytes`)
    const result = await uploadFile(file, fileType)

    console.log("Upload successful:", result)
    return NextResponse.json({
      url: result.url,
      path: result.path,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

