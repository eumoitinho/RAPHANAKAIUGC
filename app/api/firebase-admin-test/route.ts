import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse> {
  try {
    // Check if we have all required environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET

    // Return the status of our environment variables (without exposing the actual values)
    return NextResponse.json({
      success: true,
      environment: {
        projectId: !!projectId,
        clientEmail: !!clientEmail,
        privateKey: !!privateKey,
        storageBucket: !!storageBucket,
      },
      message: "Firebase Admin environment variables check completed",
    })
  } catch (error) {
    console.error("Error in Firebase Admin test:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

