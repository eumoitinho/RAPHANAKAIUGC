"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Play, Pause, Volume2, VolumeX, Maximize, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import type { MediaMetadata } from "@/lib/metadata-storage"

export function Portfolio() {
  const [activeType, setActiveType] = useState("Videos")
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [mediaItems, setMediaItems] = useState<MediaMetadata[]>([])
  const [filteredItems, setFilteredItems] = useState<MediaMetadata[]>([])
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

  // Fetch media metadata from the API
  const fetchMedia = async () => {
    setIsLoading(true)
    try {
      console.log("Fetching media from API...")
      const response = await fetch("/api/media")

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch media (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      console.log("Media data received:", data)

      if (!data.media || data.media.length === 0) {
        console.warn("No media returned from API or empty array")
        setMediaItems([])
        setFilteredItems([])
        setIsLoading(false)
        return
      }

      // Sort by date created (newest first)
      const sortedMedia = [...data.media].sort(
        (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
      )

      setMediaItems(sortedMedia)

      // Initial filtering
      const fileType = activeType.toLowerCase().slice(0, -1) // Convert "Videos" to "video"
      const initialFiltered = sortedMedia.filter((item: MediaMetadata) => item.fileType === fileType)
      console.log("Initial filtered items:", initialFiltered)
      setFilteredItems(initialFiltered)
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
    const fileType = activeType.toLowerCase().slice(0, -1) // Convert "Videos" to "video"
    let items = mediaItems.filter((item) => item.fileType === fileType)

    if (activeCategories.length > 0) {
      items = items.filter((item) => item.categories.some((category) => activeCategories.includes(category)))
    }

    setFilteredItems(items)
  }

  const handleTypeChange = (type: string) => {
    setActiveType(type)
    setIsPlaying(null)

    const fileType = type.toLowerCase().slice(0, -1) // Convert "Videos" to "video"
    let items = mediaItems.filter((item) => item.fileType === fileType)

    if (activeCategories.length > 0) {
      items = items.filter((item) => item.categories.some((category) => activeCategories.includes(category)))
    }

    setFilteredItems(items)
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

    // Apply mute state to all videos
    Object.values(videoRefs.current).forEach((video) => {
      video.muted = !isMuted
    })
  }

  const handleVideoEnded = () => {
    setIsPlaying(null)
  }

  // Use useEffect to watch activeCategories and filter items
  useEffect(() => {
    filterItems()
  }, [activeCategories])

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
          <Button
            variant="outline"
            className="ml-2 bg-[#252525] border-[#333333] text-white hover:bg-[#333333]"
            onClick={() => {
              console.log("Current media items:", mediaItems)
              console.log("Current filtered items:", filteredItems)
              toast({
                title: "Estado atual",
                description: `${mediaItems.length} itens no total, ${filteredItems.length} filtrados`,
              })
            }}
          >
            Debug
          </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div key={item.id} className="relative overflow-hidden rounded-lg bg-[#1e1e1e] group">
                  {console.log("Rendering item:", item.id, item.title, item.fileType)}
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
                      <Image
                        src={item.fileUrl || "/placeholder.svg?height=400&width=300"}
                        alt={item.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.error("Image loading error:", e)
                          // Fallback to placeholder if image fails to load
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

