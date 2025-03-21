"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Trash2, Eye, MoreVertical, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

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
      console.log("Fetching blobs from API...")
      const response = await fetch("/api/blobs")

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch blobs (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      console.log("Blobs fetched:", data)

      if (!data.blobs) {
        console.warn("No blobs returned from API:", data)
        setBlobs([])
        setFilteredBlobs([])
        return
      }

      setBlobs(data.blobs)
      setFilteredBlobs(data.blobs)
    } catch (error) {
      console.error("Error fetching blobs:", error)
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
          return blob.pathname.includes("video-")
        } else if (selectedType === "photo") {
          return blob.pathname.includes("photo-")
        } else if (selectedType === "thumbnail") {
          return blob.pathname.includes("thumbnail-")
        }
        return true
      })
    }

    setFilteredBlobs(filtered)
  }, [searchTerm, selectedType, blobs])

  const toggleItemSelection = (url: string) => {
    if (selectedItems.includes(url)) {
      setSelectedItems(selectedItems.filter((item) => item !== url))
    } else {
      setSelectedItems([...selectedItems, url])
    }
  }

  const selectAllItems = () => {
    if (selectedItems.length === filteredBlobs.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredBlobs.map((blob) => blob.url))
    }
  }

  const deleteBlob = async (url: string) => {
    try {
      const response = await fetch(`/api/delete-blob?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      toast({
        title: "Success",
        description: "File deleted successfully",
      })

      // Refresh the list
      fetchBlobs()
    } catch (error) {
      console.error("Error deleting blob:", error)
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
      for (const url of selectedItems) {
        await deleteBlob(url)
      }
      setSelectedItems([])
    }
  }

  const isVideo = (pathname: string) => {
    return (
      pathname.includes("video-") ||
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
        <h2 className="text-xl font-bold">Gerenciar Arquivos (Vercel Blob)</h2>

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
            <Button
              variant="outline"
              className="bg-[#252525] border-[#333333] text-white hover:bg-[#333333] ml-2"
              onClick={async () => {
                try {
                  const response = await fetch("/api/debug")
                  const data = await response.json()
                  console.log("Debug data:", data)
                  toast({
                    title: "Informações de depuração",
                    description: `Metadados: ${data.metadata.count} itens, Blobs: ${data.blobs.count} itens`,
                  })
                } catch (error) {
                  console.error("Error fetching debug info:", error)
                  toast({
                    title: "Erro",
                    description: "Falha ao obter informações de depuração",
                    variant: "destructive",
                  })
                }
              }}
            >
              Debug Metadata
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
                      checked={selectedItems.includes(blob.url)}
                      onChange={() => toggleItemSelection(blob.url)}
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
                          : blob.pathname.includes("thumbnail-")
                            ? "bg-yellow-900/30 text-yellow-400"
                            : "bg-purple-900/30 text-purple-400"
                      }`}
                    >
                      {isVideo(blob.pathname) ? "Vídeo" : blob.pathname.includes("thumbnail-") ? "Thumbnail" : "Foto"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{formatFileSize(blob.size)}</td>
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
                        onClick={() => deleteBlob(blob.url)}
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
                          <DropdownMenuItem className="text-red-400" onClick={() => deleteBlob(blob.url)}>
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

