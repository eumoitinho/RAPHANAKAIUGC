'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Frame {
  id: number
  timestamp: string
  url: string
  blob: Blob
}

interface VideoThumbnailSelectorProps {
  videoFile: File
  onThumbnailSelected: (thumbnailBlob: Blob) => void
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
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (videoFile) {
      // Pequeno delay para garantir que os elementos estejam no DOM
      setTimeout(() => {
        extractFramesClient()
      }, 100)
    }
  }, [videoFile])

  const extractFramesClient = async () => {
    if (!videoFile) return
    
    try {
      setExtracting(true)
      setError('')
      console.log('🎬 Extraindo frames no cliente:', videoFile.name)
      
      // Verificar se os elementos existem com mais detalhes
      const video = videoRef.current
      const canvas = canvasRef.current
      
      console.log('Video element:', video)
      console.log('Canvas element:', canvas)
      
      if (!video) {
        throw new Error('Elemento de vídeo não encontrado. Verifique se o componente foi renderizado corretamente.')
      }
      
      if (!canvas) {
        throw new Error('Elemento canvas não encontrado. Verifique se o componente foi renderizado corretamente.')
      }
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Contexto 2D não disponível no canvas')
      }

      // Criar URL do vídeo
      const videoUrl = URL.createObjectURL(videoFile)
      video.src = videoUrl
      
      console.log('📹 Carregando vídeo:', videoUrl)
      
      // Aguardar metadados do vídeo com timeout
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout ao carregar metadados do vídeo'))
        }, 10000) // 10 segundos de timeout
        
        video.onloadedmetadata = () => {
          clearTimeout(timeout)
          resolve(undefined)
        }
        video.onerror = (e) => {
          clearTimeout(timeout)
          reject(new Error(`Erro ao carregar vídeo: ${e}`))
        }
        
        // Forçar o carregamento
        video.load()
      })
      
      const duration = video.duration
      console.log('📹 Duração do vídeo:', duration, 'segundos')
      
      if (!duration || duration === 0) {
        throw new Error('Não foi possível obter a duração do vídeo')
      }
      
      // Definir canvas com tamanho apropriado
      canvas.width = 320
      canvas.height = 180
      
      const timestamps = [
        { percent: 10, time: duration * 0.1 },
        { percent: 25, time: duration * 0.25 },
        { percent: 50, time: duration * 0.5 },
        { percent: 75, time: duration * 0.75 },
        { percent: 90, time: duration * 0.9 }
      ]
      
      const extractedFrames: Frame[] = []
      
      for (let i = 0; i < timestamps.length; i++) {
        const { percent, time } = timestamps[i]
        
        console.log(`🖼️ Extraindo frame ${i + 1} em ${percent}% (${time.toFixed(1)}s)`)
        
        // Navegar para o tempo específico
        video.currentTime = time
        
        // Aguardar o frame carregar com timeout
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout ao buscar frame em ${percent}%`))
          }, 5000)
          
          video.onseeked = () => {
            clearTimeout(timeout)
            resolve(undefined)
          }
          video.onerror = (e) => {
            clearTimeout(timeout)
            reject(new Error(`Erro ao navegar para ${percent}%: ${e}`))
          }
        })
        
        // Aguardar um pouco mais para garantir que o frame está carregado
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Limpar canvas antes de desenhar
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Desenhar frame no canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Verificar se algo foi desenhado
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const hasData = imageData.data.some(pixel => pixel !== 0)
        
        if (!hasData) {
          console.warn(`⚠️ Frame ${i + 1} parece estar vazio`)
        }
        
        // Converter canvas para blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error(`Falha ao converter frame ${i + 1} para blob`))
            }
          }, 'image/jpeg', 0.8)
        })
        
        // Criar URL para preview
        const url = URL.createObjectURL(blob)
        
        extractedFrames.push({
          id: i + 1,
          timestamp: `${percent}%`,
          url,
          blob
        })
        
        console.log(`✅ Frame ${i + 1} extraído com sucesso`)
      }
      
      // Limpar URL do vídeo
      URL.revokeObjectURL(videoUrl)
      
      setFrames(extractedFrames)
      onFramesExtracted?.(extractedFrames)
      console.log('✅ Todos os frames extraídos:', extractedFrames.length)
      
      if (extractedFrames.length === 0) {
        throw new Error('Nenhum frame foi extraído com sucesso')
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
      
      // Passar o blob da thumbnail
      onThumbnailSelected(frame.blob)
      
      console.log('✅ Thumbnail selecionada:', frame.timestamp)
      
      toast({
        title: "Thumbnail selecionada",
        description: `Frame em ${frame.timestamp} definido como thumbnail`,
      })
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
            Gerando frames do vídeo no navegador...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-[#1e1e1e] border-[#333333]">
        <CardContent className="p-6 text-center">
          <p className="text-red-400 mb-4 text-sm">{error}</p>
          <Button 
            onClick={extractFramesClient}
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
            onClick={extractFramesClient}
            className="bg-[#d87093] hover:bg-[#c06082]"
          >
            Extrair Frames
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      {/* Elementos para processamento - agora visíveis mas ocultos */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <video 
          ref={videoRef} 
          preload="metadata"
          muted
          playsInline
          style={{ width: '320px', height: '180px' }}
        />
        <canvas 
          ref={canvasRef} 
          width={320} 
          height={180}
        />
      </div>
      
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
    </div>
  )
}