"use client"

import React, { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, Check, Video, FileImage, Play, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { useFastMediaUpload } from "@/hooks/use-fast-media-upload"
import { generateVideoThumbnail, generateMultipleThumbnails, type ThumbnailResult } from "@/lib/video-thumbnail"

export function MediaUploader() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [availableThumbnails, setAvailableThumbnails] = useState<ThumbnailResult[]>([])
  const [selectedThumbnail, setSelectedThumbnail] = useState<ThumbnailResult | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [customThumbnailFile, setCustomThumbnailFile] = useState<File | null>(null)
  
  const { uploadFile, uploading, uploadProgress } = useFastMediaUpload()
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const categories = ["Wellness", "ADS", "Experiência", "Beauty", "Pet", "Decor", "Receitas", "Moda", "Viagem"]

  const isVideo = mediaFile?.type.startsWith('video/') || 
                 mediaFile?.name.toLowerCase().match(/\.(mov|mp4|avi|hevc)$/i)

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category))
    } else {
      setSelectedCategories([...selectedCategories, category])
    }
  }

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setMediaFile(file)
      setSelectedThumbnail(null)
      setAvailableThumbnails([])
      setCustomThumbnailFile(null)

      console.log(`📱 Arquivo selecionado: ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)`)

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setMediaPreview(previewUrl)

      // Para vídeos, gerar thumbnails automaticamente
      if (isVideo) {
        try {
          toast({
            title: "🎬 Gerando thumbnails",
            description: "Aguarde enquanto geramos opções de thumbnail..."
          })

          // Gerar thumbnails em diferentes momentos do vídeo
          const timePoints = [1, 2, 5] // 1s, 2s, 5s
          const thumbnails = await generateMultipleThumbnails(file, timePoints, {
            width: 320,
            height: 180,
            quality: 0.8
          })

          setAvailableThumbnails(thumbnails)
          if (thumbnails.length > 0) {
            setSelectedThumbnail(thumbnails[0]) // Selecionar primeira automaticamente
          }

          toast({
            title: "✅ Thumbnails geradas",
            description: `${thumbnails.length} opções disponíveis`
          })
        } catch (error) {
          console.warn('Erro ao gerar thumbnails:', error)
          toast({
            title: "⚠️ Aviso",
            description: "Não foi possível gerar thumbnails. Você pode enviar uma personalizada.",
            variant: "destructive"
          })
        }
      }
    }
  }

  const handleCustomThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setCustomThumbnailFile(file)
      
      // Criar thumbnail result para compatibilidade
      const reader = new FileReader()
      reader.onload = () => {
        const customThumbnail: ThumbnailResult = {
          blob: file,
          dataUrl: reader.result as string,
          dimensions: { width: 320, height: 180 }
        }
        setSelectedThumbnail(customThumbnail)
      }
      reader.readAsDataURL(file)
    }
  }

  // Função para resetar o form
  const resetForm = () => {
    setTitle("")
    setDescription("")
    setSelectedCategories([])
    setMediaFile(null)
    setMediaPreview(null)
    setAvailableThumbnails([])
    setSelectedThumbnail(null)
    setCustomThumbnailFile(null)
    setUploadSuccess(false)
    
    // Limpar inputs
    if (mediaInputRef.current) mediaInputRef.current.value = ''
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações básicas
    if (!mediaFile || !title.trim() || selectedCategories.length === 0) {
      toast({
        title: "❌ Campos obrigatórios",
        description: "Preencha título, selecione categoria e arquivo",
        variant: "destructive",
      })
      return
    }

    // Para vídeos, verificar se tem thumbnail (gerada automaticamente ou personalizada)
    if (isVideo && !selectedThumbnail) {
      toast({
        title: "❌ Thumbnail necessária",
        description: "Selecione uma thumbnail ou envie uma personalizada",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`🚀 Iniciando upload rápido: ${mediaFile.name} (${(mediaFile.size/1024/1024).toFixed(2)}MB)`)
      
      // Upload usando o novo sistema rápido
      const uploadResult = await uploadFile(mediaFile)
      
      console.log(`✅ Upload concluído:`, uploadResult)

      // Determinar URL da thumbnail
      let thumbnailUrl = uploadResult.thumbnailUrl || uploadResult.url
      
      // Se o usuário selecionou uma thumbnail personalizada, fazer upload dela
      if (isVideo && selectedThumbnail && customThumbnailFile) {
        try {
          const thumbnailResult = await uploadFile(customThumbnailFile)
          thumbnailUrl = thumbnailResult.url
          console.log(`✅ Thumbnail personalizada enviada: ${thumbnailUrl}`)
        } catch (error) {
          console.warn('⚠️ Erro no upload da thumbnail personalizada, usando automática')
        }
      }

      // Salvar metadados no banco
      const response = await fetch('/api/save-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: selectedCategories[0],
          fileUrl: uploadResult.url,
          thumbnailUrl,
          fileType: isVideo ? 'video' : 'photo',
          fileName: mediaFile.name,
          fileSize: mediaFile.size,
          supabasePath: uploadResult.url.split('/').slice(-3).join('/') // Extrair path do URL
        })
      })

      if (!response.ok) {
        throw new Error('Erro salvando no banco de dados')
      }

      const result = await response.json()
      console.log('💾 Metadados salvos:', result)

      toast({
        title: "🎉 Upload concluído!",
        description: `"${title}" foi enviado com sucesso!`,
      })

      // Mostrar sucesso e resetar form
      setUploadSuccess(true)
      setTimeout(() => {
        resetForm()
      }, 2000)

    } catch (error) {
      console.error('❌ Erro no upload:', error)
      
      toast({
        title: "❌ Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido no upload",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1e1e1e] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Upload className="w-6 h-6 text-[#d87093]" />
          <h1 className="text-2xl font-bold text-white">Upload Rápido</h1>
        </div>
        <p className="text-gray-400">
          Sistema otimizado para iOS - Upload direto, thumbnails automáticas, sem limite de tamanho
        </p>
        {mediaFile && (
          <p className="text-sm text-[#d87093] mt-2">
            📱 {mediaFile.name} • {(mediaFile.size/1024/1024).toFixed(1)}MB • {isVideo ? 'Vídeo' : 'Foto'}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form Fields */}
          <div className="space-y-6">
            {/* File Upload */}
            <div className="bg-[#1e1e1e] rounded-lg p-6">
              <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Arquivo
              </h2>
              
              <input
                ref={mediaInputRef}
                type="file"
                accept="video/*,image/*,.mov,.heic,.heif,.mp4,.avi"
                onChange={handleMediaChange}
                className="hidden"
                disabled={uploading}
              />
              
              <div
                onClick={() => !uploading && mediaInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                  mediaPreview 
                    ? "border-[#d87093] bg-[#d87093]/5" 
                    : uploading 
                      ? "border-gray-700 cursor-not-allowed opacity-50"
                      : "border-gray-600 hover:border-gray-500 hover:bg-gray-800/20"
                }`}
              >
                {mediaFile ? (
                  <div className="relative">
                    <div className="flex flex-col items-center">
                      {isVideo ? (
                        <Video className="w-12 h-12 text-blue-400 mb-3" />
                      ) : (
                        <FileImage className="w-12 h-12 text-green-400 mb-3" />
                      )}
                      
                      <p className="text-white font-medium text-lg mb-1">
                        {mediaFile.name}
                      </p>
                      <p className="text-gray-400 text-sm mb-2">
                        {(mediaFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      
                      {isVideo && availableThumbnails.length > 0 && (
                        <p className="text-[#d87093] text-xs">
                          ✅ {availableThumbnails.length} thumbnails geradas
                        </p>
                      )}
                    </div>
                    
                    {!uploading && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          resetForm()
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-white font-medium text-lg mb-2">
                      Clique para selecionar arquivo
                    </p>
                    <p className="text-gray-400 text-sm">
                      Vídeos: MOV, MP4, HEVC • Fotos: JPG, PNG, HEIC
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Sem limite de tamanho
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="bg-[#1e1e1e] rounded-lg p-6">
              <h2 className="text-lg font-medium text-white mb-4">📝 Informações</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Título * (não usar nome do arquivo)
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Receita de bolo de chocolate"
                    className="bg-[#252525] border-[#333333] text-white placeholder:text-gray-500 focus:border-[#d87093]"
                    disabled={uploading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Descrição
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição detalhada (opcional)"
                    className="bg-[#252525] border-[#333333] text-white placeholder:text-gray-500 focus:border-[#d87093] min-h-20"
                    disabled={uploading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Categoria *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleCategory(category)}
                        disabled={uploading}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedCategories.includes(category)
                            ? "bg-[#d87093] text-white scale-105"
                            : "bg-[#252525] text-gray-300 hover:bg-[#333333] hover:text-white"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  {selectedCategories.length > 0 && (
                    <div className="mt-3 p-2 bg-[#252525] rounded-lg">
                      <p className="text-sm text-[#d87093]">
                        ✅ {selectedCategories.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Thumbnail Selection */}
          {isVideo && mediaFile && (
            <div className="bg-[#1e1e1e] rounded-lg p-6">
              <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Thumbnail do Vídeo *
              </h2>
              
              <div className="space-y-6">
                {/* Auto-generated Thumbnails */}
                {availableThumbnails.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">
                      🤖 Thumbnails Geradas Automaticamente
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {availableThumbnails.map((thumbnail, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setSelectedThumbnail(thumbnail)
                            setCustomThumbnailFile(null)
                          }}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            selectedThumbnail === thumbnail && !customThumbnailFile
                              ? "border-[#d87093] scale-105"
                              : "border-transparent hover:border-gray-500"
                          }`}
                          disabled={uploading}
                        >
                          <img
                            src={thumbnail.dataUrl}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-20 object-cover"
                          />
                          {selectedThumbnail === thumbnail && !customThumbnailFile && (
                            <div className="absolute inset-0 bg-[#d87093]/20 flex items-center justify-center">
                              <Check className="w-6 h-6 text-[#d87093]" />
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                            {index + 1}s
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    📤 Ou Envie Sua Própria Thumbnail
                  </label>
                  
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomThumbnailChange}
                    className="hidden"
                    disabled={uploading}
                  />
                  
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg p-4 text-center transition-colors"
                  >
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-400 text-sm">Clique para enviar thumbnail</p>
                    <p className="text-gray-500 text-xs mt-1">JPG, PNG recomendado</p>
                  </button>
                </div>

                {/* Selected Thumbnail Preview */}
                {selectedThumbnail && (
                  <div className="bg-[#252525] rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      ✅ Thumbnail Selecionada
                    </label>
                    <div className="relative">
                      <img
                        src={selectedThumbnail.dataUrl}
                        alt="Selected thumbnail"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 right-2 bg-[#d87093] text-white px-2 py-1 rounded text-xs">
                        {customThumbnailFile ? "Personalizada" : "Automática"}
                      </div>
                    </div>
                  </div>
                )}

                {availableThumbnails.length === 0 && !selectedThumbnail && (
                  <div className="text-center p-6 text-gray-400">
                    <Camera className="mx-auto h-12 w-12 mb-3 opacity-50" />
                    <p>Thumbnails sendo geradas...</p>
                    <p className="text-sm mt-1">Ou envie uma personalizada acima</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button & Progress */}
        <div className="bg-[#1e1e1e] rounded-lg p-6">
          {uploadSuccess ? (
            <div className="text-center">
              <div className="inline-flex items-center gap-3 text-green-400 mb-4">
                <Check className="w-8 h-8" />
                <span className="text-xl font-medium">Upload concluído!</span>
              </div>
              <p className="text-gray-400 text-sm">
                Sua mídia foi enviada e aparecerá no portfolio em instantes
              </p>
            </div>
          ) : uploading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin">
                  <Upload className="w-6 h-6 text-[#d87093]" />
                </div>
                <span className="text-white text-lg">Enviando...</span>
              </div>
              
              <div className="w-full bg-[#252525] rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-[#d87093] to-[#c45c7c] h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-[#d87093] font-medium">
                  {uploadProgress}% completo
                </p>
                {isVideo && uploadProgress < 30 && (
                  <p className="text-gray-400 text-sm">
                    🎬 Gerando thumbnail...
                  </p>
                )}
                {uploadProgress >= 30 && uploadProgress < 90 && (
                  <p className="text-gray-400 text-sm">
                    📤 Enviando arquivo...
                  </p>
                )}
                {uploadProgress >= 90 && (
                  <p className="text-gray-400 text-sm">
                    💾 Salvando informações...
                  </p>
                )}
              </div>
            </div>
          ) : (
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#d87093] to-[#c45c7c] hover:from-[#c45c7c] hover:to-[#b54a6b] text-white font-medium py-4 text-lg transition-all duration-200 transform hover:scale-105"
              disabled={
                !mediaFile || 
                !title.trim() || 
                selectedCategories.length === 0 || 
                (isVideo && Boolean(selectedThumbnail) === false)
              }
            >
              <Upload className="w-6 h-6 mr-3" />
              {isVideo ? "🎬 Enviar Vídeo" : "📸 Enviar Foto"}
            </Button>
          )}

          {/* Validation Messages */}
          {mediaFile && (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${mediaFile ? 'bg-green-400' : 'bg-gray-500'}`} />
                <span className={mediaFile ? 'text-green-400' : 'text-gray-500'}>
                  Arquivo selecionado
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${title.trim() ? 'bg-green-400' : 'bg-gray-500'}`} />
                <span className={title.trim() ? 'text-green-400' : 'text-gray-500'}>
                  Título preenchido
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${selectedCategories.length > 0 ? 'bg-green-400' : 'bg-gray-500'}`} />
                <span className={selectedCategories.length > 0 ? 'text-green-400' : 'text-gray-500'}>
                  Categoria selecionada
                </span>
              </div>
              {isVideo && (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selectedThumbnail ? 'bg-green-400' : 'bg-gray-500'}`} />
                  <span className={selectedThumbnail ? 'text-green-400' : 'text-gray-500'}>
                    Thumbnail selecionada
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}