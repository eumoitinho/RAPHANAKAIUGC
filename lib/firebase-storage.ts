"use client"

import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage"
import { storage } from "./firebase"
import { v4 as uuidv4 } from "uuid"

// Upload a file to Firebase Storage
export async function uploadFile(file: File, path = ""): Promise<{ url: string; path: string }> {
  try {
    // Generate a unique filename
    const fileExtension = file.name.split(".").pop() || ""
    const uniqueId = uuidv4()
    const fileName = `${uniqueId}.${fileExtension}`

    // Create the full path
    const fullPath = path ? `${path}/${fileName}` : fileName

    // Create a reference to the file location
    const storageRef = ref(storage, fullPath)

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file)
    console.log("File uploaded successfully:", snapshot)

    // Get the download URL
    const url = await getDownloadURL(snapshot.ref)

    return { url, path: fullPath }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

// List all files in a directory
export async function listFiles(directory = ""): Promise<{ name: string; url: string; fullPath: string }[]> {
  try {
    const listRef = ref(storage, directory)
    const res = await listAll(listRef)

    const files = await Promise.all(
      res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef)
        return {
          name: itemRef.name,
          url,
          fullPath: itemRef.fullPath,
        }
      }),
    )

    return files
  } catch (error) {
    console.error("Error listing files:", error)
    throw error
  }
}

// Delete a file
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const fileRef = ref(storage, filePath)
    await deleteObject(fileRef)
    return true
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

// Get a file's URL
export async function getFileUrl(filePath: string): Promise<string> {
  try {
    const fileRef = ref(storage, filePath)
    return await getDownloadURL(fileRef)
  } catch (error) {
    console.error("Error getting file URL:", error)
    throw error
  }
}
