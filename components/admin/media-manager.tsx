"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Trash2, Eye, MoreVertical, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { getAllMediaItems } from "@/lib/firestore-service"
import type { MediaItem } from "@/lib/firestore-service"

export function MediaManager() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const fetchMediaItems = async () => {
    setIsLoading(true)
    try {
      console.log("Fetching media items from Firestore...")
      const items = await getAllMediaItems()
      console.log(`Found ${items.length} media items`)
      setMediaItems(items)
      setFilteredItems(items)
    } catch (error) {
      console.error("Error fetching media items:", error)
      toast({
        title: "Error",
        description: `Failed to fetch media items: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
      // Initialize with empty arrays to prevent UI errors
      setMediaItems([])
      setFilteredItems([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMediaItems()
  }, [])

  useEffect(() => {
    let filtered = mediaItems

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply type filter
    if (selectedType) {
      filtered = filtered.filter((item) => item.fileType === selectedType)
    }

    setFilteredItems(filtered)
  }, [searchTerm, selectedType, mediaItems])

  const toggleItemSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((item) => item !== id))
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

  const deleteItem = async (id: string, filePath?: string, thumbnailPath?: string) => {
    try {
      // Construct the URL with query parameters
      let url = `/api/media/delete?id=${encodeURIComponent(id)}`
      if (filePath) url += `&filePath=${encodeURIComponent(filePath)}`
      if (thumbnailPath) url += `&thumbnailPath=${encodeURIComponent(thumbnailPath)}`

      const response = await fetch(url, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Delete failed with status: ${response.status}`)
      }

      toast({
        title: "Success",
        description: "Item deleted successfully",
      })

      // Refresh the list
      fetchMediaItems()
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return

    if (confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
      for (const id of selectedItems) {
        const item = mediaItems.find((item) => item.id === id)
        if (item) {
          await deleteItem(id, item.fileName)
        }
      }
      setSelectedItems([])
    }
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
        <h2 className="text-xl font-bold">Gerenciar Mídia (Firestore)</h2>

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
            onClick={fetchMediaItems}
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

      {/* Media Items Table */}
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
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                  Carregando itens...
                </td>
              </tr>
            ) : filteredItems.length > 0 ? (
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
                          src={item.thumbnailUrl || "/placeholder.svg?height=48&width=48"}
                          alt={item.title}
                          width={48}
                          height={48}
                          className="object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                          }}
                        />
                      </div>
                      <span className="font-medium truncate max-w-[200px]">{item.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.fileType === "video" ? "bg-blue-900/30 text-blue-400" : "bg-purple-900/30 text-purple-400"
                      }`}
                    >
                      {item.fileType === "video" ? "Vídeo" : "Foto"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {item.categories.map((category, index) => (
                        <span key={index} className="px-2 py-0.5 bg-[#d87093]/20 rounded-full text-[#d87093] text-xs">
                          {category}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    {typeof item.dateCreated === "string" ? formatDate(item.dateCreated) : "N/A"}
                  </td>
                  <td className="py-3 px-4 text-gray-400">{item.views}</td>
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
                        onClick={() => deleteItem(item.id, item.fileName)}
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
                                description: "URL do item copiada para a área de transferência",
                              })
                            }}
                          >
                            Copiar URL
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400" onClick={() => deleteItem(item.id, item.fileName)}>
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
          Mostrando {filteredItems.length} de {mediaItems.length} itens
        </div>
      </div>
    </div>
  )
}
