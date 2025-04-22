import { getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const initializeFirebaseAdmin = (): App => {
  if (getApps().length === 0) {
    try {
      console.log("Initializing Firebase Admin...");

      // Ensure environment variables are properly set
      if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY || !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
        throw new Error("Missing Firebase environment variables. Please check your .env file.");
      }

      // Initialize Firebase Admin SDK
      return initializeApp({
        credential: require("firebase-admin").credential.cert({
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Replace escaped newlines
          project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // Add storage bucket
      });
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error);
      throw error;
    }
  }

  return getApps()[0];
};

// Initialize the app
const app = initializeFirebaseAdmin();

// Get Firestore and Storage instances
const adminDb = getFirestore(app);
const adminStorage = getStorage(app);

export { adminDb, adminStorage, app };