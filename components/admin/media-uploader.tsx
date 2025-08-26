"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Upload, X, Check, Video, FileImage, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from 'uuid'
import { uploadToSupabase } from "@/lib/supabase-tus-upload"

export function MediaUploader() {
  const [mediaType, setMediaType] = useState<"video" | "photo">("video")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [selectedThumbnail, setSelectedThumbnail] = useState<Blob | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  
  // Video thumbnail selection
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const mediaInputRef = useRef<HTMLInputElement>(null)

  const categories = ["Wellness", "ADS", "Experiência", "Beauty", "Pet", "Decor", "Receitas", "Moda", "Viagem"]

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setMediaFile(file)
      setSelectedThumbnail(null)
      setThumbnailPreview("")

      // Auto-detect type
      const isVideo = file.type.startsWith('video/') || 
                     file.name.toLowerCase().match(/\.(mov|mp4|avi|hevc)$/i)
      setMediaType(isVideo ? 'video' : 'photo')

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Auto-populate title
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleVideoLoad = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration)
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

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) throw new Error('Canvas context not available')

      // Set canvas dimensions (9:16 aspect ratio)
      const aspectRatio = 9 / 16
      const width = 540
      const height = width / aspectRatio

      canvas.width = width
      canvas.height = height

      // Draw current frame
      ctx.drawImage(video, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          setSelectedThumbnail(blob)
          const previewUrl = URL.createObjectURL(blob)
          setThumbnailPreview(previewUrl)
          
          toast({
            title: "Thumbnail gerada!",
            description: "Thumbnail do vídeo selecionada com sucesso.",
          })
        }
      }, 'image/jpeg', 0.9)

    } catch (error) {
      console.error('Erro ao gerar thumbnail:', error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar a thumbnail",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!mediaFile || !title || selectedCategories.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, selecione categoria e arquivo",
        variant: "destructive",
      })
      return
    }

    if (mediaType === "video" && !selectedThumbnail) {
      toast({
        title: "Thumbnail necessária",
        description: "Gere uma thumbnail para o vídeo antes de enviar",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      console.log(`📱 Iniciando upload: ${mediaFile.name} (${(mediaFile.size/1024/1024).toFixed(2)}MB)`)
      
      // Gerar caminho único
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const fileExt = mediaFile.name.split('.').pop()?.toLowerCase() || 'unknown'
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${year}/${month}/${fileName}`
      
      // Escolher bucket
      const bucket = mediaType === 'video' ? 'videos' : 'images'
      
      // Upload do arquivo principal
      const fileUrl = await uploadToSupabase({
        file: mediaFile,
        bucket,
        path: filePath,
        onProgress: (progress) => {
          setUploadProgress(Math.round(progress * 0.8)) // 80% para arquivo principal
        },
        onError: (error) => {
          throw error
        }
      }) as string

      console.log(`✅ Arquivo enviado: ${fileUrl}`)

      // Upload da thumbnail se existir
      let thumbnailUrl = fileUrl
      if (selectedThumbnail) {
        const thumbFileName = `thumb_${fileName.replace(/\.[^/.]+$/, '.jpg')}`
        const thumbPath = `${year}/${month}/${thumbFileName}`
        
        try {
          // Converter Blob em File para compatibilidade
          const thumbnailFile = new File([selectedThumbnail], thumbFileName, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          
          thumbnailUrl = await uploadToSupabase({
            file: thumbnailFile,
            bucket: 'thumbnails',
            path: thumbPath,
            onProgress: (progress) => {
              setUploadProgress(80 + Math.round(progress * 0.1)) // 10% para thumbnail
            }
          }) as string
          
          console.log(`✅ Thumbnail enviada: ${thumbnailUrl}`)
        } catch (thumbError) {
          console.warn(`⚠️ Erro na thumbnail:`, thumbError)
        }
      }

      setUploadProgress(90)

      // Salvar metadados no banco
      try {
        const response = await fetch('/api/save-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            category: selectedCategories[0], // Usar primeira categoria por simplicidade
            fileUrl,
            thumbnailUrl,
            fileType: mediaType,
            fileName: mediaFile.name,
            fileSize: mediaFile.size,
            supabasePath: filePath
          })
        })

        if (!response.ok) {
          throw new Error('Erro salvando metadados')
        }

        console.log('✅ Metadados salvos')
      } catch (metaError) {
        console.warn('⚠️ Erro salvando metadados:', metaError)
      }

      setUploadProgress(100)

      toast({
        title: "🎉 Upload concluído!",
        description: `${mediaFile.name} foi enviado com sucesso!`,
      })

      // Reset form após sucesso
      setTimeout(() => {
        setTitle("")
        setDescription("")
        setSelectedCategories([])
        setMediaFile(null)
        setMediaPreview(null)
        setSelectedThumbnail(null)
        setThumbnailPreview("")
        setUploadSuccess(true)
        
        setTimeout(() => {
          setIsUploading(false)
          setUploadSuccess(false)
          setUploadProgress(0)
        }, 2000)
      }, 1000)

    } catch (error) {
      console.error('❌ Erro no upload:', error)
      setIsUploading(false)
      setUploadProgress(0)

      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1e1e1e] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Upload className="w-6 h-6 text-[#d87093]" />
          <h1 className="text-2xl font-bold text-white">Upload de Mídia</h1>
        </div>
        <p className="text-gray-400">
          Sistema otimizado para iOS - MOV, HEVC, HEIC até 50GB
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form Fields */}
          <div className="space-y-6">
            {/* File Upload */}
            <div className="bg-[#1e1e1e] rounded-lg p-6">
              <h2 className="text-lg font-medium text-white mb-4">Arquivo</h2>
              
              <input
                ref={mediaInputRef}
                type="file"
                accept="video/*,image/*,.mov,.heic,.heif"
                onChange={handleMediaChange}
                className="hidden"
              />
              
              <div
                onClick={() => mediaInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  mediaPreview ? "border-[#d87093]" : "border-gray-600 hover:border-gray-500"
                }`}
              >
                {mediaPreview ? (
                  <div className="relative">
                    {mediaType === "video" ? (
                      <div className="relative">
                        <Video className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-white font-medium">{mediaFile?.name}</p>
                        <p className="text-gray-400 text-sm">
                          {mediaFile ? `${(mediaFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <FileImage className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <p className="text-white font-medium">{mediaFile?.name}</p>
                        <p className="text-gray-400 text-sm">
                          {mediaFile ? `${(mediaFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                        </p>
                      </div>
                    )}
                    
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMediaFile(null)
                          setMediaPreview(null)
                          setSelectedThumbnail(null)
                          setThumbnailPreview("")
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-white font-medium">Clique para selecionar arquivo</p>
                    <p className="text-gray-400 text-sm mt-1">
                      MOV, MP4, HEIC, JPG, PNG (até 50GB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="bg-[#1e1e1e] rounded-lg p-6">
              <h2 className="text-lg font-medium text-white mb-4">Informações</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Título *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Digite o título"
                    className="bg-[#252525] border-[#333333] text-white"
                    disabled={isUploading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Descrição
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição opcional"
                    className="bg-[#252525] border-[#333333] text-white"
                    disabled={isUploading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Categorias *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(category)}
                        disabled={isUploading}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedCategories.includes(category)
                            ? "bg-[#d87093] text-white"
                            : "bg-[#252525] text-gray-300 hover:bg-[#333333]"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  {selectedCategories.length > 0 && (
                    <p className="mt-2 text-sm text-gray-400">
                      Selecionadas: {selectedCategories.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Video Thumbnail Selector */}
          {mediaType === "video" && mediaPreview && (
            <div className="bg-[#1e1e1e] rounded-lg p-6">
              <h2 className="text-lg font-medium text-white mb-4">Thumbnail do Vídeo *</h2>
              
              <div className="space-y-4">
                {/* Video Player */}
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={mediaPreview}
                    className="w-full h-48 object-contain"
                    onLoadedMetadata={handleVideoLoad}
                    onTimeUpdate={handleTimeUpdate}
                    controls
                    preload="metadata"
                  />
                </div>

                {/* Timeline */}
                {videoDuration > 0 && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Momento: {formatTime(currentTime)} / {formatTime(videoDuration)}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={videoDuration}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => {
                        const time = parseFloat(e.target.value)
                        setCurrentTime(time)
                        if (videoRef.current) {
                          videoRef.current.currentTime = time
                        }
                      }}
                      className="w-full h-2 bg-[#333333] rounded-lg appearance-none cursor-pointer"
                      disabled={isUploading}
                    />
                  </div>
                )}

                {/* Generate Thumbnail Button */}
                <Button
                  type="button"
                  onClick={generateThumbnail}
                  disabled={isUploading || videoDuration === 0}
                  className="w-full bg-[#d87093] hover:bg-[#c45c7c]"
                >
                  Gerar Thumbnail
                </Button>

                {/* Thumbnail Preview */}
                {thumbnailPreview && (
                  <div className="bg-black rounded-lg overflow-hidden">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-32 object-contain"
                    />
                    <div className="p-2 bg-[#252525] text-sm text-green-400 text-center">
                      ✅ Thumbnail selecionada
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden canvas */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>

        {/* Upload Progress & Submit */}
        <div className="bg-[#1e1e1e] rounded-lg p-6">
          {!isUploading && !uploadSuccess ? (
            <Button
              type="submit"
              className="w-full bg-[#d87093] hover:bg-[#c45c7c] text-white font-medium py-3"
              disabled={!mediaFile || !title || selectedCategories.length === 0 || (mediaType === "video" && !selectedThumbnail)}
            >
              <Upload className="w-5 h-5 mr-2" />
              Enviar {mediaType === "video" ? "Vídeo" : "Foto"}
            </Button>
          ) : isUploading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin">
                  <Upload className="w-5 h-5 text-[#d87093]" />
                </div>
                <span className="text-white">Enviando...</span>
              </div>
              
              <div className="w-full bg-[#252525] rounded-full h-3">
                <div
                  className="bg-[#d87093] h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              
              <p className="text-center text-gray-400">
                {uploadProgress}% completo
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 text-green-400">
              <Check className="w-5 h-5" />
              <span>Upload concluído com sucesso!</span>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}