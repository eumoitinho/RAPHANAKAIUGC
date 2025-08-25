"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface VideoThumbnailSelectorProps {
  videoFile: File
  onSelect: (thumbnailBlob: Blob) => void
  isOpen: boolean
  onClose: () => void
}

export function VideoThumbnailSelector({
  videoFile,
  onSelect,
  isOpen,
  onClose,
}: VideoThumbnailSelectorProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string>("")

  useEffect(() => {
    if (isOpen && videoFile) {
      const url = URL.createObjectURL(videoFile)
      setVideoUrl(url)
      generateThumbnails(url)
      
      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [isOpen, videoFile])

  const generateThumbnails = async (videoUrl: string) => {
    setIsGenerating(true)
    const video = document.createElement('video')
    video.src = videoUrl
    video.crossOrigin = 'anonymous'
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      setIsGenerating(false)
      return
    }

    const frames: string[] = []
    
    video.addEventListener('loadedmetadata', () => {
      canvas.width = 400
      canvas.height = 600
      
      const duration = video.duration
      const intervals = [0.1, 0.5, 1, 2, 3, 5, 10, 15, 20].filter(t => t < duration)
      
      let currentIndex = 0
      
      const captureFrame = () => {
        if (currentIndex >= intervals.length) {
          setThumbnails(frames)
          setIsGenerating(false)
          return
        }
        
        video.currentTime = intervals[currentIndex]
      }
      
      video.addEventListener('seeked', () => {
        // Desenhar o frame atual no canvas
        const aspectRatio = video.videoWidth / video.videoHeight
        let drawWidth = canvas.width
        let drawHeight = canvas.height
        
        if (aspectRatio > canvas.width / canvas.height) {
          drawHeight = canvas.width / aspectRatio
        } else {
          drawWidth = canvas.height * aspectRatio
        }
        
        const x = (canvas.width - drawWidth) / 2
        const y = (canvas.height - drawHeight) / 2
        
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(video, x, y, drawWidth, drawHeight)
        
        canvas.toBlob((blob) => {
          if (blob) {
            frames.push(URL.createObjectURL(blob))
          }
          currentIndex++
          captureFrame()
        }, 'image/jpeg', 0.8)
      })
      
      captureFrame()
    })
    
    video.load()
  }

  const handleConfirm = async () => {
    if (thumbnails[selectedIndex]) {
      try {
        const response = await fetch(thumbnails[selectedIndex])
        const blob = await response.blob()
        onSelect(blob)
        onClose()
      } catch (error) {
        console.error('Error selecting thumbnail:', error)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Selecione uma Thumbnail</DialogTitle>
          <DialogDescription>
            Escolha o melhor frame do vídeo para usar como thumbnail
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-sm text-gray-500">Extraindo frames do vídeo...</p>
            </div>
          ) : (
            <>
              {/* Preview do frame selecionado */}
              {thumbnails[selectedIndex] && (
                <div className="mb-6">
                  <div className="aspect-[9/16] max-h-[400px] mx-auto relative rounded-lg overflow-hidden bg-gray-900">
                    <img
                      src={thumbnails[selectedIndex]}
                      alt="Selected thumbnail"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Grid de thumbnails */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {thumbnails.map((thumb, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={`relative aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all ${
                      selectedIndex === index
                        ? 'border-[#d87093] scale-105'
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <img
                      src={thumb}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedIndex === index && (
                      <div className="absolute inset-0 bg-[#d87093]/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isGenerating || thumbnails.length === 0}
            className="bg-[#d87093] hover:bg-[#c45c7c]"
          >
            Confirmar Thumbnail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}