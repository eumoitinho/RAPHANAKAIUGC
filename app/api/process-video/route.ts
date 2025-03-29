import { NextResponse } from "next/server"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const videoFile = formData.get("video") as File

    if (!videoFile) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
    }

    // For now, we're just uploading the original video
    // In a production environment, you would implement server-side video processing here

    const timestamp = Date.now()
    const filename = `videos/processed-${timestamp}-${videoFile.name}`
    const storageRef = ref(storage, filename)

    await uploadBytes(storageRef, await videoFile.arrayBuffer())
    const url = await getDownloadURL(storageRef)

    return NextResponse.json({
      success: true,
      url,
      path: filename,
    })
  } catch (error) {
    console.error("Error processing video:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

