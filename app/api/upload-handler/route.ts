import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

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

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/webm","video/mov" , "video/ogg"],
          tokenPayload: JSON.stringify({
            // You can include additional data here that will be available in onUploadCompleted
            timestamp: Date.now(),
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This callback is called when the upload is completed
        // You can use this to update your database or perform other actions
        console.log("Upload completed:", blob, tokenPayload)

        try {
          // You could update a database here
          // const { timestamp } = JSON.parse(tokenPayload);
          // await db.update({ blobUrl: blob.url, uploadedAt: new Date(timestamp) });
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

