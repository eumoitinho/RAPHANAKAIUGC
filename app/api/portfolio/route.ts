import { NextResponse } from "next/server"
import { list } from "@vercel/blob"
import { getAllMediaMetadata } from "@/lib/metadata-storage"

// Função para extrair o tipo de arquivo do nome do blob
function getFileTypeFromPath(pathname: string): "video" | "photo" {
  const lowerPath = pathname.toLowerCase()

  if (
    lowerPath.includes("video-") ||
    lowerPath.endsWith(".mp4") ||
    lowerPath.endsWith(".webm") ||
    lowerPath.endsWith(".mov")
  ) {
    return "video"
  }

  return "photo"
}

// Função para extrair categorias do nome do arquivo (fallback)
function getCategoriesFromPath(pathname: string): string[] {
  // Extrai o nome do arquivo sem o caminho
  const filename = pathname.split("/").pop() || ""

  // Categorias padrão se não conseguirmos extrair
  const defaultCategories = ["Sem categoria"]

  // Se o nome do arquivo contém certas palavras-chave, podemos usá-las como categorias
  const possibleCategories = []

  if (filename.toLowerCase().includes("beauty")) possibleCategories.push("Beauty")
  if (filename.toLowerCase().includes("fashion") || filename.toLowerCase().includes("moda"))
    possibleCategories.push("Moda")
  if (filename.toLowerCase().includes("food") || filename.toLowerCase().includes("comida"))
    possibleCategories.push("Receitas")
  if (filename.toLowerCase().includes("pet")) possibleCategories.push("Pet")
  if (filename.toLowerCase().includes("decor")) possibleCategories.push("Decor")
  if (filename.toLowerCase().includes("wellness")) possibleCategories.push("Wellness")
  if (filename.toLowerCase().includes("ad") || filename.toLowerCase().includes("ads")) possibleCategories.push("ADS")

  return possibleCategories.length > 0 ? possibleCategories : defaultCategories
}

export async function GET(): Promise<NextResponse> {
  console.log("API: GET /api/portfolio - Request received")

  try {
    // Verificar se o token do Blob está disponível
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("API: Missing BLOB_READ_WRITE_TOKEN environment variable")
      return NextResponse.json(
        {
          error: "Missing BLOB_READ_WRITE_TOKEN environment variable",
          items: [],
        },
        { status: 500 },
      )
    }

    // Buscar todos os blobs
    console.log("API: Fetching blobs from Vercel Blob")
    const blobsResponse = await list()
    const blobs = blobsResponse.blobs

    console.log(`API: Found ${blobs.length} blobs`)

    // Tentar buscar metadados (mas não falhar se não conseguir)
    let metadata = []
    try {
      console.log("API: Fetching metadata")
      metadata = await getAllMediaMetadata()
      console.log(`API: Found ${metadata.length} metadata items`)
    } catch (metadataError) {
      console.error("API: Error fetching metadata, will use blob info only:", metadataError)
    }

    // Criar um mapa de URLs para metadados para facilitar a busca
    const metadataMap = new Map()
    metadata.forEach((item) => {
      metadataMap.set(item.fileUrl, item)

      // Também mapear pelo nome do arquivo, caso a URL completa não corresponda
      if (item.fileName) {
        metadataMap.set(item.fileName, item)
      }
    })

    // Filtrar thumbnails e arquivos que não são mídia
    const mediaBlobs = blobs.filter((blob) => {
      const path = blob.pathname.toLowerCase()
      return (
        !path.includes("metadata.json") &&
        !path.includes("portfolio-metadata.json") &&
        (path.includes("video-") ||
          path.includes("photo-") ||
          path.endsWith(".jpg") ||
          path.endsWith(".jpeg") ||
          path.endsWith(".png") ||
          path.endsWith(".gif") ||
          path.endsWith(".mp4") ||
          path.endsWith(".webm") ||
          path.endsWith(".mov"))
      )
    })

    // Separar thumbnails e arquivos principais
    const thumbnails = blobs.filter((blob) => blob.pathname.toLowerCase().includes("thumbnail-"))
    const thumbnailMap = new Map()

    // Criar um mapa de thumbnails para facilitar a associação
    thumbnails.forEach((thumb) => {
      // Extrair o ID ou parte do nome que pode corresponder ao arquivo principal
      const filename = thumb.pathname.split("/").pop() || ""
      const baseNameMatch = filename.match(/thumbnail-([^-]+)/)

      if (baseNameMatch && baseNameMatch[1]) {
        thumbnailMap.set(baseNameMatch[1], thumb.url)
      }

      // Também armazenar o caminho completo
      thumbnailMap.set(thumb.pathname, thumb.url)
    })

    // Combinar blobs com metadados
    const portfolioItems = mediaBlobs.map((blob) => {
      // Verificar se temos metadados para este blob
      const metadata = metadataMap.get(blob.url) || metadataMap.get(blob.pathname)

      // Se temos metadados, usá-los
      if (metadata) {
        return {
          ...metadata,
          // Garantir que a URL do blob seja usada mesmo se o metadado tiver uma URL diferente
          fileUrl: blob.url,
          // Adicionar informações do blob que podem não estar nos metadados
          size: blob.size,
          uploadedAt: blob.uploadedAt,
        }
      }

      // Caso contrário, criar um item com as informações do blob
      const filename = blob.pathname.split("/").pop() || "Arquivo sem nome"
      const fileType = getFileTypeFromPath(blob.pathname)

      // Tentar encontrar uma thumbnail correspondente
      let thumbnailUrl = null
      const baseNameMatch = filename.match(/([^-]+)/)
      if (baseNameMatch && baseNameMatch[1]) {
        thumbnailUrl = thumbnailMap.get(baseNameMatch[1])
      }

      // Se não encontrou, usar uma thumbnail genérica baseada no tipo
      if (!thumbnailUrl) {
        thumbnailUrl = fileType === "video" ? "/placeholder.svg?height=400&width=300&text=Video" : blob.url // Para fotos, usar a própria imagem como thumbnail
      }

      return {
        id: `blob-${blob.pathname.replace(/[^a-zA-Z0-9]/g, "-")}`,
        title: filename.replace(/\.(jpg|jpeg|png|gif|mp4|webm|mov)$/i, "").replace(/-/g, " "),
        description: `Arquivo carregado em ${new Date(blob.uploadedAt).toLocaleDateString()}`,
        fileUrl: blob.url,
        thumbnailUrl: thumbnailUrl,
        fileType: fileType,
        categories: getCategoriesFromPath(blob.pathname),
        dateCreated: blob.uploadedAt,
        views: 0,
        fileName: blob.pathname,
        size: blob.size,
      }
    })

    // Ordenar por data de upload (mais recentes primeiro)
    portfolioItems.sort((a, b) => {
      const dateA = new Date(a.uploadedAt || a.dateCreated).getTime()
      const dateB = new Date(b.uploadedAt || b.dateCreated).getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      items: portfolioItems,
      totalCount: portfolioItems.length,
      usingBlobManager: true,
    })
  } catch (error) {
    console.error("API: Error in portfolio endpoint:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        items: [],
      },
      { status: 500 },
    )
  }
}

