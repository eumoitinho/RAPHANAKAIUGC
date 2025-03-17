// Type definitions for our database models

export type Media = {
  id: string
  title: string
  description?: string
  fileUrl: string
  thumbnailUrl: string
  fileType: "video" | "photo"
  categories: string[]
  duration?: string // For videos
  dateCreated: Date
  views: number
  featured?: boolean
}

// In a real app with a proper database, you would use these models
// for database operations with an ORM like Prisma

