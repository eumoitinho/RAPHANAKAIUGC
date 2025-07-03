"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Play, Pause, Volume2, VolumeX, Maximize, RefreshCw, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { VideoPlayer } from "./videoplayer"

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

  const renderMediaItem = (item: MediaItem) => {
    if (item.fileType === "video") {
      return (
        <VideoPlayer
          src={item.fileUrl}
          thumbnail={item.thumbnailUrl}
          title={item.title}
          className="w-full h-full"
        />
      )
    } else {
      return (
        <div className="relative w-full h-full overflow-hidden">
          <Image
            src={item.fileUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              console.error('Erro ao carregar imagem:', e)
              const target = e.target as HTMLImageElement
              target.src = '/placeholder.jpg'
            }}
          />
        </div>
      )
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group bg-[#1a1a1a] rounded-lg overflow-hidden hover:bg-[#2a2a2a] transition-all duration-300"
          >
            <div className="aspect-video relative">
              {renderMediaItem(item)}
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-[#d87093] transition-colors">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {item.categories.map((category) => (
                  <span
                    key={category}
                    className="px-2 py-1 bg-[#d87093] bg-opacity-20 text-[#d87093] text-xs rounded-full"
                  >
                    {category}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                {item.views} visualizações
              </div>
            </div>
          </div>
        ))}
      </div>
        )}

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