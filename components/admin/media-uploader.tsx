"use client"

import type React from "react"
import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { v4 as uuidv4 } from "uuid"
import { toast } from "@/hooks/use-toast"
import { uploadFile } from "@/lib/firebase-storage"

export function MediaUploader() {
  const [mediaType, setMediaType] = useState<"video" | "photo">("video")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [compressionQuality, setCompressionQuality] = useState<"high" | "medium" | "low">("medium")

  const mediaInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const categories = ["Wellness", "ADS", "Experiência", "Beauty", "Pet", "Decor", "Receitas", "Moda"]

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

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setThumbnailFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setThumbnailPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

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

    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Generate a unique ID
      const mediaId = uuidv4()
      const timestamp = Date.now()

      // Upload to Firebase Storage
      console.log("Uploading media file...", {
        mediaType,
        mediaFile,
        fileName: mediaFile.name,
        fileType: mediaFile.type,
      })

      const folderPath = mediaType === "video" ? "videos" : "photos"
      setUploadProgress(20)

      // Ensure we're passing the correct file and folder path
      const mediaResult = await uploadFile(mediaFile, folderPath)
      console.log("Media upload result:", mediaResult)
      setUploadProgress(70)

      // Set thumbnail URL correctly
      let thumbnailUrl = mediaResult.url // Default to the file itself for photos
      let thumbnailPath = ""

      if (mediaType === "video" && thumbnailFile) {
        console.log("Uploading thumbnail...")
        const thumbnailResult = await uploadFile(thumbnailFile, "thumbnails")
        thumbnailUrl = thumbnailResult.url
        thumbnailPath = thumbnailResult.path
        console.log("Thumbnail uploaded:", thumbnailResult)
        setUploadProgress(90)
      }

      // Add media to Firestore
      console.log("Adding media item to Firestore...", {
        title,
        fileType: mediaType, // Garantir que o tipo seja explicitamente definido
        fileUrl: mediaResult.url,
        thumbnailUrl: mediaType === "photo" ? mediaResult.url : thumbnailUrl,
        fileName: mediaResult.path,
      })

      const response = await fetch("/api/media/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          fileUrl: mediaResult.url,
          thumbnailUrl: mediaType === "photo" ? mediaResult.url : thumbnailUrl,
          fileType: mediaType, // Garantir que o tipo seja explicitamente definido
          categories: selectedCategories,
          fileName: mediaResult.path,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save metadata (${response.status}): ${errorText}`)
      }

      const result = await response.json()
      console.log("Metadata saved successfully:", result.item)

      toast({
        title: "Upload completo",
        description: `Arquivo enviado com sucesso! ID: ${result.item.id}`,
      })

      setUploadProgress(100)
      setTimeout(() => {
        setIsUploading(false)
        setUploadSuccess(true)
        toast({
          title: "Upload concluído",
          description: "Seu arquivo foi enviado com sucesso!",
        })
        // Reset form after success
        setTimeout(() => {
          setTitle("")
          setDescription("")
          setSelectedCategories([])
          setMediaFile(null)
          setThumbnailFile(null)
          setMediaPreview(null)
          setThumbnailPreview(null)
          setUploadSuccess(false)
          setUploadProgress(0)
        }, 2000)
      }, 1000)
    } catch (error) {
      console.error("Upload error:", error)
      setIsUploading(false)
      toast({
        title: "Erro no upload",
        description: `Ocorreu um erro durante o upload: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="bg-[#1e1e1e] rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">Upload de Mídia</h2>

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
                >
                  Vídeo
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType("photo")}
                  className={`px-4 py-2 rounded-md ${
                    mediaType === "photo" ? "bg-[#d87093] text-white" : "bg-[#252525] text-gray-300 hover:bg-[#333333]"
                  }`}
                >
                  Foto
                </button>
              </div>
            </div>

            {/* Add this UI element for compression quality selection after the Media Type Selection section */}
            {mediaType === "video" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Qualidade do Vídeo</label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setCompressionQuality("high")}
                    className={`px-4 py-2 rounded-md ${
                      compressionQuality === "high"
                        ? "bg-green-600 text-white"
                        : "bg-[#252525] text-gray-300 hover:bg-[#333333]"
                    }`}
                  >
                    Alta
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompressionQuality("medium")}
                    className={`px-4 py-2 rounded-md ${
                      compressionQuality === "medium"
                        ? "bg-[#d87093] text-white"
                        : "bg-[#252525] text-gray-300 hover:bg-[#333333]"
                    }`}
                  >
                    Média
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompressionQuality("low")}
                    className={`px-4 py-2 rounded-md ${
                      compressionQuality === "low"
                        ? "bg-amber-600 text-white"
                        : "bg-[#252525] text-gray-300 hover:bg-[#333333]"
                    }`}
                  >
                    Baixa
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  {compressionQuality === "high"
                    ? "Alta qualidade, arquivo maior"
                    : compressionQuality === "medium"
                      ? "Equilíbrio entre qualidade e tamanho"
                      : "Arquivo menor, qualidade reduzida"}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  Nota: A compressão de vídeo no navegador foi desativada devido a limitações técnicas. Os vídeos serão
                  enviados em sua qualidade original.
                </p>
              </div>
            )}

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
                      <video src={mediaPreview} controls className="max-h-[200px] mx-auto" />
                    ) : (
                      <div className="relative h-[200px] w-full">
                        <Image src={mediaPreview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMediaFile(null)
                        setMediaPreview(null)
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="py-8 cursor-pointer" onClick={() => mediaInputRef.current?.click()}>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-400">Clique para fazer upload ou arraste e solte</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {mediaType === "video" ? "MP4, WebM ou OGG" : "PNG, JPG ou GIF"}
                    </p>
                  </div>
                )}
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept={mediaType === "video" ? "video/*" : "image/*"}
                  onChange={handleMediaChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Thumbnail Upload */}
            {mediaType === "video" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Thumbnail <span className="text-[#d87093]">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    thumbnailPreview ? "border-[#d87093]" : "border-gray-600 hover:border-gray-500"
                  }`}
                >
                  {thumbnailPreview ? (
                    <div className="relative">
                      <div className="relative h-[200px] w-full">
                        <Image
                          src={thumbnailPreview || "/placeholder.svg"}
                          alt="Thumbnail Preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailFile(null)
                          setThumbnailPreview(null)
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="py-8 cursor-pointer" onClick={() => thumbnailInputRef.current?.click()}>
                      <Plus className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-400">Adicionar thumbnail</p>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG ou GIF</p>
                    </div>
                  )}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span>Enviando...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-[#252525] rounded-full h-2">
              <div
                className="bg-[#d87093] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <div className="mt-6 bg-green-900/30 text-green-400 p-3 rounded-md flex items-center">
            <Check className="mr-2" size={20} />
            <span>Mídia enviada com sucesso!</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <Button
            type="submit"
            disabled={isUploading || uploadSuccess}
            className="bg-[#d87093] hover:bg-[#c45c7c] text-white px-8"
          >
            {isUploading ? "Enviando..." : "Enviar Mídia"}
          </Button>
        </div>
      </form>
    </div>
  )
}
