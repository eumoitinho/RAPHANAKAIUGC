import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

// Configuração do Firebase Admin usando suas variáveis existentes
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    try {
      // Verificar se todas as variáveis necessárias estão presentes
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

      if (!projectId || !clientEmail || !privateKey || !storageBucket) {
        console.error('Firebase credentials missing:', {
          projectId: !!projectId,
          clientEmail: !!clientEmail,
          privateKey: !!privateKey,
          storageBucket: !!storageBucket
        })
        throw new Error('Firebase credentials not configured properly')
      }

      // Limpar e formatar a chave privada
      const formattedPrivateKey = privateKey
        .replace(/\\n/g, '\n')
        .replace(/"/g, '')
        .trim()

      console.log('Initializing Firebase Admin with credentials for project:', projectId)
      
      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        storageBucket,
      })

      console.log('Firebase Admin initialized successfully')
      return app
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error)
      throw error
    }
  }

  return getApps()[0]
}

// Initialize the app
let app: any
let adminDb: any
let adminStorage: any

try {
  app = initializeFirebaseAdmin()
  adminDb = getFirestore(app)
  adminStorage = getStorage(app)
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error)
  // Criar objetos mock para evitar erros
  adminDb = null
  adminStorage = null
}

export { adminDb, adminStorage, app }