import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { addMediaItem } from "@/lib/metadata-storage"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody
  console.log("Upload handler: Request received", body.pathname)

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        console.log("Upload handler: Generating token for", pathname)
        // Extract metadata from the tokenPayload if provided
        const clientPayload = body.clientPayload ? JSON.parse(body.clientPayload) : {}
        console.log("Upload handler: Client payload", clientPayload)

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm", "video/ogg"],
          tokenPayload: JSON.stringify({
            ...clientPayload,
            timestamp: Date.now(),
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This callback is called when the upload is completed
        console.log("Upload handler: Upload completed for", blob.pathname)
        console.log("Upload handler: Token payload", tokenPayload)

        try {
          // Parse the token payload to get metadata
          const payload = JSON.parse(tokenPayload)

          // If this is a media file (not a thumbnail) and has metadata, save it
          if (payload.metadata && !blob.pathname.includes("thumbnail-")) {
            console.log("Upload handler: Saving metadata for media file", blob.pathname)
            const newItem = await addMediaItem({
              title: payload.metadata.title,
              description: payload.metadata.description || "",
              fileUrl: blob.url,
              thumbnailUrl: payload.thumbnailUrl || "",
              fileType: payload.metadata.fileType,
              categories: payload.metadata.categories,
              fileName: blob.pathname,
            })
            console.log("Upload handler: Metadata saved successfully", newItem.id)
          }

          // If this is a thumbnail, update the corresponding media item
          if (blob.pathname.includes("thumbnail-") && payload.mediaId) {
            console.log("Upload handler: This is a thumbnail for media ID", payload.mediaId)
            // This would be implemented in a real database scenario
            // For now, we'll handle this in the client-side upload
          }
        } catch (error) {
          console.error("Upload handler: Error in onUploadCompleted:", error)
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Upload handler: Error handling upload:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

