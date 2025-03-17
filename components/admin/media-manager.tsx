"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Search, Filter, Trash2, Play, Eye, MoreVertical, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import type { MediaMetadata } from "@/lib/metadata-storage"

export function MediaManager() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [mediaItems, setMediaItems] = useState<MediaMetadata[]>([])
  const [filteredItems, setFilteredItems] = useState<MediaMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load media from API
  const fetchMedia = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/media")

      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.status}`)
      }

      const data = await response.json()

      if (!data.media) {
        setMediaItems([])
        setFilteredItems([])
        return
      }

      // Sort by date created (newest first)
      const sortedMedia = [...data.media].sort(
        (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
      )

      setMediaItems(sortedMedia)
      filterItems(sortedMedia, selectedType, searchTerm)
    } catch (error) {
      console.error("Error fetching media:", error)
      toast({
        title: "Erro",
        description: `Falha ao carregar mídia: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
      setMediaItems([])
      setFilteredItems([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  // Filter items based on search term and selected type
  const filterItems = (items = mediaItems, type = selectedType, search = searchTerm) => {
    let filtered = [...items]

    if (type) {
      filtered = filtered.filter((item) => item.fileType === type)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.categories.some((cat) => cat.toLowerCase().includes(searchLower)),
      )
    }

    setFilteredItems(filtered)
  }

  useEffect(() => {
    filterItems()
  }, [selectedType, searchTerm])

  const toggleItemSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const selectAllItems = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredItems.map((item) => item.id))
    }
  }

  const deleteItem = async (id: string, fileUrl: string, thumbnailUrl: string) => {
    try {
      const response = await fetch(
        `/api/media/delete?id=${id}&fileUrl=${encodeURIComponent(fileUrl)}&thumbnailUrl=${encodeURIComponent(thumbnailUrl)}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        throw new Error(`Failed to delete item: ${response.status}`)
      }

      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso",
      })

      // Refresh the list
      fetchMedia()
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Erro",
        description: `Falha ao excluir item: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    }
  }

  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return

    if (confirm(`Tem certeza que deseja excluir ${selectedItems.length} item(s)?`)) {
      for (const id of selectedItems) {
        const item = mediaItems.find((item) => item.id === id)
        if (item) {
          await deleteItem(id, item.fileUrl, item.thumbnailUrl)
        }
      }
      setSelectedItems([])
    }
  }

  return (
    <div className="bg-[#1e1e1e] rounded-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Gerenciar Mídia</h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Buscar mídia..."
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
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="bg-[#252525] border-[#333333] text-white hover:bg-[#333333]"
            onClick={fetchMedia}
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
          <Button variant="destructive" size="sm" onClick={deleteSelectedItems} className="bg-red-600 hover:bg-red-700">
            <Trash2 size={16} className="mr-2" />
            Excluir
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-10">
          <RefreshCw size={24} className="animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando mídia...</p>
        </div>
      )}

      {/* Media Table */}
      {!isLoading && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#333333]">
                <th className="py-3 px-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onChange={selectAllItems}
                    className="rounded bg-[#252525] border-[#333333] text-[#d87093]"
                  />
                </th>
                <th className="py-3 px-4 text-left">Mídia</th>
                <th className="py-3 px-4 text-left">Tipo</th>
                <th className="py-3 px-4 text-left">Categorias</th>
                <th className="py-3 px-4 text-left">Data</th>
                <th className="py-3 px-4 text-left">Visualizações</th>
                <th className="py-3 px-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-[#333333] hover:bg-[#252525]">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="rounded bg-[#252525] border-[#333333] text-[#d87093]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="relative w-12 h-12 mr-3 rounded overflow-hidden">
                          <Image
                            src={item.thumbnailUrl || "/placeholder.svg"}
                            alt={item.title}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                          {item.fileType === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Play size={16} className="text-white" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          item.fileType === "video"
                            ? "bg-blue-900/30 text-blue-400"
                            : "bg-purple-900/30 text-purple-400"
                        }`}
                      >
                        {item.fileType === "video" ? "Vídeo" : "Foto"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.categories.map((category: string, index: number) => (
                          <span key={index} className="px-2 py-0.5 bg-[#d87093]/20 rounded-full text-[#d87093] text-xs">
                            {category}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(item.dateCreated).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 px-4 text-gray-400">{item.views?.toLocaleString() || "0"}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-white"
                          title="Visualizar"
                        >
                          <Eye size={18} />
                        </a>
                        <button
                          onClick={() => deleteItem(item.id, item.fileUrl, item.thumbnailUrl)}
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
                                navigator.clipboard.writeText(item.fileUrl)
                                toast({
                                  title: "URL copiada",
                                  description: "URL do arquivo copiada para a área de transferência",
                                })
                              }}
                            >
                              Copiar URL
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400"
                              onClick={() => deleteItem(item.id, item.fileUrl, item.thumbnailUrl)}
                            >
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
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    {isLoading ? "Carregando..." : "Nenhum resultado encontrado"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          Mostrando {filteredItems.length} de {mediaItems.length} itens
        </div>
      </div>
    </div>
  )
}

