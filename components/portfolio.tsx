"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Portfolio() {
  const [activeType, setActiveType] = useState("Videos")
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [portfolioItems, setPortfolioItems] = useState<any[]>([])
  const [filteredItems, setFilteredItems] = useState<any[]>([])
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

  // Load media data from localStorage
  useEffect(() => {
    const loadMedia = () => {
      if (typeof window !== "undefined") {
        const storedMedia = JSON.parse(localStorage.getItem("mediaItems") || "[]")

        // Transform to portfolio format
        const transformedItems = storedMedia.map((item: any) => ({
          id: item.id,
          title: item.title,
          type: item.fileType === "video" ? "Videos" : "Fotos",
          categories: item.categories,
          thumbnail: item.thumbnailUrl,
          videoUrl: item.fileType === "video" ? item.fileUrl : null,
          imageUrl: item.fileType === "photo" ? item.fileUrl : null,
          duration: "0:30", // This would come from the actual video metadata
          views: item.views || 0,
        }))

        setPortfolioItems(transformedItems)

        // Initial filtering
        const initialFiltered = transformedItems.filter((item) => item.type === activeType)
        setFilteredItems(initialFiltered)
      }
    }

    loadMedia()
    // Setup interval to refresh data
    const intervalId = setInterval(loadMedia, 5000)

    return () => clearInterval(intervalId)
  }, [activeType])

  // Rest of the component remains largely the same with some modifications
  const mediaTypes = ["Videos", "Fotos"]

  // Extract all unique categories from the items
  const allCategories = Array.from(new Set(portfolioItems.flatMap((item) => item.categories)))

  const toggleCategory = (category: string) => {
    if (activeCategories.includes(category)) {
      setActiveCategories(activeCategories.filter((c) => c !== category))
    } else {
      setActiveCategories([...activeCategories, category])
    }
  }

  const filterItems = () => {
    let items = portfolioItems.filter((item) => item.type === activeType)

    if (activeCategories.length > 0) {
      items = items.filter((item) => item.categories.some((category: string) => activeCategories.includes(category)))
    }

    setFilteredItems(items)
  }

  const handleTypeChange = (type: string) => {
    setActiveType(type)
    setIsPlaying(null)

    let items = portfolioItems.filter((item) => item.type === type)
    if (activeCategories.length > 0) {
      items = items.filter((item) => item.categories.some((category: string) => activeCategories.includes(category)))
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

  // Function to increment view count when a video is played
  const incrementViewCount = (id: string) => {
    if (typeof window !== "undefined") {
      const mediaItems = JSON.parse(localStorage.getItem("mediaItems") || "[]")
      const updatedItems = mediaItems.map((item: any) => {
        if (item.id === id) {
          return { ...item, views: (item.views || 0) + 1 }
        }
        return item
      })

      localStorage.setItem("mediaItems", JSON.stringify(updatedItems))
    }
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

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div key={item.id} className="relative overflow-hidden rounded-lg bg-[#1e1e1e] group">
                {item.type === "Videos" ? (
                  <div className="aspect-[9/16] relative">
                    <video
                      ref={(el) => {
                        if (el) videoRefs.current[item.id] = el
                      }}
                      poster={item.thumbnail}
                      src={item.videoUrl}
                      muted={isMuted}
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                      onEnded={handleVideoEnded}
                      onPlay={() => incrementViewCount(item.id)}
                    />

                    {/* Video Controls */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4">
                      {/* Top controls */}
                      <div className="flex justify-between items-start">
                        <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs">{item.duration}</div>

                        <div className="flex space-x-2">
                          <button
                            onClick={toggleMute}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-[#d87093]/80 transition-colors"
                          >
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                          </button>

                          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-[#d87093]/80 transition-colors">
                            <Maximize size={16} />
                          </button>
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
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.categories.map((cat: string) => (
                            <span key={cat} className="text-xs px-2 py-0.5 bg-[#d87093]/20 rounded-full text-[#d87093]">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[9/16] relative">
                    <Image src={item.thumbnail || "/placeholder.svg"} alt={item.title} fill className="object-cover" />

                    {/* Image Overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <div className="bg-black/50 backdrop-blur-sm p-2 rounded">
                        <h3 className="font-medium text-white">{item.title}</h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.categories.map((cat: string) => (
                            <span key={cat} className="text-xs px-2 py-0.5 bg-[#d87093]/20 rounded-full text-[#d87093]">
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
              Nenhum item encontrado.{" "}
              {portfolioItems.length === 0
                ? "Adicione conteúdo no painel de administração."
                : "Tente ajustar os filtros."}
            </div>
          )}
        </div>

        {/* Load More Button */}
        {filteredItems.length > 0 && (
          <div className="flex justify-center mt-12">
            <Button className="bg-[#d87093] hover:bg-[#c45c7c] text-white rounded-full px-8">Carregar Mais</Button>
          </div>
        )}
      </div>
    </section>
  )
}

