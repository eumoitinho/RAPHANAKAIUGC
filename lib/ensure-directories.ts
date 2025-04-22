import { existsSync, mkdirSync } from "fs"
import path from "path"

export function ensureProjectDirectories() {
  const projectsDir = path.join(process.cwd(), "public", "projects")
  const videosDir = path.join(projectsDir, "videos")
  const photosDir = path.join(projectsDir, "photos")

  // Create directories if they don't exist
  if (!existsSync(projectsDir)) {
    mkdirSync(projectsDir, { recursive: true })
  }

  if (!existsSync(videosDir)) {
    mkdirSync(videosDir, { recursive: true })
  }

  if (!existsSync(photosDir)) {
    mkdirSync(photosDir, { recursive: true })
  }
}
