import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse> {
  try {
    // Check if BLOB_READ_WRITE_TOKEN is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("Missing BLOB_READ_WRITE_TOKEN environment variable")
      return NextResponse.json({ error: "Server configuration error: Missing Blob token" }, { status: 500 })
    }

    console.log("Listing blobs...")
    const blobs = await list()
    console.log(`Found ${blobs.blobs.length} blobs`)

    return NextResponse.json(blobs)
  } catch (error) {
    console.error("Error listing blobs:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

