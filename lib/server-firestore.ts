// Este arquivo usa suas credenciais existentes do Firebase para migração
import { adminDb } from './firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export type MediaItem = {
  id: string
  title: string
  description: string
  fileUrl: string
  thumbnailUrl: string
  fileType: "video" | "photo"
  categories: string[]
  dateCreated: string | Timestamp
  views: number
  fileName?: string
}

const MEDIA_COLLECTION = "media"

// Função real para buscar dados do seu Firebase
export async function getAllMediaItemsServer(): Promise<MediaItem[]> {
  console.log("getAllMediaItemsServer: Buscando do seu Firebase...")

  try {
    const mediaCollection = adminDb.collection(MEDIA_COLLECTION)
    const snapshot = await mediaCollection.get()

    const mediaItems = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        dateCreated:
          data.dateCreated instanceof Timestamp
            ? data.dateCreated.toDate().toISOString()
            : data.dateCreated || new Date().toISOString(),
      } as MediaItem
    })

    console.log(`getAllMediaItemsServer: Encontrados ${mediaItems.length} itens no seu Firebase`)
    return mediaItems
  } catch (error) {
    console.error("getAllMediaItemsServer: Erro ao acessar Firebase:", error)
    throw error
  }
}

export async function incrementViewsServer(id: string): Promise<boolean> {
  try {
    console.log("incrementViewsServer: Atualizando no Firebase")
    const mediaDoc = adminDb.collection(MEDIA_COLLECTION).doc(id)
    await mediaDoc.update({
      views: require('firebase-admin').firestore.FieldValue.increment(1),
    })
    return true
  } catch (error) {
    console.error("Error incrementing views:", error)
    return false
  }
}

export async function deleteMediaItemServer(id: string): Promise<boolean> {
  try {
    console.log("deleteMediaItemServer: Deletando do Firebase")
    const mediaDoc = adminDb.collection(MEDIA_COLLECTION).doc(id)
    await mediaDoc.delete()
    return true
  } catch (error) {
    console.error("Error deleting media item:", error)
    return false
  }
}

export async function addMediaItemServer(item: Omit<MediaItem, "id" | "views" | "dateCreated">): Promise<MediaItem> {
  try {
    const newItem = {
      ...item,
      views: 0,
      dateCreated: Timestamp.now(),
    }

    console.log("addMediaItemServer: Adicionando ao Firebase")
    const mediaCollection = adminDb.collection(MEDIA_COLLECTION)
    const docRef = await mediaCollection.add(newItem)

    return {
      ...newItem,
      id: docRef.id,
      dateCreated: new Date().toISOString(),
    } as MediaItem
  } catch (error) {
    console.error("Error adding media item:", error)
    throw error
  }
}