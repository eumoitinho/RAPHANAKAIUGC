"use client"

import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: "raphanakaiugc-media.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
}

// Log the storage bucket to help with debugging
console.log("Storage Bucket:", process.env.FIREBASE_STORAGE_BUCKET)

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const clientDb = getFirestore(app)
const clientStorage = getStorage(app)

export { clientDb, clientStorage, app }

// Export storage for use in other files
export const storage = clientStorage

