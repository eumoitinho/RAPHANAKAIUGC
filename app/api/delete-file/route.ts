import { NextResponse } from "next/server"
import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getStorage } from "firebase-admin/storage"

// Initialize Firebase Admin if it hasn't been initialized yet
let app
try {
  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  } else {
    app = getApps()[0]
  }
} catch (error) {
  console.error("Firebase admin initialization error:", error)
  // Continue with the app if it's already initialized
}

const adminStorage = getStorage(app)
const bucket = adminStorage.bucket()

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")

    if (!path) {
      return NextResponse.json({ error: "Path parameter is required" }, { status: 400 })
    }

    // Delete the file
    await bucket.file(path).delete()

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

