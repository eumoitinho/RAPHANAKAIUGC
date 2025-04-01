import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse> {
  try {
    // Check Firebase configuration
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "uffa-expence-tracker-app"
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "uffa-expence-tracker-app.appspot.com"
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDe8UsqoUitF8Dto0w2X0ZG558YeFIFlrY"

    // Return the status of our environment variables (without exposing the actual values)
    return NextResponse.json({
      success: true,
      environment: {
        projectId: !!projectId,
        storageBucket: !!storageBucket,
        apiKey: !!apiKey,
      },
      message: "Firebase configuration check completed",
    })
  } catch (error) {
    console.error("Error in Firebase test:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

