import { NextResponse } from "next/server"

export async function GET(): Promise<NextResponse> {
  try {
    // Return Firebase configuration (without sensitive values)
    return NextResponse.json({
      success: true,
      config: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "uffa-expence-tracker-app",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "uffa-expence-tracker-app.appspot.com",
        apiKeyConfigured: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      },
    })
  } catch (error) {
    console.error("Error in Firebase API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

