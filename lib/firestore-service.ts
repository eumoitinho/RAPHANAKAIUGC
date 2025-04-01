"use client"

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  getDoc,
  Timestamp,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore"
import { db } from "./firebase"

// Define types for our media items
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

// Function to get all media items
export async function getAllMediaItems(): Promise<MediaItem[]> {
  console.log("getAllMediaItems: Fetching from Firestore")

  try {
    const mediaCollection = collection(db, MEDIA_COLLECTION)
    const snapshot = await getDocs(mediaCollection)

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

    console.log(`getAllMediaItems: Retrieved ${mediaItems.length} items from Firestore`)
    return mediaItems
  } catch (error) {
    console.error("getAllMediaItems: Firestore error:", error)
    throw error
  }
}

// Function to add a new media item
export async function addMediaItem(item: Omit<MediaItem, "id" | "views" | "dateCreated">): Promise<MediaItem> {
  try {
    // Create new item with generated fields
    const newItem = {
      ...item,
      views: 0,
      dateCreated: serverTimestamp(),
    }

    console.log("addMediaItem: Adding to Firestore", newItem)
    const mediaCollection = collection(db, MEDIA_COLLECTION)
    const docRef = await addDoc(mediaCollection, newItem)

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

// Function to update views count
export async function incrementViews(id: string): Promise<boolean> {
  try {
    console.log("incrementViews: Updating in Firestore")
    const mediaDoc = doc(db, MEDIA_COLLECTION, id)
    await updateDoc(mediaDoc, {
      views: increment(1),
    })
    return true
  } catch (error) {
    console.error("Error incrementing views:", error)
    return false
  }
}

// Function to delete a media item
export async function deleteMediaItem(id: string): Promise<boolean> {
  try {
    console.log("deleteMediaItem: Deleting from Firestore")
    const mediaDoc = doc(db, MEDIA_COLLECTION, id)
    await deleteDoc(mediaDoc)
    return true
  } catch (error) {
    console.error("Error deleting media item:", error)
    return false
  }
}

// Function to get media item by ID
export async function getMediaItemById(id: string): Promise<MediaItem | null> {
  try {
    const mediaDoc = doc(db, MEDIA_COLLECTION, id)
    const snapshot = await getDoc(mediaDoc)

    if (!snapshot.exists()) {
      return null
    }

    const data = snapshot.data()
    return {
      id: snapshot.id,
      ...data,
      dateCreated:
        data.dateCreated instanceof Timestamp
          ? data.dateCreated.toDate().toISOString()
          : data.dateCreated || new Date().toISOString(),
    } as MediaItem
  } catch (error) {
    console.error("Error getting media item:", error)
    return null
  }
}

// Function to get media items by category
export async function getMediaItemsByCategory(category: string): Promise<MediaItem[]> {
  try {
    const mediaCollection = collection(db, MEDIA_COLLECTION)
    const q = query(mediaCollection, where("categories", "array-contains", category))
    const snapshot = await getDocs(q)

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

    return mediaItems
  } catch (error) {
    console.error("Error getting media items by category:", error)
    throw error
  }
}

