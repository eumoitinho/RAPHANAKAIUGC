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

// Add function to save media metadata
const saveMediaToLocalStorage = (mediaData: any) => {
  if (typeof window === "undefined") return

  const existingMedia = JSON.parse(localStorage.getItem("mediaItems") || "[]")
  const newMedia = {
    id: uuidv4(),
    ...mediaData,
    views: 0,
    dateCreated: new Date().toISOString(),
  }

  existingMedia.push(newMedia)
  localStorage.setItem("mediaItems", JSON.stringify(existingMedia))
  return newMedia
}

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

    if (!mediaFile || !thumbnailFile || !title || selectedCategories.length === 0) {
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
      // Upload thumbnail to Vercel Blob
      setUploadProgress(20)
      const thumbnailFormData = new FormData()
      thumbnailFormData.append("file", thumbnailFile)
      thumbnailFormData.append("filename", `thumbnail-${Date.now()}-${thumbnailFile.name}`)

      console.log("Uploading thumbnail...")
      const thumbnailResponse = await fetch("/api/upload", {
        method: "POST",
        body: thumbnailFormData,
      })

      if (!thumbnailResponse.ok) {
        const errorText = await thumbnailResponse.text()
        throw new Error(`Thumbnail upload failed (${thumbnailResponse.status}): ${errorText}`)
      }

      const thumbnailData = await thumbnailResponse.json()
      console.log("Thumbnail uploaded:", thumbnailData)
      setUploadProgress(50)

      // Upload media file to Vercel Blob
      const mediaFormData = new FormData()
      mediaFormData.append("file", mediaFile)
      mediaFormData.append("filename", `${mediaType}-${Date.now()}-${mediaFile.name}`)

      console.log("Uploading media file...")
      const mediaResponse = await fetch("/api/upload", {
        method: "POST",
        body: mediaFormData,
      })

      if (!mediaResponse.ok) {
        const errorText = await mediaResponse.text()
        throw new Error(`Media upload failed (${mediaResponse.status}): ${errorText}`)
      }

      const mediaData = await mediaResponse.json()
      console.log("Media uploaded:", mediaData)
      setUploadProgress(80)

      // Save media metadata to localStorage
      const newMedia = saveMediaToLocalStorage({
        title,
        description,
        fileUrl: mediaData.url,
        thumbnailUrl: thumbnailData.url,
        fileType: mediaType,
        categories: selectedCategories,
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
      setUploadProgress(0)
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

