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
  const [isComponentMounted, setIsComponentMounted] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Aguardar a montagem do componente
  useEffect(() => {
    setIsComponentMounted(true)
  }, [])

  useEffect(() => {
    if (videoFile && isComponentMounted) {
      // Aguardar um frame de renderização antes de extrair
      requestAnimationFrame(() => {
        setTimeout(() => {
          extractFramesClient()
        }, 200)
      })
    }
  }, [videoFile, isComponentMounted])

  const extractFramesClient = async () => {
    if (!videoFile || !isComponentMounted) return
    
    try {
      setExtracting(true)
      setError('')
      console.log('🎬 Extraindo frames no cliente:', videoFile.name)
      
      // Aguardar mais um pouco para garantir renderização
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verificar se os elementos existem
      const video = videoRef.current
      const canvas = canvasRef.current
      
      console.log('Video element:', video)
      console.log('Canvas element:', canvas)
      console.log('Container:', containerRef.current)
      
      if (!video) {
        console.error('Video element not found in DOM')
        // Tentar criar elementos dinamicamente
        return await extractFramesWithDynamicElements()
      }
      
      if (!canvas) {
        console.error('Canvas element not found in DOM')
        return await extractFramesWithDynamicElements()
      }
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Contexto 2D não disponível no canvas')
      }

      // Processar vídeo
      await processVideo(video, canvas, ctx)
      
    } catch (error) {
      console.error('❌ Erro ao extrair frames:', error)
      setError(error instanceof Error ? error.message : 'Erro ao extrair frames')
    } finally {
      setExtracting(false)
    }
  }

  const extractFramesWithDynamicElements = async () => {
    try {
      console.log('🔧 Criando elementos dinamicamente...')
      
      // Criar video element dinamicamente
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      video.style.position = 'absolute'
      video.style.left = '-9999px'
      video.style.top = '-9999px'
      video.style.width = '1920px'
      video.style.height = '1080px'
      
      // Criar canvas element dinamicamente
      const canvas = document.createElement('canvas')
      canvas.width = 1920
      canvas.height = 1080
      canvas.style.position = 'absolute'
      canvas.style.left = '-9999px'
      canvas.style.top = '-9999px'
      
      // Adicionar ao DOM
      document.body.appendChild(video)
      document.body.appendChild(canvas)
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Contexto 2D não disponível no canvas criado dinamicamente')
      }

      try {
        await processVideo(video, canvas, ctx)
      } finally {
        // Limpar elementos do DOM
        document.body.removeChild(video)
        document.body.removeChild(canvas)
      }
      
    } catch (error) {
      console.error('❌ Erro na extração dinâmica:', error)
      throw error
    }
  }

  const processVideo = async (video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    // Criar URL do vídeo
    const videoUrl = URL.createObjectURL(videoFile)
    video.src = videoUrl
    
    console.log('📹 Carregando vídeo:', videoUrl)
    
    // Aguardar metadados do vídeo com timeout
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao carregar metadados do vídeo (15s)'))
      }, 15000) // 15 segundos de timeout
      
      video.onloadedmetadata = () => {
        clearTimeout(timeout)
        console.log('✅ Metadados carregados')
        resolve(undefined)
      }
      video.onerror = (e) => {
        clearTimeout(timeout)
        console.error('Erro no vídeo:', e)
        reject(new Error(`Erro ao carregar vídeo`))
      }
      
      // Forçar o carregamento
      video.load()
    })
    
    const duration = video.duration
    console.log('📹 Duração do vídeo:', duration, 'segundos')
    
    if (!duration || duration === 0 || !isFinite(duration)) {
      throw new Error('Não foi possível obter a duração válida do vídeo')
    }
    
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
      
      // Aguardar o frame carregar
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn(`⚠️ Timeout no frame ${i + 1}, continuando...`)
          resolve(undefined) // Não rejeitar, apenas continuar
        }, 8000) // 8 segundos por frame
        
        video.onseeked = () => {
          clearTimeout(timeout)
          resolve(undefined)
        }
        video.onerror = (e) => {
          clearTimeout(timeout)
          console.warn(`⚠️ Erro no frame ${i + 1}, continuando...`)
          resolve(undefined) // Não rejeitar, apenas continuar
        }
      })
      
      // Aguardar estabilização
      await new Promise(resolve => setTimeout(resolve, 200))
      
      try {
        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Calcular dimensões para manter proporção 16:9
        const videoWidth = video.videoWidth || 1920
        const videoHeight = video.videoHeight || 1080
        const canvasWidth = canvas.width
        const canvasHeight = canvas.height
        
        // Calcular scale para manter proporção
        const scale = Math.min(canvasWidth / videoWidth, canvasHeight / videoHeight)
        const scaledWidth = videoWidth * scale
        const scaledHeight = videoHeight * scale
        
        // Centralizar na canvas
        const x = (canvasWidth - scaledWidth) / 2
        const y = (canvasHeight - scaledHeight) / 2
        
        // Desenhar frame no canvas mantendo proporção
        ctx.drawImage(video, x, y, scaledWidth, scaledHeight)
        
        // Verificar se tem conteúdo
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const hasData = imageData.data.some(pixel => pixel !== 0)
        
        if (!hasData) {
          console.warn(`⚠️ Frame ${i + 1} vazio, continuando...`)
          continue
        }
        
        // Converter para blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error(`Falha ao converter frame ${i + 1}`))
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
        
      } catch (frameError) {
        console.warn(`⚠️ Erro ao processar frame ${i + 1}:`, frameError)
        // Continuar com o próximo frame
        continue
      }
    }
    
    // Limpar URL do vídeo
    URL.revokeObjectURL(videoUrl)
    
    if (extractedFrames.length === 0) {
      throw new Error('Nenhum frame foi extraído com sucesso. Verifique se o vídeo é válido.')
    }
    
    setFrames(extractedFrames)
    onFramesExtracted?.(extractedFrames)
    console.log('✅ Extração concluída:', extractedFrames.length, 'frames')
  }

  const handleFrameSelect = async (frame: Frame) => {
    try {
      setLoading(true)
      setSelectedFrame(frame)
      
      console.log('🖼️ Selecionando thumbnail:', frame.timestamp)
      onThumbnailSelected(frame.blob)
      
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

  const retryExtraction = () => {
    setError('')
    setFrames([])
    setSelectedFrame(null)
    extractFramesClient()
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
            Processando vídeo e gerando thumbnails...
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
          <div className="space-y-2">
            <Button 
              onClick={retryExtraction}
              className="bg-[#d87093] hover:bg-[#c06082] mr-2"
            >
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => setError('')}
              variant="outline"
              className="bg-[#252525] border-[#333333] text-white hover:bg-[#333333]"
            >
              Pular Thumbnail
            </Button>
          </div>
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
    <div ref={containerRef}>
      {/* Elementos ocultos para processamento */}
      <div 
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px',
          width: '1920px',
          height: '1080px',
          visibility: 'hidden'
        }}
      >
        <video 
          ref={videoRef} 
          preload="metadata"
          muted
          playsInline
          style={{ width: '1920px', height: '1080px' }}
        />
        <canvas 
          ref={canvasRef} 
          width={1920} 
          height={1080}
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