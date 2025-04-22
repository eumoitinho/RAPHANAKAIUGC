"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Trash2, Eye, MoreVertical, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { deleteFile } from "@/lib/firebase-storage"
import { ref, listAll, getDownloadURL, getMetadata } from "firebase/storage"
import { storage } from "@/lib/firebase"

type Blob = {
  url: string
  pathname: string
  size: number
  uploadedAt: string
}

export function BlobManager() {
  const [blobs, setBlobs] = useState<Blob[]>([])
  const [filteredBlobs, setFilteredBlobs] = useState<Blob[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const fetchBlobs = async () => {
    setIsLoading(true)
    try {
      console.log("Fetching files from Firebase Storage...")

      // Get all files from Firebase Storage
      const storageRef = ref(storage)
      const result = await listAll(storageRef)

      // Process the results
      const blobPromises = result.items.map(async (item) => {
        try {
          const url = await getDownloadURL(item)
          const metadata = await getMetadata(item)

          return {
            url,
            pathname: item.fullPath,
            size: metadata.size || 0,
            uploadedAt: metadata.timeCreated || new Date().toISOString(),
          }
        } catch (error) {
          console.error(`Error processing item ${item.fullPath}:`, error)
          return null
        }
      })

      // Process directories recursively
      const processFolders = async (folders) => {
        for (const folder of folders) {
          try {
            const folderContents = await listAll(folder)

            // Process files in this folder
            const folderBlobPromises = folderContents.items.map(async (item) => {
              try {
                const url = await getDownloadURL(item)
                const metadata = await getMetadata(item)

                return {
                  url,
                  pathname: item.fullPath,
                  size: metadata.size || 0,
                  uploadedAt: metadata.timeCreated || new Date().toISOString(),
                }
              } catch (error) {
                console.error(`Error processing item ${item.fullPath}:`, error)
                return null
              }
            })

            // Add these promises to our array
            blobPromises.push(...folderBlobPromises)

            // Process subfolders recursively
            if (folderContents.prefixes.length > 0) {
              await processFolders(folderContents.prefixes)
            }
          } catch (error) {
            console.error(`Error processing folder ${folder.fullPath}:`, error)
          }
        }
      }

      // Process all folders
      await processFolders(result.prefixes)

      // Resolve all promises
      const resolvedBlobs = await Promise.all(blobPromises)
      const validBlobs = resolvedBlobs.filter((blob) => blob !== null) as Blob[]

      console.log(`Found ${validBlobs.length} files`)

      setBlobs(validBlobs)
      setFilteredBlobs(validBlobs)
    } catch (error) {
      console.error("Error fetching files:", error)
      toast({
        title: "Error",
        description: `Failed to fetch files: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
      // Initialize with empty arrays to prevent UI errors
      setBlobs([])
      setFilteredBlobs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBlobs()
  }, [])

  useEffect(() => {
    let filtered = blobs

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((blob) => blob.pathname.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Apply type filter
    if (selectedType) {
      filtered = filtered.filter((blob) => {
        if (selectedType === "video") {
          return blob.pathname.includes("videos/")
        } else if (selectedType === "photo") {
          return blob.pathname.includes("photos/")
        } else if (selectedType === "thumbnail") {
          return blob.pathname.includes("thumbnails/")
        }
        return true
      })
    }

    setFilteredBlobs(filtered)
  }, [searchTerm, selectedType, blobs])

  const toggleItemSelection = (pathname: string) => {
    if (selectedItems.includes(pathname)) {
      setSelectedItems(selectedItems.filter((item) => item !== pathname))
    } else {
      setSelectedItems([...selectedItems, pathname])
    }
  }

  const selectAllItems = () => {
    if (selectedItems.length === filteredBlobs.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredBlobs.map((blob) => blob.pathname))
    }
  }

  const deleteBlob = async (path: string) => {
    try {
      await deleteFile(path)
      toast({
        title: "Success",
        description: "File deleted successfully",
      })

      // Refresh the list
      fetchBlobs()
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return

    if (confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
      for (const path of selectedItems) {
        await deleteBlob(path)
      }
      setSelectedItems([])
    }
  }

  const isVideo = (pathname: string) => {
    return (
      pathname.includes("videos/") ||
      pathname.endsWith(".mp4") ||
      pathname.endsWith(".webm") ||
      pathname.endsWith(".ogg")
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="bg-[#1e1e1e] rounded-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Gerenciar Arquivos (Firebase Storage)</h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#252525] border-[#333333] focus:border-[#d87093] text-white"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-[#252525] border-[#333333] text-white hover:bg-[#333333]">
                <Filter size={18} className="mr-2" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#252525] border-[#333333] text-white">
              <DropdownMenuItem onClick={() => setSelectedType(null)} className={!selectedType ? "bg-[#333333]" : ""}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedType("video")}
                className={selectedType === "video" ? "bg-[#333333]" : ""}
              >
                Vídeos
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedType("photo")}
                className={selectedType === "photo" ? "bg-[#333333]" : ""}
              >
                Fotos
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedType("thumbnail")}
                className={selectedType === "thumbnail" ? "bg-[#333333]" : ""}
              >
                Thumbnails
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="bg-[#252525] border-[#333333] text-white hover:bg-[#333333]"
            onClick={fetchBlobs}
            disabled={isLoading}
          >
            {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-[#252525] p-3 rounded-md mb-6 flex justify-between items-center">
          <span>{selectedItems.length} item(s) selecionado(s)</span>
          <div className="flex items-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelectedItems}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 size={16} className="mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      )}

      {/* Blobs Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#333333]">
              <th className="py-3 px-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredBlobs.length && filteredBlobs.length > 0}
                  onChange={selectAllItems}
                  className="rounded bg-[#252525] border-[#333333] text-[#d87093]"
                />
              </th>
              <th className="py-3 px-4 text-left">Arquivo</th>
              <th className="py-3 px-4 text-left">Tipo</th>
              <th className="py-3 px-4 text-left">Tamanho</th>
              <th className="py-3 px-4 text-left">Data de Upload</th>
              <th className="py-3 px-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                  Carregando arquivos...
                </td>
              </tr>
            ) : filteredBlobs.length > 0 ? (
              filteredBlobs.map((blob) => (
                <tr key={blob.url} className="border-b border-[#333333] hover:bg-[#252525]">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(blob.pathname)}
                      onChange={() => toggleItemSelection(blob.pathname)}
                      className="rounded bg-[#252525] border-[#333333] text-[#d87093]"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="relative w-12 h-12 mr-3 rounded overflow-hidden">
                        {isVideo(blob.pathname) ? (
                          <div className="w-full h-full bg-[#252525] flex items-center justify-center">
                            <Eye size={16} className="text-white" />
                          </div>
                        ) : (
                          <Image
                            src={blob.url || "/placeholder.svg"}
                            alt={blob.pathname}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="font-medium truncate max-w-[200px]">{blob.pathname.split("/").pop()}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        isVideo(blob.pathname)
                          ? "bg-blue-900/30 text-blue-400"
                          : blob.pathname.includes("thumbnails/")
                            ? "bg-yellow-900/30 text-yellow-400"
                            : "bg-purple-900/30 text-purple-400"
                      }`}
                    >
                      {isVideo(blob.pathname) ? "Vídeo" : blob.pathname.includes("thumbnails/") ? "Thumbnail" : "Foto"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{formatFileSize(blob.size || 0)}</td>
                  <td className="py-3 px-4 text-gray-400">{formatDate(blob.uploadedAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <a
                        href={blob.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-white"
                        title="Visualizar"
                      >
                        <Eye size={18} />
                      </a>
                      <button
                        onClick={() => deleteBlob(blob.pathname)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 text-gray-400 hover:text-white" title="Mais opções">
                            <MoreVertical size={18} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#252525] border-[#333333] text-white">
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(blob.url)
                              toast({
                                title: "URL copiada",
                                description: "URL do arquivo copiada para a área de transferência",
                              })
                            }}
                          >
                            Copiar URL
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400" onClick={() => deleteBlob(blob.pathname)}>
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  Nenhum resultado encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - simplified for this example */}
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          Mostrando {filteredBlobs.length} de {blobs.length} itens
        </div>
      </div>
    </div>
  )
}
