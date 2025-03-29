import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getStorage } from "firebase-admin/storage"
import { getFirestore } from "firebase-admin/firestore"

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    try {
      // Check if we have all required environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET

      if (!projectId || !clientEmail || !privateKey || !storageBucket) {
        throw new Error("Missing Firebase Admin environment variables")
      }

      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
      })

      console.log("Firebase Admin SDK initialized successfully")
      return app
    } catch (error) {
      console.error("Firebase Admin SDK initialization error:", error)
      throw error
    }
  } else {
    return getApps()[0]
  }
}

// Get Firebase Admin app instance
const app = initializeFirebaseAdmin()

// Get Firebase Admin Storage
const adminStorage = getStorage(app)
const bucket = adminStorage.bucket()

// Get Firebase Admin Firestore
const adminFirestore = getFirestore(app)

export { app, adminStorage, bucket, adminFirestore }

