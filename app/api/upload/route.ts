import { put } from "@vercel/blob"
import { createSignedUploadUrl } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const filename = (formData.get("filename") as string) || file.name

    // Check if BLOB_READ_WRITE_TOKEN is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("Missing BLOB_READ_WRITE_TOKEN environment variable")
      return NextResponse.json({ error: "Server configuration error: Missing Blob token" }, { status: 500 })
    }

    // Upload to Vercel Blob
    console.log(`Uploading file: ${filename}, size: ${file.size} bytes`)
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true, // Ensures unique filenames

    })

    console.log("Upload successful:", blob)
    return NextResponse.json({
      url: blob.url,
      // size: blob.size, // Removed as it does not exist on PutBlobResult
      // uploadedAt: blob.uploadedAt, // Removed as it does not exist on PutBlobResult
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    // Generate a signed upload URL
    const signedUrl = await createSignedUploadUrl({
      access: "public", // Make the file publicly accessible
      expiresIn: "15m", // URL expires in 15 minutes
    })

    return NextResponse.json({ url: signedUrl.url })
  } catch (error) {
    console.error("Error generating signed upload URL:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}