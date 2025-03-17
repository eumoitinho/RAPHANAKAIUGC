"use client"

import { v4 as uuidv4 } from "uuid"

export type MediaItem = {
  id: string
  title: string
  description?: string
  fileUrl: string
  thumbnailUrl: string
  fileType: "video" | "photo"
  categories: string[]
  dateCreated: string
  views: number
}

// Simple client-side storage solution
// In a real app this would connect to a database
export const mediaStorage = {
  getAll: (): MediaItem[] => {
    if (typeof window === "undefined") return []

    try {
      const items = localStorage.getItem("mediaItems")
      return items ? JSON.parse(items) : []
    } catch (error) {
      console.error("Error getting media items:", error)
      return []
    }
  },

  add: (item: Omit<MediaItem, "id" | "views" | "dateCreated">): MediaItem => {
    const newItem: MediaItem = {
      id: uuidv4(),
      ...item,
      views: 0,
      dateCreated: new Date().toISOString(),
    }

    const items = this.getAll()
    items.push(newItem)

    if (typeof window !== "undefined") {
      localStorage.setItem("mediaItems", JSON.stringify(items))
    }

    return newItem
  },

  delete: (id: string): boolean => {
    const items = this.getAll()
    const filteredItems = items.filter((item) => item.id !== id)

    if (items.length === filteredItems.length) {
      return false // Item not found
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("mediaItems", JSON.stringify(filteredItems))
    }

    return true
  },

  update: (id: string, updates: Partial<MediaItem>): MediaItem | null => {
    const items = this.getAll()
    const index = items.findIndex((item) => item.id === id)

    if (index === -1) {
      return null // Item not found
    }

    const updatedItem = { ...items[index], ...updates }
    items[index] = updatedItem

    if (typeof window !== "undefined") {
      localStorage.setItem("mediaItems", JSON.stringify(items))
    }

    return updatedItem
  },

  incrementViews: (id: string): void => {
    const items = this.getAll()
    const index = items.findIndex((item) => item.id === id)

    if (index !== -1) {
      items[index].views = (items[index].views || 0) + 1

      if (typeof window !== "undefined") {
        localStorage.setItem("mediaItems", JSON.stringify(items))
      }
    }
  },
}

