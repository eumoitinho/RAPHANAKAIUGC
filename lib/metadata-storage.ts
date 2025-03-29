"use server"

import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, increment } from "firebase/firestore"
import { firestore } from "./firebase"

// Define types for our metadata
export type MediaMetadata = {
  id: string
  title: string
  description: string
  fileUrl: string
  thumbnailUrl: string
  fileType: "video" | "photo"
  categories: string[]
  dateCreated: string
  views: number
  fileName: string
}

const MEDIA_COLLECTION = "media"

// Function to get all metadata
export async function getAllMediaMetadata(): Promise<MediaMetadata[]> {
  console.log("getAllMediaMetadata: Attempting to fetch metadata from Firestore")

  try {
    const mediaCollection = collection(firestore, MEDIA_COLLECTION)
    const snapshot = await getDocs(mediaCollection)

    const mediaItems = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
      } as MediaMetadata
    })

    console.log(`getAllMediaMetadata: Successfully retrieved ${mediaItems.length} items`)
    return mediaItems
  } catch (error) {
    console.error("getAllMediaMetadata: Error fetching metadata:", error)
    return []
  }
}

// Function to add a new media item
export async function addMediaItem(item: Omit<MediaMetadata, "id" | "views" | "dateCreated">): Promise<MediaMetadata> {
  try {
    const mediaCollection = collection(firestore, MEDIA_COLLECTION)

    // Create new item with generated fields
    const newItem = {
      ...item,
      views: 0,
      dateCreated: new Date().toISOString(),
    }

    const docRef = await addDoc(mediaCollection, newItem)

    return {
      id: docRef.id,
      ...newItem,
    } as MediaMetadata
  } catch (error) {
    console.error("Error adding media item:", error)
    throw error
  }
}

// Function to update views count
export async function incrementViews(id: string): Promise<boolean> {
  try {
    const mediaDoc = doc(firestore, MEDIA_COLLECTION, id)
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
    const mediaDoc = doc(firestore, MEDIA_COLLECTION, id)
    await deleteDoc(mediaDoc)
    return true
  } catch (error) {
    console.error("Error deleting media item:", error)
    return false
  }
}

