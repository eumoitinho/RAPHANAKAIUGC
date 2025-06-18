"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Play, Pause, Volume2, VolumeX, Maximize, RefreshCw, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

// Add these keyframes for animations
const fadeInAnimation = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`

// Define MediaItem type locally
type MediaItem = {
  id: string
  title: string
  description: string
  fileUrl: string
  thumbnailUrl: string
  fileType: "video" | "photo"
  categories: string[]
  dateCreated: string
  views: number
  fileName?: string
}

export function Portfolio() {
  // Add this line to inject the keyframes
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = fadeInAnimation
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const [activeType, setActiveType] = useState("Videos")
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([])
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [visibleItems, setVisibleItems] = useState<number>(6)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [isVisible, setIsVisible] = useState(false)

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

  // Intersection Observer for animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    const element = document.getElementById("projetos")
    if (element) observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [])

  // Fetch media metadata from the API
  const fetchMedia = async () => {
    setIsLoading(true)
    try {
      console.log("Fetching media from API...")
      const response = await fetch("/api/media")
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const items = data.media || []
      
      console.log("Media data received:", items)

      if (!items || items.length === 0) {
        console.warn("No media returned from API or empty array")
        setMediaItems([])
        setFilteredItems([])
        setIsLoading(false)
        return
      }

      // Log dos tipos de mídia para diagnóstico
      const videoItems = items.filter((item: MediaItem) => item.fileType === "video")
      const photoItems = items.filter((item: MediaItem) => item.fileType === "photo")
      console.log(`Found ${videoItems.length} videos and ${photoItems.length} photos`)

      setMediaItems(items)

      // Initial filtering - CORREÇÃO: Usar o tipo correto para filtragem
      // Converter "Videos" para "video" e "Fotos" para "photo"
      const fileType = activeType === "Videos" ? "video" : "photo"
      console.log(`Initial filtering for type: ${fileType}`)

      const initialFiltered = items.filter((item: MediaItem) => {
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

  // Original categories
  const allCategories = ["ADS", "Wellness", "Receitas", "Moda", "Beauty", "Decor", "Experiência", "Pet", "Viagem"]

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

  const togglePlay = async (id: string) => {
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

  // Find the most viewed item
  const getMostViewedItem = (items: MediaItem[]) => {
    if (!items || items.length === 0) return null
    return items.reduce((prev, current) => (prev.views > current.views ? prev : current))
  }

  const mostViewedItem = getMostViewedItem(filteredItems)

  return (
    <section id="projetos" className="py-24 bg-[#121212]">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-4xl font-serif italic mb-16 text-center text-[#d87093] animate-[fadeIn_0.5s_ease-in-out]">
          Portfolio
        </h2>

        {/* Media Type Tabs */}
        <div
          className={`flex justify-center mb-8 transition-all duration-1000 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-flex bg-[#1e1e1e] rounded-full p-1 shadow-md">
            {mediaTypes.map((type) => (
              <button
                key={type}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeType === type ? "bg-[#d87093] text-white shadow-md" : "text-gray-400 hover:text-white"
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
        <div
          className={`flex flex-wrap justify-center gap-2 mb-12 transition-all duration-1000 delay-200 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {allCategories.map((category, index) => (
            <button
              key={category}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border ${
                activeCategories.includes(category)
                  ? "bg-[#d87093] text-white border-[#d87093] shadow-md"
                  : "bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => {
                toggleCategory(category)
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-20">
            <RefreshCw size={32} className="animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Carregando mídia...</p>
          </div>
        )}

        {/* Portfolio Grid */}
        {!isLoading && (
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-1000 delay-400 transform ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            {filteredItems.length > 0 ? (
              filteredItems.slice(0, visibleItems).map((item, index) => (
                <div
                  key={item.id}
                  className="relative overflow-hidden rounded-lg bg-[#1e1e1e] group shadow-md hover:shadow-lg transition-all duration-500 hover:translate-y-[-4px]"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: `fadeIn 0.5s ease-in-out ${index * 100}ms both`,
                  }}
                >
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
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onEnded={handleVideoEnded}
                        onError={(e) => console.error("Video loading error:", e, item.fileUrl)}
                      />

                      {/* Most viewed badge */}
                      {mostViewedItem && mostViewedItem.id === item.id && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full flex items-center gap-1 z-20 animate-pulse">
                          <Flame size={14} className="animate-pulse" />
                          <span className="text-xs font-medium">Mais visto</span>
                        </div>
                      )}

                      {/* Video Controls - Always visible */}
                      <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-black/40 via-transparent to-black/70">
                        {/* Top controls */}
                        <div className="flex justify-between items-start">
                          <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs">
                            {item.views} views
                          </div>

                          <div className="flex space-x-2">
                            <button
                              onClick={toggleMute}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-[#d87093]/80 transition-colors"
                            >
                              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>

                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-[#d87093]/80 transition-colors"
                            >
                              <Maximize size={16} />
                            </a>
                          </div>
                        </div>

                        {/* Center play button */}
                        <button
                          onClick={() => togglePlay(item.id)}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center rounded-full bg-[#d87093]/80 text-white hover:bg-[#d87093] transition-all duration-300 hover:scale-110 group-hover:animate-pulse"
                        >
                          {isPlaying === item.id ? <Pause size={24} /> : <Play size={24} />}
                        </button>

                        {/* Bottom info - Always visible */}
                        <div className="bg-black/60 backdrop-blur-sm p-3 rounded">
                          <h3 className="font-medium text-white">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-300 mt-1 line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
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
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            console.error("Image loading error:", e, item.fileUrl)
                            // Fallback to placeholder if image fails to load
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=400&width=300"
                          }}
                        />
                      </div>

                      {/* Most viewed badge */}
                      {mostViewedItem && mostViewedItem.id === item.id && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full flex items-center gap-1 z-20 animate-pulse">
                          <Flame size={14} className="animate-pulse" />
                          <span className="text-xs font-medium">Mais visto</span>
                        </div>
                      )}

                      {/* Views counter */}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs">
                        {item.views} views
                      </div>

                      {/* Image Overlay - Always visible */}
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70 flex flex-col justify-end p-4">
                        <div className="bg-black/60 backdrop-blur-sm p-3 rounded">
                          <h3 className="font-medium text-white">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-300 mt-1 line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
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
          <div
            className={`flex justify-center mt-12 transition-all duration-1000 delay-600 transform ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <Button
              onClick={loadMoreItems}
              className="bg-[#d87093] hover:bg-[#c45c7c] text-white rounded-full px-8 py-6 text-lg transition-all duration-500 hover:shadow-lg hover:scale-105 "
            >
              Carregar Mais
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}