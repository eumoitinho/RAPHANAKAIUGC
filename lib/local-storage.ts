"use client"

// Upload a file to local storage via our server API
export async function uploadFile(file: File, path = ""): Promise<{ url: string; path: string }> {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folderPath", path)

    const response = await fetch("/api/local/upload", {
      method: "POST",
      body: formData,
    })

    // Check if the response is JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      // If not JSON, get the text and throw a more helpful error
      const text = await response.text()
      console.error("Server returned non-JSON response:", text)
      throw new Error(`Server error: Received non-JSON response. Status: ${response.status}`)
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Upload failed with status: ${response.status}`)
    }

    const data = await response.json()
    return { url: data.url, path: data.path }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

// List all files in a directory
export async function listFiles(directory = ""): Promise<{ name: string; url: string; fullPath: string }[]> {
  try {
    const response = await fetch(`/api/local/list-files?directory=${encodeURIComponent(directory)}`)

    // Check if the response is JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text()
      console.error("Server returned non-JSON response:", text)
      throw new Error(`Server error: Received non-JSON response. Status: ${response.status}`)
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Listing files failed with status: ${response.status}`)
    }

    const data = await response.json()
    return data.files
  } catch (error) {
    console.error("Error listing files:", error)
    throw error
  }
}

// Delete a file
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/local/delete-file?path=${encodeURIComponent(filePath)}`, {
      method: "DELETE",
    })

    // Check if the response is JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text()
      console.error("Server returned non-JSON response:", text)
      throw new Error(`Server error: Received non-JSON response. Status: ${response.status}`)
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Deleting file failed with status: ${response.status}`)
    }

    return true
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

// Get a file's URL
export async function getFileUrl(filePath: string): Promise<string> {
  // For local storage, we can just return the path directly
  return `/${filePath}`
}

