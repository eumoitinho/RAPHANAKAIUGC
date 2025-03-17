"use server"

import { put, get } from "@vercel/blob"
import { v4 as uuidv4 } from "uuid"

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

// Our metadata storage file
const METADATA_FILE = "portfolio-metadata.json"

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
      console.log("getAllMediaMetadata: No metadata file found in Blob storage, creating new one")
      // Create an empty metadata file
      await saveMediaMetadata([])
      return []
    }
  } catch (error) {
    console.error("getAllMediaMetadata: Error fetching metadata:", error)
    // If there's an error, try to create a new metadata file
    try {
      await saveMediaMetadata([])
      return []
    } catch (innerError) {
      console.error("Failed to create new metadata file:", innerError)
      return []
    }
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
    console.log(`saveMediaMetadata: Successfully saved ${metadata.length} items to metadata file`)
    return true
  } catch (error) {
    console.error("Error saving metadata:", error)
    return false
  }
}

// Function to add a new media item
export async function addMediaItem(item: Omit<MediaMetadata, "id" | "views" | "dateCreated">): Promise<MediaMetadata> {
  console.log("addMediaItem: Adding new item", item.title)
  const metadata = await getAllMediaMetadata()

  // Create new item with generated fields
  const newItem: MediaMetadata = {
    id: uuidv4(), // Using UUID for more reliable unique IDs
    ...item,
    views: 0,
    dateCreated: new Date().toISOString(),
  }

  console.log("addMediaItem: Created new item with ID", newItem.id)

  // Add to metadata and save
  metadata.push(newItem)
  const success = await saveMediaMetadata(metadata)

  if (!success) {
    console.error("addMediaItem: Failed to save metadata")
    throw new Error("Failed to save metadata")
  }

  return newItem
}

// Function to update views count
export async function incrementViews(id: string): Promise<boolean> {
  console.log("incrementViews: Incrementing views for item", id)
  const metadata = await getAllMediaMetadata()
  const index = metadata.findIndex((item) => item.id === id)

  if (index === -1) {
    console.log("incrementViews: Item not found", id)
    return false
  }

  metadata[index].views += 1
  console.log(`incrementViews: New view count for ${id}: ${metadata[index].views}`)
  return await saveMediaMetadata(metadata)
}

// Function to delete a media item (doesn't delete the actual blob)
export async function deleteMediaItem(id: string): Promise<boolean> {
  console.log("deleteMediaItem: Deleting item", id)
  const metadata = await getAllMediaMetadata()
  const filteredMetadata = metadata.filter((item) => item.id !== id)

  if (filteredMetadata.length === metadata.length) {
    console.log("deleteMediaItem: Item not found", id)
    return false // Item not found
  }

  return await saveMediaMetadata(filteredMetadata)
}

// Function to get metadata stats
export async function getMetadataStats(): Promise<{
  totalItems: number
  videoCount: number
  photoCount: number
  totalViews: number
}> {
  const metadata = await getAllMediaMetadata()

  return {
    totalItems: metadata.length,
    videoCount: metadata.filter((item) => item.fileType === "video").length,
    photoCount: metadata.filter((item) => item.fileType === "photo").length,
    totalViews: metadata.reduce((sum, item) => sum + item.views, 0),
  }
}

// Function to update an existing media item
export async function updateMediaItem(
  id: string,
  updates: Partial<Omit<MediaMetadata, "id" | "dateCreated">>,
): Promise<MediaMetadata | null> {
  console.log("updateMediaItem: Updating item", id)
  const metadata = await getAllMediaMetadata()
  const index = metadata.findIndex((item) => item.id === id)

  if (index === -1) {
    console.log("updateMediaItem: Item not found", id)
    return null
  }

  // Update the item
  metadata[index] = {
    ...metadata[index],
    ...updates,
  }

  const success = await saveMediaMetadata(metadata)

  if (!success) {
    console.error("updateMediaItem: Failed to save metadata")
    return null
  }

  return metadata[index]
}

