import { adminDb } from "./firebase-admin"
import { Timestamp, FieldValue } from "firebase-admin/firestore"

// Define types for our media items (same as client-side)
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

// Server-side function to get all media items
export async function getAllMediaItemsServer(): Promise<MediaItem[]> {
  console.log("getAllMediaItemsServer: Fetching from Firestore (server-side)")

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

    console.log(`getAllMediaItemsServer: Retrieved ${mediaItems.length} items from Firestore`)
    return mediaItems
  } catch (error) {
    console.error("getAllMediaItemsServer: Firestore error:", error)
    throw error
  }
}

// Server-side function to increment views
export async function incrementViewsServer(id: string): Promise<boolean> {
  try {
    console.log("incrementViewsServer: Updating in Firestore (server-side)")
    const mediaDoc = adminDb.collection(MEDIA_COLLECTION).doc(id)
    await mediaDoc.update({
      views: FieldValue.increment(1),
    })
    return true
  } catch (error) {
    console.error("Error incrementing views:", error)
    return false
  }
}

// Server-side function to delete a media item
export async function deleteMediaItemServer(id: string): Promise<boolean> {
  try {
    console.log("deleteMediaItemServer: Deleting from Firestore (server-side)")
    const mediaDoc = adminDb.collection(MEDIA_COLLECTION).doc(id)
    await mediaDoc.delete()
    return true
  } catch (error) {
    console.error("Error deleting media item:", error)
    return false
  }
}

// Server-side function to add a media item
export async function addMediaItemServer(item: Omit<MediaItem, "id" | "views" | "dateCreated">): Promise<MediaItem> {
  try {
    // Create new item with generated fields
    const newItem = {
      ...item,
      views: 0,
      dateCreated: Timestamp.now(),
    }

    console.log("addMediaItemServer: Adding to Firestore (server-side)", newItem)
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
