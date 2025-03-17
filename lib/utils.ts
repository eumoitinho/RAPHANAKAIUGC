import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function uploadFileToBlob(file: File): Promise<string> {
  try {
    // Fetch the signed upload URL
    const response = await fetch("/api/upload")
    const { url } = await response.json()

    if (!url) {
      throw new Error("Failed to get signed upload URL")
    }

    // Upload the file directly to the signed URL
    const uploadResponse = await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type, // Set the correct content type
      },
    })

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file")
    }

    console.log("File uploaded successfully:", url)
    return url // Return the public URL of the uploaded file
  } catch (error) {
    console.error("Upload error:", error)
    throw error
  }
}