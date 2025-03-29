import { NextResponse } from "next/server"
import { bucket } from "@/lib/firebase-admin"
import { v4 as uuidv4 } from "uuid"

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
    const fileName = `${folderPath}/${uuidv4()}.${fileExtension}`

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Create a file in the bucket
    const fileRef = bucket.file(fileName)

    // Upload the file
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    })

    // Make the file publicly accessible
    await fileRef.makePublic()

    // Get the public URL
    const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`

    console.log(`File uploaded successfully: ${fileName}`)

    return NextResponse.json({
      success: true,
      url,
      path: fileName,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

