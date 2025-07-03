'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play } from 'lucide-react'

interface Frame {
  id: number
  timestamp: string
  url: string
  path: string
}

interface VideoThumbnailSelectorProps {
  videoFile: File
  onThumbnailSelected: (thumbnailUrl: string) => void
  onFramesExtracted?: (frames: Frame[]) => void
}

export default function VideoThumbnailSelector({ 
  videoFile, 
  onThumbnailSelected, 
  onFramesExtracted 
}: VideoThumbnailSelectorProps) {
  const [frames, setFrames] = useState<Frame[]>([])
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null)
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (videoFile) {
      extractFrames()
    }
  }, [videoFile])

  const extractFrames = async () => {
    if (!videoFile) return
    
    try {
      setExtracting(true)
      setError('')
      console.log('🎬 Extraindo frames do vídeo:', videoFile.name)
      
      const formData = new FormData()
      formData.append('video', videoFile)
      
      const response = await fetch('/api/extract-frames', {
        method: 'POST',
        body: formData
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers.get('content-type'))

      if (!response.ok) {
        const responseText = await response.text()
        console.error('Response text:', responseText)
        
        // Tentar parsear como JSON se possível
        try {
          const errorData = JSON.parse(responseText)
          throw new Error(errorData.error || 'Erro ao extrair frames')
        } catch {
          throw new Error(`Erro ${response.status}: ${responseText.substring(0, 100)}...`)
        }
      }

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const responseText = await response.text()
        console.error('Resposta não é JSON:', responseText)
        throw new Error('Resposta inválida do servidor (não é JSON)')
      }

      const result = await response.json()
      
      if (result.success && result.frames) {
        setFrames(result.frames)
        onFramesExtracted?.(result.frames)
        console.log('✅ Frames extraídos:', result.frames.length)
      } else {
        throw new Error(result.error || 'Nenhum frame foi extraído')
      }
    } catch (error) {
      console.error('❌ Erro ao extrair frames:', error)
      setError(error instanceof Error ? error.message : 'Erro ao extrair frames')
    } finally {
      setExtracting(false)
    }
  }

  const handleFrameSelect = async (frame: Frame) => {
    try {
      setLoading(true)
      setSelectedFrame(frame)
      
      console.log('🖼️ Selecionando thumbnail:', frame.timestamp)
      
      // Usar a URL do frame como thumbnail
      onThumbnailSelected(frame.url)
      
      console.log('✅ Thumbnail selecionada:', frame.url)
    } catch (error) {
      console.error('❌ Erro ao selecionar thumbnail:', error)
      setError('Erro ao selecionar thumbnail')
    } finally {
      setLoading(false)
    }
  }

  if (extracting) {
    return (
      <Card className="bg-[#1e1e1e] border-[#333333]">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Loader2 className="h-6 w-6 animate-spin text-[#d87093]" />
            <Play className="h-6 w-6 text-[#d87093]" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Extraindo Frames</h3>
          <p className="text-sm text-gray-400">
            Gerando frames do vídeo na VPS usando FFmpeg...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-[#1e1e1e] border-[#333333]">
        <CardContent className="p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button 
            onClick={extractFrames}
            className="bg-[#d87093] hover:bg-[#c06082]"
          >
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (frames.length === 0) {
    return (
      <Card className="bg-[#1e1e1e] border-[#333333]">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400 mb-4">Nenhum frame disponível</p>
          <Button 
            onClick={extractFrames}
            className="bg-[#d87093] hover:bg-[#c06082]"
          >
            Extrair Frames
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1e1e1e] border-[#333333]">
      <CardHeader>
        <CardTitle className="text-[#d87093] flex items-center justify-between">
          Selecionar Thumbnail
          {selectedFrame && (
            <Badge variant="secondary" className="bg-[#d87093]/20 text-[#d87093]">
              {selectedFrame.timestamp} selecionado
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-400">
          Clique em um frame para usar como thumbnail do vídeo
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {frames.map((frame) => (
            <div
              key={frame.id}
              className={`
                cursor-pointer border-2 rounded-lg overflow-hidden transition-all hover:scale-105
                ${selectedFrame?.id === frame.id 
                  ? 'border-[#d87093] ring-2 ring-[#d87093]/30' 
                  : 'border-[#333333] hover:border-[#555555]'
                }
              `}
              onClick={() => handleFrameSelect(frame)}
            >
              <div className="relative aspect-video">
                <Image
                  src={frame.url}
                  alt={`Frame ${frame.timestamp}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
                {loading && selectedFrame?.id === frame.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                )}
                
                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="bg-black bg-opacity-50 rounded-full p-2">
                    <Play className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-2 text-center bg-[#252525]">
                <span className="text-xs text-gray-300">{frame.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
        
        {frames.length > 0 && !selectedFrame && (
          <p className="text-sm text-gray-400 mt-4 text-center">
            ↑ Clique em um frame para definir como thumbnail
          </p>
        )}
        
        {selectedFrame && (
          <div className="mt-4 p-3 bg-[#252525] rounded-lg">
            <p className="text-sm text-green-400">
              ✅ Thumbnail selecionada: Frame em {selectedFrame.timestamp}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}