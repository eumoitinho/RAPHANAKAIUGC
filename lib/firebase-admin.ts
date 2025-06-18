import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

// Configuração do Firebase Admin para migração
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error('Firebase credentials not configured')
      }

      return initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      })
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error)
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