"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Play, Pause, Volume2, VolumeX, Maximize, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { getAllMediaItems, incrementViews } from "@/lib/firestore-service"
import type { MediaItem } from "@/lib/firestore-service"

export function Portfolio() {
  const [activeType, setActiveType] = useState("Videos")
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([])
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [visibleItems, setVisibleItems] = useState<number>(6) // 2 linhas de 3 itens
  const [hasMore, setHasMore] = useState<boolean>(true)

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

  // Fetch media metadata from the API
  const fetchMedia = async () => {
    setIsLoading(true)
    try {
      console.log("Fetching media from API...")
      const items = await getAllMediaItems()
      console.log("Media data received:", items)

      if (!items || items.length === 0) {
        console.warn("No media returned from API or empty array")
        setMediaItems([])
        setFilteredItems([])
        setIsLoading(false)
        return
      }

      // Log dos tipos de mídia para diagnóstico
      const videoItems = items.filter((item) => item.fileType === "video")
      const photoItems = items.filter((item) => item.fileType === "photo")
      console.log(`Found ${videoItems.length} videos and ${photoItems.length} photos`)

      setMediaItems(items)

      // Initial filtering - CORREÇÃO: Usar o tipo correto para filtragem
      // Converter "Videos" para "video" e "Fotos" para "photo"
      const fileType = activeType === "Videos" ? "video" : "photo"
      console.log(`Initial filtering for type: ${fileType}`)

      const initialFiltered = items.filter((item) => {
        console.log(`Item ${item.id} has fileType: ${item.fileType}, comparing with ${fileType}`)
        return item.fileType === fileType
      })

      console.log("Initial filtered items:", initialFiltered.length)
      setFilteredItems(initialFiltered)
      setHasMore(initialFiltered.length > visibleItems)
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

  // Load media data
  useEffect(() => {
    fetchMedia()
  }, [])

  // Media types and filtering logic
  const mediaTypes = ["Videos", "Fotos"]

  const toggleCategory = (category: string) => {
    if (activeCategories.includes(category)) {
      setActiveCategories(activeCategories.filter((c) => c !== category))
    } else {
      setActiveCategories([...activeCategories, category])
    }
  }

  const filterItems = () => {
    // CORREÇÃO: Usar o tipo correto para filtragem
    // Converter "Videos" para "video" e "Fotos" para "photo"
    const fileType = activeType === "Videos" ? "video" : "photo"
    let items = mediaItems.filter((item) => item.fileType === fileType)

    if (activeCategories.length > 0) {
      items = items.filter((item) => item.categories.some((category) => activeCategories.includes(category)))
    }

    setFilteredItems(items)
  }

  const handleTypeChange = (type: string) => {
    setActiveType(type)
    setIsPlaying(null)
    setVisibleItems(6) // Reset pagination when changing type

    console.log(`Changing to type: ${type}`)
    // CORREÇÃO: Usar o tipo correto para filtragem
    // Converter "Videos" para "video" e "Fotos" para "photo"
    const fileType = type === "Videos" ? "video" : "photo"
    console.log(`Looking for items with fileType: ${fileType}`)

    let items = mediaItems.filter((item) => {
      console.log(`Item ${item.id} has fileType: ${item.fileType}`)
      return item.fileType === fileType
    })

    console.log(`Found ${items.length} items of type ${fileType}`)

    if (activeCategories.length > 0) {
      items = items.filter((item) => item.categories.some((category) => activeCategories.includes(category)))
      console.log(`After category filtering: ${items.length} items`)
    }

    setFilteredItems(items)
    setHasMore(items.length > visibleItems)
  }

  const togglePlay = (id: string) => {
    if (isPlaying === id) {
      videoRefs.current[id].pause()
      setIsPlaying(null)
    } else {
      // Pause any currently playing video
      if (isPlaying !== null && videoRefs.current[isPlaying]) {
        videoRefs.current[isPlaying].pause()
      }

      videoRefs.current[id].play()
      setIsPlaying(id)

      // Increment view count
      incrementViews(id)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)

    // Apply mute state to all videos
    Object.values(videoRefs.current).forEach((video) => {
      video.muted = !isMuted
    })
  }

  const handleVideoEnded = () => {
    setIsPlaying(null)
  }

  const loadMoreItems = () => {
    const newVisibleItems = visibleItems + 6 // Adiciona mais 2 linhas
    setVisibleItems(newVisibleItems)
    setHasMore(newVisibleItems < filteredItems.length)
  }

  // Use useEffect to watch activeCategories and filter items
  useEffect(() => {
    filterItems()
    // Resetar a paginação quando os filtros mudam
    setVisibleItems(6)
    setHasMore(filteredItems.length > 6)
  }, [activeCategories])

  // Atualizar hasMore quando filteredItems muda
  useEffect(() => {
    setHasMore(filteredItems.length > visibleItems)
  }, [filteredItems, visibleItems])

  // Extract all unique categories from the items
  const allCategories = Array.from(new Set(mediaItems.flatMap((item) => item.categories)))

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
                onClick={() => {
                  console.log(`Switching to type: ${type}`)
                  handleTypeChange(type)
                }}
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
              filteredItems.slice(0, visibleItems).map((item) => (
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
                            {item.views} views
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
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[9/16] relative">
                      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                        <Image
                          src={item.fileUrl || "/placeholder.svg?height=400&width=300"}
                          alt={item.title}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            console.error("Image loading error:", e, item.fileUrl)
                            // Fallback to placeholder if image fails to load
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=400&width=300"
                          }}
                        />
                      </div>

                      {/* Image Overlay - Always visible on mobile, visible on hover for desktop */}
                      <div className="absolute inset-0 bg-black/50 md:bg-black/30 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
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
        {!isLoading && hasMore && (
          <div className="flex justify-center mt-12">
            <Button onClick={loadMoreItems} className="bg-[#d87093] hover:bg-[#c45c7c] text-white rounded-full px-8">
              Carregar Mais
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
