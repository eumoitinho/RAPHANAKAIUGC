"use server"

import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

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
  });

  return response.json();
}
