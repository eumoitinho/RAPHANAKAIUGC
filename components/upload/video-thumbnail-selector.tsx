"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Download, RotateCcw } from "lucide-react"

interface VideoThumbnailSelectorProps {
  videoFile: File
  onThumbnailSelected: (thumbnailBlob: Blob) => void
}

export function VideoThumbnailSelector({ videoFile, onThumbnailSelected }: VideoThumbnailSelectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    // Criar URL para o vídeo
    const url = URL.createObjectURL(videoFile)
    setVideoUrl(url)

    // Cleanup
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [videoFile])

  const handleVideoLoad = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      // Ir para 10% do vídeo por padrão
      const defaultTime = videoRef.current.duration * 0.1
      videoRef.current.currentTime = defaultTime
      setCurrentTime(defaultTime)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const generateThumbnail = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsGenerating(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) throw new Error('Canvas context not available')

      // Definir dimensões do canvas (9:16 para stories)
      const aspectRatio = 9 / 16
      const width = 540
      const height = width / aspectRatio

      canvas.width = width
      canvas.height = height

      // Aguardar o vídeo estar no tempo correto
      await new Promise<void>((resolve) => {
        const checkTime = () => {
          if (Math.abs(video.currentTime - currentTime) < 0.1) {
            resolve()
          } else {
            setTimeout(checkTime, 50)
          }
        }
        checkTime()
      })

      // Desenhar o frame atual no canvas
      ctx.drawImage(video, 0, 0, width, height)

      // Converter canvas para blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Criar preview
          const previewUrl = URL.createObjectURL(blob)
          setThumbnailPreview(previewUrl)
          
          // Passar o blob para o componente pai
          onThumbnailSelected(blob)
        }
        setIsGenerating(false)
      }, 'image/jpeg', 0.9)

    } catch (error) {
      console.error('Erro ao gerar thumbnail:', error)
      setIsGenerating(false)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-[#1e1e1e] rounded-lg p-6 border border-[#333333]">
      <h3 className="text-lg font-medium mb-4 text-white">Seletor de Thumbnail</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Player */}
        <div>
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-64 object-contain"
              onLoadedMetadata={handleVideoLoad}
              onTimeUpdate={handleTimeUpdate}
              controls
              preload="metadata"
            />
          </div>
          
          {/* Timeline */}
          {duration > 0 && (
            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-2">
                Selecionar momento: {formatTime(currentTime)} / {formatTime(duration)}
              </label>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={currentTime}
                onChange={(e) => {
                  const time = parseFloat(e.target.value)
                  setCurrentTime(time)
                  if (videoRef.current) {
                    videoRef.current.currentTime = time
                  }
                }}
                className="w-full h-2 bg-[#333333] rounded-lg appearance-none cursor-pointer slider"
              />
              
              {/* Quick time buttons */}
              <div className="flex gap-2 mt-2">
                {[0.1, 0.25, 0.5, 0.75, 0.9].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const time = duration * percentage
                      setCurrentTime(time)
                      if (videoRef.current) {
                        videoRef.current.currentTime = time
                      }
                    }}
                    className="text-xs"
                  >
                    {Math.round(percentage * 100)}%
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Thumbnail Preview */}
        <div>
          <div className="space-y-4">
            <Button
              onClick={generateThumbnail}
              disabled={isGenerating || duration === 0}
              className="w-full bg-[#d87093] hover:bg-[#c45c7c]"
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Gerar Thumbnail
                </>
              )}
            </Button>

            {thumbnailPreview && (
              <div className="bg-black rounded-lg overflow-hidden">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full h-64 object-contain"
                />
                <div className="p-3 bg-[#252525] text-sm text-gray-400">
                  ✅ Thumbnail selecionada do momento {formatTime(currentTime)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for thumbnail generation */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #d87093;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #d87093;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}