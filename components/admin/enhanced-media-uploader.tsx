"use client"

import React, { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { Upload, X, Plus, Check, Play, Pause, RotateCcw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"

interface VideoFrame {
  timestamp: number
  frameUrl: string
}

interface UploadProgress {
  stage: 'uploading' | 'processing' | 'extracting' | 'complete'
  progress: number
  message: string
}

export function EnhancedMediaUploader() {
  const [mediaType, setMediaType] = useState<"video" | "photo">("video")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [videoFrames, setVideoFrames] = useState<VideoFrame[]>([])
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const mediaInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const categories = ["Wellness", "ADS", "Experiência", "Beauty", "Pet", "Decor", "Receitas", "Moda", "Viagem"]

  // Limites ajustados para Vercel
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB
  const MAX_PHOTO_SIZE = 20 * 1024 * 1024 // 20MB

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const validateFileSize = (file: File): boolean => {
    const maxSize = mediaType === "video" ? MAX_VIDEO_SIZE : MAX_PHOTO_SIZE
    const maxSizeMB = Math.round(maxSize / (1024 * 1024))
    
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${maxSizeMB}MB para ${mediaType === "video" ? "vídeos" : "fotos"}.`,
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const handleMediaChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validar tamanho do arquivo
      if (!validateFileSize(file)) {
        return
      }

      setMediaFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Se for vídeo, extrair frames para seleção de thumbnail
      if (mediaType === "video") {
        setUploadProgress({
          stage: 'extracting',
          progress: 0,
          message: 'Extraindo frames do vídeo...'
        })

        try {
          const formData = new FormData()
          formData.append('video', file)

          const response = await fetch('/api/extract-frames', {
            method: 'POST',
            body: formData
          })

          if (response.ok) {
            const { frames } = await response.json()
            setVideoFrames(frames)
            setUploadProgress(null)
          } else {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Falha ao extrair frames')
          }
        } catch (error) {
          console.error('Error extracting frames:', error)
          toast({
            title: "Erro",
            description: error instanceof Error ? error.message : "Falha ao extrair frames do vídeo",
            variant: "destructive",
          })
          setUploadProgress(null)
        }
      }
    }
  }, [mediaType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!mediaFile || !title || selectedCategories.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    if (mediaType === "video" && !selectedFrame) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione um frame para thumbnail",
        variant: "destructive",
      })
      return
    }

    // Validar tamanho novamente antes do upload
    if (!validateFileSize(mediaFile)) {
      return
    }

    setIsUploading(true)
    setUploadProgress({
      stage: 'uploading',
      progress: 0,
      message: 'Iniciando upload otimizado...'
    })

    try {
      const formData = new FormData()
      formData.append('file', mediaFile)
      formData.append('title', title)
      formData.append('description', description)
      formData.append('fileType', mediaType)
      formData.append('categories', JSON.stringify(selectedCategories))
      
      if (selectedFrame) {
        formData.append('selectedFrame', selectedFrame)
      }

      const response = await fetch('/api/upload-media', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()

      setUploadProgress({
        stage: 'complete',
        progress: 100,
        message: 'Upload concluído com sucesso!'
      })

      toast({
        title: "🎉 Upload completo",
        description: `Arquivo otimizado e enviado! Economia: ${result.optimizationInfo?.compressionRatio || '0%'}`,
      })

      setUploadSuccess(true)

      // Reset form after success
      setTimeout(() => {
        setTitle("")
        setDescription("")
        setSelectedCategories([])
        setMediaFile(null)
        setMediaPreview(null)
        setVideoFrames([])
        setSelectedFrame(null)
        setUploadSuccess(false)
        setUploadProgress(null)
        setIsUploading(false)
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      setIsUploading(false)
      setUploadProgress(null)
      toast({
        title: "Erro no upload",
        description: `Ocorreu um erro durante o upload: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    }
  }

  const resetUpload = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setVideoFrames([])
    setSelectedFrame(null)
    setUploadProgress(null)
    setIsUploading(false)
    setUploadSuccess(false)
  }

  const getMaxSizeText = () => {
    if (mediaType === "video") {
      return "MP4, WebM ou MOV (máx. 50MB)"
    } else {
      return "PNG, JPG ou WebP (máx. 20MB)"
    }
  }

  return (
    <div className="bg-[#1e1e1e] rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Upload Otimizado - Vercel Ready</h2>
        {(mediaFile || uploadProgress) && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetUpload}
            className="bg-[#252525] border-[#333333] text-white hover:bg-[#333333]"
          >
            <RotateCcw size={16} className="mr-2" />
            Resetar
          </Button>
        )}
      </div>

      {/* Aviso sobre limites do Vercel */}
      <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="mr-2 h-5 w-5 text-amber-400 mt-0.5" />
          <div>
            <h4 className="text-amber-400 font-medium mb-1">⚡ Otimizado para Vercel</h4>
            <p className="text-sm text-amber-200">
              Limites ajustados para processamento rápido: <strong>50MB para vídeos</strong> e <strong>20MB para fotos</strong>.
              Processamento em até 60 segundos com otimização automática.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {/* Media Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Mídia</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setMediaType("video")}
                  className={`px-4 py-2 rounded-md ${
                    mediaType === "video" ? "bg-[#d87093] text-white" : "bg-[#252525] text-gray-300 hover:bg-[#333333]"
                  }`}
                  disabled={isUploading}
                >
                  Vídeo (50MB)
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType("photo")}
                  className={`px-4 py-2 rounded-md ${
                    mediaType === "photo" ? "bg-[#d87093] text-white" : "bg-[#252525] text-gray-300 hover:bg-[#333333]"
                  }`}
                  disabled={isUploading}
                >
                  Foto (20MB)
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Título <span className="text-[#d87093]">*</span>
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#252525] border-[#333333] focus:border-[#d87093] text-white"
                required
                disabled={isUploading}
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Descrição
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[#252525] border-[#333333] focus:border-[#d87093] text-white min-h-[100px]"
                disabled={isUploading}
              />
            </div>

            {/* Categories */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Categorias <span className="text-[#d87093]">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedCategories.includes(category)
                        ? "bg-[#d87093] text-white"
                        : "bg-[#252525] text-gray-300 hover:bg-[#333333]"
                    }`}
                    disabled={isUploading}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {selectedCategories.length > 0 && (
                <p className="mt-2 text-sm text-gray-400">Categorias selecionadas: {selectedCategories.join(", ")}</p>
              )}
            </div>
          </div>

          <div>
            {/* Media Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {mediaType === "video" ? "Vídeo" : "Foto"} <span className="text-[#d87093]">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center ${
                  mediaPreview ? "border-[#d87093]" : "border-gray-600 hover:border-gray-500"
                }`}
              >
                {mediaPreview ? (
                  <div className="relative">
                    {mediaType === "video" ? (
                      <video 
                        ref={videoRef}
                        src={mediaPreview} 
                        controls 
                        className="max-h-[200px] mx-auto" 
                      />
                    ) : (
                      <div className="relative h-[200px] w-full">
                        <Image src={mediaPreview} alt="Preview" fill className="object-contain" />
                      </div>
                    )}
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => {
                          setMediaFile(null)
                          setMediaPreview(null)
                          setVideoFrames([])
                          setSelectedFrame(null)
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-8 cursor-pointer" onClick={() => !isUploading && mediaInputRef.current?.click()}>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-400">Clique para fazer upload ou arraste e solte</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {getMaxSizeText()}
                    </p>
                  </div>
                )}
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept={mediaType === "video" ? "video/*" : "image/*"}
                  onChange={handleMediaChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Video Frame Selection */}
            {mediaType === "video" && videoFrames.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Selecionar Thumbnail <span className="text-[#d87093]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {videoFrames.map((frame, index) => (
                    <div
                      key={index}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedFrame === frame.frameUrl
                          ? "border-[#d87093]"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                      onClick={() => setSelectedFrame(frame.frameUrl)}
                    >
                      <Image
                        src={frame.frameUrl}
                        alt={`Frame ${index + 1}`}
                        width={120}
                        height={68}
                        className="object-cover w-full h-16"
                      />
                      {selectedFrame === frame.frameUrl && (
                        <div className="absolute inset-0 bg-[#d87093]/20 flex items-center justify-center">
                          <Check className="text-[#d87093]" size={20} />
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                        {Math.floor(frame.timestamp)}s
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>{uploadProgress.message}</span>
              <span>{uploadProgress.progress}%</span>
            </div>
            <Progress value={uploadProgress.progress} className="w-full" />
            <p className="text-xs text-gray-400 mt-2">
              Processamento otimizado para Vercel (máx. 60s)
            </p>
          </div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <div className="mt-6 bg-green-900/30 text-green-400 p-3 rounded-md flex items-center">
            <Check className="mr-2" size={20} />
            <span>Mídia enviada e otimizada com sucesso!</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <Button
            type="submit"
            disabled={isUploading || uploadSuccess || (mediaType === "video" && videoFrames.length > 0 && !selectedFrame)}
            className="bg-[#d87093] hover:bg-[#c45c7c] text-white px-8"
          >
            {isUploading ? "Processando..." : "Enviar Mídia"}
          </Button>
        </div>
      </form>
    </div>
  )
}