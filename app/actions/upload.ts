"use server"

import { mkdir } from "fs/promises"
import { existsSync } from "fs"

// Função para garantir que o diretório exista
async function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true })
  }
}

export async function uploadFile(formData: FormData) {
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  return response.json()
}

