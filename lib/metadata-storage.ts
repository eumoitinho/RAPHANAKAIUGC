"use server"

import { put, get } from "@vercel/blob"

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

const METADATA_FILE = "media-metadata.json"

// Function to get all metadata
export async function getAllMediaMetadata(): Promise<MediaMetadata[]> {
  console.log("getAllMediaMetadata: Attempting to fetch metadata from Blob storage")
  try {
    // Try to get the metadata file from Blob storage
    const metadataBlob = await get(METADATA_FILE)

    if (metadataBlob) {
      // If file exists, parse and return the metadata
      console.log("getAllMediaMetadata: Metadata file found in Blob storage")
      const metadataText = await metadataBlob.text()
      const parsedData = JSON.parse(metadataText)
      console.log(`getAllMediaMetadata: Successfully parsed ${parsedData.length} items`)
      return parsedData
    } else {
      // If file doesn't exist yet, return empty array
      console.log("getAllMediaMetadata: No metadata file found in Blob storage")
      return []
    }
  } catch (error) {
    console.error("getAllMediaMetadata: Error fetching metadata:", error)
    return []
  }
}

// Function to save metadata
export async function saveMediaMetadata(metadata: MediaMetadata[]): Promise<boolean> {
  try {
    // Convert metadata to JSON and save to Blob storage
    const metadataJson = JSON.stringify(metadata, null, 2)
    await put(METADATA_FILE, metadataJson, {
      access: "public",
      addRandomSuffix: false, // Use exact filename
      contentType: "application/json",
    })
    return true
  } catch (error) {
    console.error("Error saving metadata:", error)
    return false
  }
}

// Function to add a new media item
export async function addMediaItem(item: Omit<MediaMetadata, "id" | "views" | "dateCreated">): Promise<MediaMetadata> {
  const metadata = await getAllMediaMetadata()

  // Create new item with generated fields
  const newItem: MediaMetadata = {
    id: generateId(),
    ...item,
    views: 0,
    dateCreated: new Date().toISOString(),
  }

  // Add to metadata and save
  metadata.push(newItem)
  await saveMediaMetadata(metadata)

  return newItem
}

// Function to update views count
export async function incrementViews(id: string): Promise<boolean> {
  const metadata = await getAllMediaMetadata()
  const index = metadata.findIndex((item) => item.id === id)

  if (index === -1) return false

  metadata[index].views += 1
  return await saveMediaMetadata(metadata)
}

// Function to delete a media item (doesn't delete the actual blob)
export async function deleteMediaItem(id: string): Promise<boolean> {
  const metadata = await getAllMediaMetadata()
  const filteredMetadata = metadata.filter((item) => item.id !== id)

  if (filteredMetadata.length === metadata.length) {
    return false // Item not found
  }

  return await saveMediaMetadata(filteredMetadata)
}

// Helper function to generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

