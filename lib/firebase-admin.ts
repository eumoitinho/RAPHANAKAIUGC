import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"

// Initialize Firebase Admin SDK for server-side operations
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // Use environment variables or service account directly
    var admin = require("firebase-admin");

    var serviceAccount = require("../cert/uffa-expence-tracker-app-52c615657448.json");

    try {
      // If we have service account credentials, use them
      if (admin && serviceAccount) {
        console.log("Initializing Firebase Admin with service account credentials")
        return admin.initializeApp({
          credential: admin.credential.cert({
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY,
            project_id: 'uffa-expence-tracker-app'
          }),
          databaseURL: 'https://v0-raphanakaiugc.vercel.app/'
        });
      }

      // Otherwise initialize with just the project ID (works on Vercel with linked Firebase)
      console.log("Initializing Firebase Admin with application default credentials")
      return admin.initializeApp({
        credential: admin.credential.cert({
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          private_key: process.env.FIREBASE_PRIVATE_KEY,
          project_id: 'uffa-expence-tracker-app'
        }),
        databaseURL: 'https://v0-raphanakaiugc.vercel.app/'
      });
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error)
      throw error
    }
  }

  return getApps()[0]
}

// Initialize the app
const app = initializeFirebaseAdmin()

// Get Firestore and Storage instances
const adminDb = getFirestore(app)
const adminStorage = getStorage(app)

export { adminDb, adminStorage, app }

