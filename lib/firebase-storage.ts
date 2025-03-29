"use client"

import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from "firebase/storage"
import { clientStorage } from "./firebase"
import { v4 as uuidv4 } from "uuid"

// Upload a file to Firebase Storage
export async function uploadFile(file: File, path = ""): Promise<{ url: string; path: string }> {
  try {
    // Check if storage bucket is configured
    const bucket = clientStorage.app.options.storageBucket
    if (!bucket) {
      throw new Error("Firebase Storage bucket is not configured. Please check your environment variables.")
    }

    // Generate a unique filename
    const fileExtension = file.name.split(".").pop()
    const fileName = `${path}/${uuidv4()}.${fileExtension}`
    const storageRef = ref(clientStorage, fileName)

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file)

    // Get the download URL
    const url = await getDownloadURL(snapshot.ref)

    return { url, path: fileName }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

// List all files in a directory
export async function listFiles(directory = ""): Promise<{ name: string; url: string; fullPath: string }[]> {
  try {
    // Check if storage bucket is configured
    const bucket = clientStorage.app.options.storageBucket
    if (!bucket) {
      throw new Error("Firebase Storage bucket is not configured. Please check your environment variables.")
    }

    const listRef = ref(clientStorage, directory)
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

// Delete a file from Firebase Storage
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    // Check if storage bucket is configured
    const bucket = clientStorage.app.options.storageBucket
    if (!bucket) {
      throw new Error("Firebase Storage bucket is not configured. Please check your environment variables.")
    }

    const fileRef = ref(clientStorage, filePath)
    await deleteObject(fileRef)
    return true
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

// Get a file's download URL
export async function getFileUrl(filePath: string): Promise<string> {
  try {
    // Check if storage bucket is configured
    const bucket = clientStorage.app.options.storageBucket
    if (!bucket) {
      throw new Error("Firebase Storage bucket is not configured. Please check your environment variables.")
    }

    const fileRef = ref(clientStorage, filePath)
    return await getDownloadURL(fileRef)
  } catch (error) {
    console.error("Error getting file URL:", error)
    throw error
  }
}

