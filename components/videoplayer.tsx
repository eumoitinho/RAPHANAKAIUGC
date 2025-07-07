"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  src: string
  thumbnail?: string
  title?: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
  controls?: boolean
}

export function VideoPlayer({
  src,
  thumbnail,
  title = "Video",
  className = "",
  autoPlay = false,
  muted = true,
  controls = false,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [isLoading, setIsLoading] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [canPlay, setCanPlay] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [showThumbnail, setShowThumbnail] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const maxRetries = 3

  useEffect(() => {
    console.log(`🎬 VideoPlayer: Initializing for ${title}`)
    console.log(`📹 VideoPlayer: Source URL: ${src}`)
    console.log(`🖼️ VideoPlayer: Thumbnail URL: ${thumbnail}`)

    if (!src) {
      console.error("❌ VideoPlayer: No source URL provided")
      setHasError(true)
      setIsLoading(false)
      return
    }

    // Validate URL format
    try {
      new URL(src)
      console.log("✅ VideoPlayer: URL format is valid")
    } catch (error) {
      console.error("❌ VideoPlayer: Invalid URL format:", src)
      setHasError(true)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setHasError(false)
  }, [src, title, thumbnail])

  const handleLoadStart = () => {
    console.log(`🔄 VideoPlayer: Load started for ${title}`)
    setIsLoading(true)
    setHasError(false)
  }

  const handleCanPlay = () => {
    console.log(`✅ VideoPlayer: Can play ${title}`)
    setCanPlay(true)
    setIsLoading(false)
    setHasError(false)
  }

  const handleLoadedData = () => {
    console.log(`📊 VideoPlayer: Data loaded for ${title}`)
    setIsLoading(false)
  }

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget
    const error = video.error

    console.error(`❌ VideoPlayer: Error loading ${title}:`, {
      code: error?.code,
      message: error?.message,
      src: src,
      networkState: video.networkState,
      readyState: video.readyState,
    })

    setHasError(true)
    setIsLoading(false)
    setCanPlay(false)
  }

  const handlePlay = async () => {
    if (!videoRef.current || !canPlay) {
      console.warn("⚠️ VideoPlayer: Cannot play - video not ready")
      return
    }

    try {
      console.log(`▶️ VideoPlayer: Playing ${title}`)
      await videoRef.current.play()
      setIsPlaying(true)
      setShowThumbnail(false)
    } catch (error) {
      console.error(`❌ VideoPlayer: Play failed for ${title}:`, error)
      setHasError(true)
    }
  }

  const handlePause = () => {
    if (!videoRef.current) return

    console.log(`⏸️ VideoPlayer: Pausing ${title}`)
    videoRef.current.pause()
    setIsPlaying(false)
  }

  const togglePlay = () => {
    if (isPlaying) {
      handlePause()
    } else {
      handlePlay()
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return

    const newMutedState = !isMuted
    videoRef.current.muted = newMutedState
    setIsMuted(newMutedState)
    console.log(`🔊 VideoPlayer: ${newMutedState ? "Muted" : "Unmuted"} ${title}`)
  }

  const handleFullscreen = () => {
    if (!videoRef.current) return

    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }

  const handleRetry = () => {
    if (retryCount >= maxRetries) {
      console.error(`❌ VideoPlayer: Max retries reached for ${title}`)
      return
    }

    console.log(`🔄 VideoPlayer: Retrying ${title} (attempt ${retryCount + 1}/${maxRetries})`)
    setRetryCount(retryCount + 1)
    setHasError(false)
    setIsLoading(true)
    setIsBuffering(false)
    setCanPlay(false)

    if (videoRef.current) {
      videoRef.current.load()
    }
  }

  const handleVideoClick = () => {
    if (hasError) {
      handleRetry()
    } else {
      togglePlay()
    }
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden aspect-[9/16] ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        preload="auto"
        muted={isMuted}
        playsInline
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onLoadedData={handleLoadedData}
        onError={handleError}
        onPlay={() => {
          setIsPlaying(true)
          setShowThumbnail(false)
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setShowThumbnail(true)
        }}
        onWaiting={() => {
          console.log(`⏳ VideoPlayer: Buffering ${title}`)
          setIsBuffering(true)
        }}
        onCanPlayThrough={() => {
          console.log(`🚀 VideoPlayer: Fully buffered ${title}`)
          setIsBuffering(false)
          setIsLoading(false)
        }}
        onPlaying={() => {
          console.log(`▶️ VideoPlayer: Playing smoothly ${title}`)
          setIsBuffering(false)
        }}
        onProgress={() => {
          // Buffer progress update
          if (videoRef.current) {
            const buffered = videoRef.current.buffered
            if (buffered.length > 0) {
              const bufferedEnd = buffered.end(buffered.length - 1)
              const duration = videoRef.current.duration
              if (duration > 0) {
                const bufferedPercent = (bufferedEnd / duration) * 100
                if (bufferedPercent > 25) { // Se tem mais de 25% buffered, não precisa mostrar loading
                  setIsBuffering(false)
                }
              }
            }
          }
        }}
        poster={thumbnail}
      >
        <source src={src} type="video/mp4" />
        <source src={src.replace(".mp4", ".webm")} type="video/webm" />
        <source src={src.replace(".mp4", ".ogg")} type="video/ogg" />
        Seu navegador não suporta o elemento de vídeo.
      </video>

      {/* Thumbnail Overlay */}
      {showThumbnail && thumbnail && !hasError && (
        <div className="absolute inset-0 bg-black">
          <img
            src={thumbnail || "/placeholder.svg"}
            alt={`Thumbnail for ${title}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.warn(`⚠️ VideoPlayer: Thumbnail failed to load for ${title}`)
              const target = e.target as HTMLImageElement
              target.style.display = "none"
            }}
          />
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Carregando vídeo...</p>
          </div>
        </div>
      )}

      {/* Buffering Overlay */}
      {isBuffering && isPlaying && !hasError && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="text-center text-white">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-1" />
            <p className="text-xs">Buffer...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white p-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="text-sm mb-4">Erro ao carregar vídeo</p>
            {retryCount < maxRetries && (
              <Button onClick={handleRetry} size="sm" className="bg-[#d87093] hover:bg-[#c45c7c] text-white">
                Tentar novamente ({retryCount + 1}/{maxRetries})
              </Button>
            )}
            {retryCount >= maxRetries && (
              <p className="text-xs text-gray-400">Não foi possível carregar o vídeo após {maxRetries} tentativas</p>
            )}
          </div>
        </div>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && !hasError && canPlay && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            onClick={handlePlay}
            size="lg"
            className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-4 transition-all duration-300 hover:scale-110"
          >
            <Play className="w-8 h-8" />
          </Button>
        </div>
      )}

      {/* Controls Overlay */}
      {canPlay && !hasError && (
        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            onClick={togglePlay}
            size="sm"
            className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button
            onClick={toggleMute}
            size="sm"
            className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <Button
            onClick={handleFullscreen}
            size="sm"
            className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2"
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Click Overlay for Play/Retry */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleVideoClick}
        style={{ zIndex: hasError ? 10 : isPlaying ? -1 : 5 }}
      />
    </div>
  )
}
