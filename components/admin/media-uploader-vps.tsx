"use client"

import type React from "react"
import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

export function MediaUploaderVPS() {
  const [mediaType, setMediaType] = useState<"video" | "photo">("video")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)

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

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Enhanced validation with size checks
    if (!mediaFile || !title || selectedCategories.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    // Check file size limits
    const maxVercelSize = 4.5 * 1024 * 1024 // 4.5MB
    const maxVpsSize = 100 * 1024 * 1024 // 100MB

    if (mediaFile.size > maxVpsSize) {
      toast({
        title: "Arquivo muito grande",
        description: `Arquivo de ${(mediaFile.size / 1024 / 1024).toFixed(2)}MB excede o limite de 100MB`,
        variant: "destructive",
      })
      return
    }

    if (mediaFile.size > maxVercelSize) {
      toast({
        title: "Arquivo grande detectado",
        description: `Arquivo de ${(mediaFile.size / 1024 / 1024).toFixed(2)}MB pode falhar via Vercel. Considere usar upload direto na VPS.`,
        variant: "destructive",
      })
      // Continue anyway, but warn user
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Criar FormData para envio
      const formData = new FormData()
      formData.append("file", mediaFile)
      formData.append("title", title)
      formData.append("description", description)
      formData.append("fileType", mediaType)
      formData.append("categories", JSON.stringify(selectedCategories))

      setUploadProgress(20)

      // Fazer upload para VPS
      const response = await fetch("/api/upload-media-vps", {
        method: "POST",
        body: formData,
      })

      setUploadProgress(80)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Falha no upload")
      }

      const result = await response.json()
      console.log("Upload VPS concluído:", result)

      setUploadProgress(100)

      toast({
        title: "Upload completo",
        description: `Arquivo enviado com sucesso para VPS!`,
      })

      setTimeout(() => {
        setIsUploading(false)
        setUploadSuccess(true)

        // Reset form after success
        setTimeout(() => {
          setTitle("")
          setDescription("")
          setSelectedCategories([])
          setMediaFile(null)
          setMediaPreview(null)
          setUploadSuccess(false)
          setUploadProgress(0)
        }, 2000)
      }, 1000)
    } catch (error) {
      console.error("Erro no upload VPS:", error)
      setIsUploading(false)
      setUploadProgress(0)

      let errorMessage = "Ocorreu um erro durante o upload"
      let suggestion = ""

      if (error instanceof Error) {
        try {
          // Try to parse error response
          const errorResponse = JSON.parse(error.message)
          errorMessage = errorResponse.error || error.message
          suggestion = errorResponse.suggestion || ""
        } catch {
          errorMessage = error.message
        }
      }

      toast({
        title: "Erro no upload",
        description: `${errorMessage}${suggestion ? ` - ${suggestion}` : ""}`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="bg-[#1e1e1e] rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">Upload de Mídia - VPS</h2>
      <p className="text-sm text-gray-400 mb-6">Upload direto para sua VPS com MongoDB</p>

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
                      {mediaType === "video" ? "MP4, WebM ou OGV (máx. 100MB)" : "PNG, JPG ou GIF (máx. 100MB)"}
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

            {/* File Info */}
            {mediaFile && (
              <div className="mb-6 p-4 bg-[#252525] rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Informações do Arquivo</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>
                    <strong>Nome:</strong> {mediaFile.name}
                  </p>
                  <p>
                    <strong>Tamanho:</strong> {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p>
                    <strong>Tipo:</strong> {mediaFile.type}
                  </p>
                  {mediaFile.size > 4.5 * 1024 * 1024 && (
                    <p className="text-yellow-400">
                      <strong>⚠️ Aviso:</strong> Arquivo grande pode falhar via Vercel
                    </p>
                  )}
                  {mediaFile.size > 100 * 1024 * 1024 && (
                    <p className="text-red-400">
                      <strong>❌ Erro:</strong> Arquivo excede limite de 100MB
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span>Enviando para VPS...</span>
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
            <span>Mídia enviada com sucesso para VPS!</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <Button
            type="submit"
            disabled={isUploading || uploadSuccess}
            className="bg-[#d87093] hover:bg-[#c45c7c] text-white px-8"
          >
            {isUploading ? "Enviando..." : "Enviar para VPS"}
          </Button>
        </div>
      </form>
    </div>
  )
}
