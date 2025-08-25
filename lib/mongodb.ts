import { MongoClient, Db, Collection, ObjectId } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const dbName = process.env.MONGODB_DB_NAME || 'raphanakai_portfolio'



let client: MongoClient
let db: Db

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
    db = client.db(dbName)
  }
  return { client, db }
}

export async function getMediaCollection(): Promise<Collection> {
  const { db } = await connectToDatabase()
  return db.collection('media')
}

export type MediaItem = {
  _id?: string
  id: string
  title: string
  description: string
  fileUrl: string // URL do arquivo no Supabase Storage
  thumbnailUrl: string // URL da thumbnail no Supabase Storage
  fileType: 'video' | 'photo'
  categories: string[]
  dateCreated: Date
  views: number
  fileName: string
  fileSize: number
  duration?: number // for videos
  dimensions?: {
    width: number
    height: number
  }
  optimized: boolean
  supabasePath?: string // Caminho do arquivo no Supabase Storage
  supabaseThumbnailPath?: string // Caminho da thumbnail no Supabase Storage
  storageProvider?: 'supabase' | 'local' // Identificar de onde vem o arquivo
}