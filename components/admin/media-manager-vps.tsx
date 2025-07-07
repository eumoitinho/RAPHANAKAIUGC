"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Trash2, Pencil, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

type MediaItem = {
  _id?: string
  id: string
  title: string
  description: string
  fileUrl: string
  thumbnailUrl: string
  fileType: "video" | "photo"
  categories: string[]
  dateCreated: Date | string
  views: number
  fileName?: string
  fileSize?: number
  optimized?: boolean
  dimensions?: {
    width: number
    height: number
  }
  duration?: number
}

export function MediaManagerVPS() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)

  const fetchMediaItems = async () => {
    setIsLoading(true)
    try {
      console.log("Buscando itens de mídia da VPS...")
      const response = await fetch("/api/media")
      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`)
      }
      const data = await response.json()
      const items = data.media|| []
      console.log(`Encontrados ${items.length} itens de mídia na VPS`)
      setMediaItems(items)
      setFilteredItems(items)
    } catch (error) {
      console.error("Erro ao buscar itens de mídia:", error)
      toast({
        title: "Erro",
        description: `Falha ao buscar itens de mídia: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
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

    // Aplicar filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Aplicar filtro de tipo
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

  const deleteItem = async (id: string) => {
    const item = mediaItems.find((item) => item.id === id)
    if (!item) {
      toast({
        title: "Erro",
        description: "Item não encontrado para exclusão",
        variant: "destructive",
      })
      return
    }
    if (!confirm(`Tem certeza que deseja excluir “${item.title}”?`)) return
    try {
      // Permite deleção por fileName OU fileUrl (para itens antigos)
      let queryParam = "";
      if (item.fileName) {
        queryParam = `filename=${encodeURIComponent(item.fileName)}`;
      } else if (item.fileUrl) {
        // fallback para itens antigos
        const fileNameFromUrl = item.fileUrl.split("/").pop();
        if (fileNameFromUrl) {
          queryParam = `filename=${encodeURIComponent(fileNameFromUrl)}`;
        } else {
          toast({
            title: "Erro",
            description: "Arquivo sem fileName e fileUrl válido. Não é possível excluir.",
            variant: "destructive",
          });
          return;
        }
      } else {
        toast({
          title: "Erro",
          description: "Arquivo sem fileName e fileUrl. Não é possível excluir.",
          variant: "destructive",
        });
        return;
      }
      // Deleta o arquivo principal usando fileName (ou fileName inferido)
      const resFile = await fetch(`/api/media/delete?${queryParam}&fileType=${item.fileType}`, { method: "DELETE" })
      if (!resFile.ok) {
        const errorData = await resFile.json().catch(() => ({}))
        throw new Error(errorData.error || `Falha na exclusão com status: ${resFile.status}`)
      }
      // Se for vídeo e tiver thumbnail, deleta a thumb também
      if (item.fileType === "video" && item.thumbnailUrl) {
        const thumbName = item.thumbnailUrl.split("/").pop()
        if (thumbName) {
          await fetch(`/api/upload-media-vps?filename=${encodeURIComponent(thumbName)}&fileType=thumbnail`, { method: "DELETE" })
        }
      }
      toast({
        title: "Sucesso",
        description: "Item e thumbnail excluídos com sucesso",
      })
      fetchMediaItems()
    } catch (error) {
      console.error("Erro ao excluir item:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao excluir item",
        variant: "destructive",
      })
    }
  }

  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return

    if (confirm(`Tem certeza que deseja excluir ${selectedItems.length} item(s)?`)) {
      for (const id of selectedItems) {
        await deleteItem(id)
      }
      setSelectedItems([])
    }
  }

  const formatDate = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A"
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  // Filtros dinâmicos de categoria
  const allCategories = Array.from(new Set(mediaItems.flatMap(item => item.categories || []))).sort();

  return (
    <div className="bg-[#1e1e1e] rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Gerenciar Mídia VPS</h2>
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por título ou descrição..."
          className="px-3 py-2 rounded bg-[#232323] text-white w-full md:w-64 border border-[#333]"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          className="px-3 py-2 rounded bg-[#232323] text-white border border-[#333]"
          value={selectedType || ''}
          onChange={e => setSelectedType(e.target.value || null)}
        >
          <option value="">Todos os Tipos</option>
          <option value="video">Vídeo</option>
          <option value="photo">Foto</option>
        </select>
        <select
          className="px-3 py-2 rounded bg-[#232323] text-white border border-[#333]"
          onChange={e => {
            const cat = e.target.value;
            setFilteredItems(
              cat ? mediaItems.filter(item => (item.categories || []).includes(cat)) : mediaItems
            );
          }}
        >
          <option value="">Todas as Categorias</option>
          {allCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {selectedItems.length > 0 && (
          <Button variant="destructive" onClick={deleteSelectedItems} className="ml-auto">
            Apagar Selecionados ({selectedItems.length})
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center text-gray-400 py-8">
            <RefreshCw size={32} className="animate-spin mb-2" />
            Carregando itens...
          </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            console.log("Renderizando item:", item.id, item.title, item.fileType, item.fileUrl);
            const isVideo = item.fileType === "video";
            const thumb = isVideo
              ? item.thumbnailUrl || "/placeholder-video.svg?height=300&width=180"
              : item.thumbnailUrl || item.fileUrl || "/placeholder.svg?height=300&width=180";
            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg bg-neutral-900 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-xl"
              >
                <div className="aspect-[4/3] w-full overflow-hidden cursor-pointer group" onClick={() => { setEditingItem(item); setDrawerOpen(true); }}>
                  {isVideo ? (
                    <video
                      src={item.fileUrl}
                      poster={thumb}
                      className="object-cover w-full h-full rounded transition-transform duration-500 group-hover:scale-105"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <Image
                      src={thumb}
                      alt={item.title || ""}
                      fill
                      className="object-cover rounded transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        // @ts-ignore
                        e.target.src = "/placeholder.svg?height=300&width=180";
                      }}
                    />
                  )}
                  {/* Overlay de play para vídeo */}
                  {isVideo && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg width="36" height="36" viewBox="0 0 56 56" fill="none" className="opacity-90">
                        <circle cx="28" cy="28" r="28" fill="#000" fillOpacity="0.5" />
                        <polygon points="24,19 40,28 24,37" fill="#fff" />
                      </svg>
                    </span>
                  )}
                  {/* Checkbox de seleção */}
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={e => { e.stopPropagation(); toggleItemSelection(item.id); }}
                    className="absolute top-2 left-2 z-10 w-4 h-4 accent-[#d87093] rounded"
                    title="Selecionar"
                  />
                  {/* Botão editar */}
                  <button
                    className="absolute top-2 right-10 z-10 bg-[#232323] text-white rounded-full p-1 hover:bg-[#d87093] hover:text-white transition"
                    title="Editar"
                    onClick={e => { e.stopPropagation(); setEditingItem(item); setDrawerOpen(true); }}
                  >
                    <Pencil size={16} />
                  </button>
                  {/* Botão excluir */}
                  <button
                    className="absolute top-2 right-2 z-10 bg-[#232323] text-white rounded-full p-1 hover:bg-red-600 hover:text-white transition"
                    title="Excluir"
                    onClick={e => { e.stopPropagation(); deleteItem(item.id); }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-medium mb-1 truncate" title={item.title}>{item.title || <span className='italic text-gray-500'>Sem título</span>}</h3>
                  <p className="text-gray-400 text-xs mb-2 truncate" title={item.description}>{item.description || <span className='italic text-gray-500'>Sem descrição</span>}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(item.categories && item.categories.length > 0 ? item.categories : [<span key="semcat" className='italic text-gray-500'>Sem categoria</span>]).map((cat) => (
                      typeof cat === 'string' ? <span key={cat} className="text-[10px] px-1 py-0.5 bg-[#d87093]/20 rounded-full text-[#d87093]">{cat}</span> : cat
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{item.fileType === 'video' ? 'Vídeo' : 'Foto'}</span>
                    <span>{formatFileSize(item.fileSize)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <span>{item.dateCreated ? formatDate(item.dateCreated) : <span className='italic text-gray-500'>Sem data</span>}</span>
                    <span>{typeof item.views === 'number' ? `${item.views} views` : <span className='italic text-gray-500'>0 views</span>}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center text-gray-400 py-8">Nenhum resultado encontrado</div>
        )}
      </div>
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          Mostrando {filteredItems.length} de {mediaItems.length} itens
        </div>
      </div>

      {/* Drawer lateral para edição */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="max-w-md w-full">
          <SheetHeader>
            <SheetTitle>Editar Mídia</SheetTitle>
          </SheetHeader>
          {editingItem && (
            <div className="flex flex-col gap-4 mt-4">
              {editingItem.fileType === "video" ? (
                <video src={editingItem.fileUrl} poster={editingItem.thumbnailUrl} controls className="rounded w-full aspect-[9/16] bg-black" />
              ) : (
                <Image src={editingItem.fileUrl} alt={editingItem.title || 'Sem título'} width={320} height={480} className="rounded w-full aspect-[9/16] object-cover bg-black" />
              )}
              <label className="text-xs text-gray-400">Título</label>
              <Input value={editingItem.title || ''} placeholder="Sem título" onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} />
              <label className="text-xs text-gray-400">Descrição</label>
              <Input value={editingItem.description || ''} placeholder="Sem descrição" onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} />
              <div className="flex gap-2 flex-wrap">
                {(allCategories).map(cat => (
                  <button
                    key={cat}
                    className={`px-2 py-1 rounded text-xs border ${editingItem.categories?.includes(cat) ? 'bg-[#d87093] text-white border-[#d87093]' : 'bg-[#232323] text-gray-300 border-[#333]'}`}
                    onClick={() => setEditingItem({ ...editingItem, categories: editingItem.categories.includes(cat) ? editingItem.categories.filter(c => c !== cat) : [...editingItem.categories, cat] })}
                  >{cat}</button>
                ))}
              </div>
              <div className="flex flex-col gap-1 text-xs text-gray-500 mt-2">
                <span><b>Tipo:</b> {editingItem.fileType === 'video' ? 'Vídeo' : 'Foto'}</span>
                <span><b>Tamanho:</b> {formatFileSize(editingItem.fileSize)}</span>
                <span><b>Data:</b> {editingItem.dateCreated ? formatDate(editingItem.dateCreated) : <span className='italic text-gray-500'>Sem data</span>}</span>
                <span><b>Views:</b> {typeof editingItem.views === 'number' ? editingItem.views : 0}</span>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => setDrawerOpen(false)}>Fechar</Button>
              </div>
            </div>
          )}
          <SheetFooter />
        </SheetContent>
      </Sheet>
    </div>
  )
}

