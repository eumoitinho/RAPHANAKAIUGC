"use server"

import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, increment } from "firebase/firestore"
import { clientDb } from "./firebase"
import { v4 as uuidv4 } from "uuid"
import { writeFile, readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { mkdir } from "fs/promises"

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
const LOCAL_METADATA_FILE = join(process.cwd(), "public", "uploads", "metadata.json")

// Ensure the metadata file exists
async function ensureMetadataFile() {
  const dir = join(process.cwd(), "public", "uploads")

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  if (!existsSync(LOCAL_METADATA_FILE)) {
    await writeFile(LOCAL_METADATA_FILE, JSON.stringify([]))
  }
}

// Function to get all metadata
export async function getAllMediaMetadata(): Promise<MediaMetadata[]> {
  console.log("getAllMediaMetadata: Attempting to fetch metadata")

  try {
    // Try to use Firestore first
    try {
      console.log("getAllMediaMetadata: Trying Firestore")
      const mediaCollection = collection(clientDb, MEDIA_COLLECTION)
      const snapshot = await getDocs(mediaCollection)

      const mediaItems = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
        } as MediaMetadata
      })

      console.log(`getAllMediaMetadata: Successfully retrieved ${mediaItems.length} items from Firestore`)
      return mediaItems
    } catch (firestoreError) {
      console.error("getAllMediaMetadata: Firestore error, falling back to local storage:", firestoreError)

      // Fall back to local storage
      await ensureMetadataFile()
      const data = await readFile(LOCAL_METADATA_FILE, "utf-8")
      const mediaItems = JSON.parse(data) as MediaMetadata[]

      console.log(`getAllMediaMetadata: Retrieved ${mediaItems.length} items from local storage`)
      return mediaItems
    }
  } catch (error) {
    console.error("getAllMediaMetadata: Error fetching metadata:", error)
    return []
  }
}

// Function to add a new media item
export async function addMediaItem(item: Omit<MediaMetadata, "id" | "views" | "dateCreated">): Promise<MediaMetadata> {
  try {
    // Create new item with generated fields
    const newItem = {
      ...item,
      id: uuidv4(),
      views: 0,
      dateCreated: new Date().toISOString(),
    } as MediaMetadata

    // Try to use Firestore first
    try {
      console.log("addMediaItem: Trying Firestore")
      const mediaCollection = collection(clientDb, MEDIA_COLLECTION)
      const docRef = await addDoc(mediaCollection, newItem)

      return {
        ...newItem,
        id: docRef.id,
      }
    } catch (firestoreError) {
      console.error("addMediaItem: Firestore error, falling back to local storage:", firestoreError)

      // Fall back to local storage
      await ensureMetadataFile()
      const data = await readFile(LOCAL_METADATA_FILE, "utf-8")
      const mediaItems = JSON.parse(data) as MediaMetadata[]

      mediaItems.push(newItem)
      await writeFile(LOCAL_METADATA_FILE, JSON.stringify(mediaItems, null, 2))

      console.log("addMediaItem: Item added to local storage")
      return newItem
    }
  } catch (error) {
    console.error("Error adding media item:", error)
    throw error
  }
}

// Function to update views count
export async function incrementViews(id: string): Promise<boolean> {
  try {
    // Try to use Firestore first
    try {
      console.log("incrementViews: Trying Firestore")
      const mediaDoc = doc(clientDb, MEDIA_COLLECTION, id)
      await updateDoc(mediaDoc, {
        views: increment(1),
      })
      return true
    } catch (firestoreError) {
      console.error("incrementViews: Firestore error, falling back to local storage:", firestoreError)

      // Fall back to local storage
      await ensureMetadataFile()
      const data = await readFile(LOCAL_METADATA_FILE, "utf-8")
      const mediaItems = JSON.parse(data) as MediaMetadata[]

      const index = mediaItems.findIndex((item) => item.id === id)
      if (index === -1) return false

      mediaItems[index].views = (mediaItems[index].views || 0) + 1
      await writeFile(LOCAL_METADATA_FILE, JSON.stringify(mediaItems, null, 2))

      return true
    }
  } catch (error) {
    console.error("Error incrementing views:", error)
    return false
  }
}

// Function to delete a media item
export async function deleteMediaItem(id: string): Promise<boolean> {
  try {
    // Try to use Firestore first
    try {
      console.log("deleteMediaItem: Trying Firestore")
      const mediaDoc = doc(clientDb, MEDIA_COLLECTION, id)
      await deleteDoc(mediaDoc)
      return true
    } catch (firestoreError) {
      console.error("deleteMediaItem: Firestore error, falling back to local storage:", firestoreError)

      // Fall back to local storage
      await ensureMetadataFile()
      const data = await readFile(LOCAL_METADATA_FILE, "utf-8")
      const mediaItems = JSON.parse(data) as MediaMetadata[]

      const filteredItems = mediaItems.filter((item) => item.id !== id)
      if (filteredItems.length === mediaItems.length) return false

      await writeFile(LOCAL_METADATA_FILE, JSON.stringify(filteredItems, null, 2))

      return true
    }
  } catch (error) {
    console.error("Error deleting media item:", error)
    return false
  }
}

