import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { addMediaItem } from "@/lib/metadata-storage"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // This is where you would authenticate users before generating the token
        // For example: const { user } = await auth(request);
        // if (!user) throw new Error("Not authenticated");

        // Extract metadata from the tokenPayload if provided
        const clientPayload = body.clientPayload ? JSON.parse(body.clientPayload) : {}

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
        console.log("Upload completed:", blob, tokenPayload)

        try {
          // Parse the token payload to get metadata
          const payload = JSON.parse(tokenPayload)

          // If this is a media file (not a thumbnail) and has metadata, save it
          if (payload.metadata && !blob.pathname.includes("thumbnail-")) {
            await addMediaItem({
              title: payload.metadata.title,
              description: payload.metadata.description || "",
              fileUrl: blob.url,
              thumbnailUrl: payload.thumbnailUrl || "",
              fileType: payload.metadata.fileType,
              categories: payload.metadata.categories,
              fileName: blob.pathname,
            })
          }

          // If this is a thumbnail, update the corresponding media item
          if (blob.pathname.includes("thumbnail-") && payload.mediaId) {
            // This would be implemented in a real database scenario
            // For now, we'll handle this in the client-side upload
          }
        } catch (error) {
          console.error("Error in onUploadCompleted:", error)
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Error handling upload:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

