"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Play, Pause, Volume2, VolumeX, Maximize, RefreshCw, AlertTriangle, FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import type { MediaMetadata } from "@/lib/metadata-storage"

// Tipo estendido para incluir informações do blob
type PortfolioItem = MediaMetadata & {
  size?: number
  uploadedAt?: string
  usingBlobManager?: boolean
}

export function Portfolio() {
  const [activeType, setActiveType] = useState("Videos")
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [mediaItems, setMediaItems] = useState<PortfolioItem[]>([])
  const [filteredItems, setFilteredItems] = useState<PortfolioItem[]>([])
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [usingBlobManager, setUsingBlobManager] = useState(false)

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

  // Buscar mídia da nova API de portfólio
  const fetchMedia = async () => {
    setIsLoading(true)
    setApiError(null)

    try {
      console.log("Fetching media from portfolio API...")
      const response = await fetch("/api/portfolio")

      // Verificar se a resposta está OK
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}):`, errorText)
        setApiError(`API error (${response.status}): ${errorText}`)
        setIsLoading(false)
        return
      }

      // Analisar a resposta JSON
      const data = await response.json()
      console.log("Portfolio data received:", data)

      if (!data.items) {
        console.warn("No items property in API response:", data)
        setMediaItems([])
        setFilteredItems([])
        setIsLoading(false)
        return
      }

      // Verificar se estamos usando o gerenciador de blobs
      if (data.usingBlobManager) {
        setUsingBlobManager(true)
      }

      // Garantir que items é um array
      const itemsArray = Array.isArray(data.items) ? data.items : []

      if (itemsArray.length === 0) {
        console.log("API returned empty items array - no items have been uploaded yet")
        setMediaItems([])
        setFilteredItems([])
        setIsLoading(false)
        return
      }

      setMediaItems(itemsArray)

      // Filtragem inicial
      const fileType = activeType.toLowerCase().slice(0, -1) // Converter "Videos" para "video"
      const initialFiltered = itemsArray.filter((item: PortfolioItem) => item.fileType === fileType)
      console.log("Initial filtered items:", initialFiltered)
      setFilteredItems(initialFiltered)
    } catch (error) {
      console.error("Error fetching media:", error)
      setApiError(`Error fetching media: ${error instanceof Error ? error.message : String(error)}`)
      setMediaItems([])
      setFilteredItems([])
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar dados de mídia
  useEffect(() => {
    fetchMedia()
  }, [])

  // Tipos de mídia e lógica de filtragem
  const mediaTypes = ["Videos", "Fotos"]

  const toggleCategory = (category: string) => {
    if (activeCategories.includes(category)) {
      setActiveCategories(activeCategories.filter((c) => c !== category))
    } else {
      setActiveCategories([...activeCategories, category])
    }
  }

  const filterItems = () => {
    const fileType = activeType.toLowerCase().slice(0, -1) // Converter "Videos" para "video"
    let items = mediaItems.filter((item) => item.fileType === fileType)

    if (activeCategories.length > 0) {
      items = items.filter((item) => item.categories.some((category) => activeCategories.includes(category)))
    }

    setFilteredItems(items)
  }

  const handleTypeChange = (type: string) => {
    setActiveType(type)
    setIsPlaying(null)

    const fileType = type.toLowerCase().slice(0, -1) // Converter "Videos" para "video"
    let items = mediaItems.filter((item) => item.fileType === fileType)

    if (activeCategories.length > 0) {
      items = items.filter((item) => item.categories.some((category) => activeCategories.includes(category)))
    }

    setFilteredItems(items)
  }

  const togglePlay = (id: string) => {
    if (isPlaying === id) {
      videoRefs.current[id]?.pause()
      setIsPlaying(null)
    } else {
      // Pausar qualquer vídeo que esteja sendo reproduzido
      if (isPlaying !== null && videoRefs.current[isPlaying]) {
        videoRefs.current[isPlaying].pause()
      }

      // Só tentar reproduzir se tivermos uma referência de vídeo
      if (videoRefs.current[id]) {
        videoRefs.current[id].play().catch((error) => {
          console.error("Error playing video:", error)
          toast({
            title: "Erro ao reproduzir vídeo",
            description: "Não foi possível reproduzir o vídeo. Tente novamente mais tarde.",
            variant: "destructive",
          })
        })
        setIsPlaying(id)

        // Incrementar contagem de visualizações
        incrementViews(id)
      }
    }
  }

  const incrementViews = async (id: string) => {
    try {
      await fetch("/api/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })
    } catch (error) {
      console.error("Error incrementing views:", error)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)

    // Aplicar estado de mudo a todos os vídeos
    Object.values(videoRefs.current).forEach((video) => {
      video.muted = !isMuted
    })
  }

  const handleVideoEnded = () => {
    setIsPlaying(null)
  }

  // Usar useEffect para observar activeCategories e filtrar itens
  useEffect(() => {
    filterItems()
  }, [activeCategories])

  // Extrair todas as categorias únicas dos itens
  const allCategories = Array.from(new Set(mediaItems.flatMap((item) => item.categories)))

  // Função para formatar o tamanho do arquivo
  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return "Tamanho desconhecido"

    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  return (
    <section id="projetos" className="py-24 bg-[#121212]">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-4xl font-serif italic mb-16 text-center text-[#d87093]">Portfolio</h2>

        {/* Media Type Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-[#1e1e1e] rounded-full p-1">
            {mediaTypes.map((type) => (
              <button
                key={type}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeType === type ? "bg-[#d87093] text-white" : "text-gray-400 hover:text-white"
                }`}
                onClick={() => handleTypeChange(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        {allCategories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {allCategories.map((category) => (
              <button
                key={category}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  activeCategories.includes(category)
                    ? "bg-[#d87093] text-white border-[#d87093]"
                    : "bg-transparent text-gray-400 border-gray-700 hover:border-gray-500"
                }`}
                onClick={() => {
                  toggleCategory(category)
                }}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center mb-8">
          <Button
            variant="outline"
            className="bg-[#252525] border-[#333333] text-white hover:bg-[#333333]"
            onClick={fetchMedia}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Atualizar
              </>
            )}
          </Button>
        </div>

        {/* Blob Manager Info */}
        {usingBlobManager && (
          <div className="bg-blue-900/30 border border-blue-500/50 text-blue-300 p-4 rounded-md mb-8">
            <div className="flex items-start">
              <FileIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold mb-1">Usando Gerenciador de Blobs</h3>
                <p className="text-sm">
                  O portfólio está exibindo arquivos diretamente do Vercel Blob. Alguns metadados podem ser limitados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* API Error Message */}
        {apiError && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-4 rounded-md mb-8">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold mb-1">Erro na API</h3>
                <p className="text-sm">{apiError}</p>
                <p className="mt-2 text-xs">
                  Verifique se as variáveis de ambiente BLOB_READ_WRITE_TOKEN e NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN estão
                  configuradas corretamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-20">
            <RefreshCw size={32} className="animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando mídia...</p>
          </div>
        )}

        {/* Portfolio Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div key={item.id} className="relative overflow-hidden rounded-lg bg-[#1e1e1e] group">
                  {item.fileType === "video" ? (
                    <div className="aspect-[9/16] relative">
                      <video
                        ref={(el) => {
                          if (el) videoRefs.current[item.id] = el
                        }}
                        poster={item.thumbnailUrl || "/placeholder.svg?height=400&width=300"}
                        src={item.fileUrl}
                        muted={isMuted}
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                        onEnded={handleVideoEnded}
                        onError={(e) => console.error("Video loading error:", e, item.fileUrl)}
                      />

                      {/* Video Controls */}
                      <div className="absolute inset-0 flex flex-col justify-between p-4">
                        {/* Top controls */}
                        <div className="flex justify-between items-start">
                          <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs">
                            {item.size ? formatFileSize(item.size) : ""}
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={toggleMute}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-[#d87093]/80 transition-colors"
                            >
                              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>

                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-[#d87093]/80 transition-colors"
                            >
                              <Maximize size={16} />
                            </a>
                          </div>
                        </div>

                        {/* Center play button */}
                        <button
                          onClick={() => togglePlay(item.id)}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center rounded-full bg-[#d87093]/80 text-white hover:bg-[#d87093] transition-colors"
                        >
                          {isPlaying === item.id ? <Pause size={24} /> : <Play size={24} />}
                        </button>

                        {/* Bottom info */}
                        <div className="bg-black/50 backdrop-blur-sm p-2 rounded">
                          <h3 className="font-medium text-white">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-300 mt-1 line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.categories.map((cat) => (
                              <span
                                key={cat}
                                className="text-xs px-2 py-0.5 bg-[#d87093]/20 rounded-full text-[#d87093]"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                          {item.uploadedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(item.uploadedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[9/16] relative">
                      <Image
                        src={item.fileUrl || "/placeholder.svg?height=400&width=300"}
                        alt={item.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.error("Image loading error:", e)
                          // Fallback para placeholder se a imagem falhar ao carregar
                          ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=400&width=300"
                        }}
                      />

                      {/* Image Overlay */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        <div className="bg-black/50 backdrop-blur-sm p-2 rounded">
                          <h3 className="font-medium text-white">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-300 mt-1 line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.categories.map((cat) => (
                              <span
                                key={cat}
                                className="text-xs px-2 py-0.5 bg-[#d87093]/20 rounded-full text-[#d87093]"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-400">
                              {item.uploadedAt && new Date(item.uploadedAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-400">{item.size && formatFileSize(item.size)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-gray-400">
                {mediaItems.length === 0 ? (
                  <>
                    Nenhum item encontrado. Adicione conteúdo no painel de administração.
                    <p className="mt-2 text-sm">
                      Status da API: {isLoading ? "Carregando..." : "Concluído"} | Itens totais: {mediaItems.length} |
                      Filtrados: {filteredItems.length}
                    </p>
                  </>
                ) : (
                  "Nenhum item encontrado com os filtros selecionados."
                )}
              </div>
            )}
          </div>
        )}

        {/* Load More Button - Only show if we have items */}
        {!isLoading && filteredItems.length > 6 && (
          <div className="flex justify-center mt-12">
            <Button className="bg-[#d87093] hover:bg-[#c45c7c] text-white rounded-full px-8">Carregar Mais</Button>
          </div>
        )}
      </div>
    </section>
  )
}

