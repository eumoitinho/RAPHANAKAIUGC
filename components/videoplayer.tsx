"use client"

import { useRef, useEffect, useState } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface VideoPlayerProps {
  src: string
  thumbnail?: string
  title?: string
  className?: string
}

export function VideoPlayer({ src, thumbnail, title, className = "" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      setIsLoading(false)
      setError(null)
    }

    const handleError = (e: Event) => {
      console.error('Erro no vídeo:', e)
      setError('Erro ao carregar o vídeo')
      setIsLoading(false)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleError)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [src])

  const togglePlay = async () => {
    const video = videoRef.current
    if (!video) return

    try {
      if (isPlaying) {
        video.pause()
      } else {
        // Aguardar um frame antes de tentar reproduzir
        await new Promise(resolve => requestAnimationFrame(resolve))
        const playPromise = video.play()
        
        if (playPromise !== undefined) {
          await playPromise
        }
      }
    } catch (error) {
      console.error('Erro ao reproduzir/pausar vídeo:', error)
      setError('Erro ao reproduzir o vídeo')
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    
    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  if (error) {
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-4">
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => {
                setError(null)
                setIsLoading(true)
                videoRef.current?.load()
              }}
              className="mt-2 px-4 py-2 bg-[#d87093] rounded text-sm hover:bg-[#c45c7c] transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail}
        className="w-full h-full object-cover"
        preload="metadata"
        playsInline
        muted={isMuted}
        onContextMenu={(e) => e.preventDefault()}
      >
        Seu navegador não suporta o elemento de vídeo.
      </video>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d87093]"></div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      <div 
        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 cursor-pointer"
        onClick={togglePlay}
      >
        {!isPlaying && !isLoading && (
          <div className="bg-black bg-opacity-60 rounded-full p-4 transform scale-100 hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        )}
      </div>

      {/* Controls */}
      {(showControls || isPlaying) && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlay()
                }}
                className="text-white hover:text-[#d87093] transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute()
                }}
                className="text-white hover:text-[#d87093] transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>

            {title && (
              <div className="text-white text-sm truncate max-w-[200px]">
                {title}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}