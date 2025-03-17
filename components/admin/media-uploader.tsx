"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Upload, X, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { v4 as uuidv4 } from "uuid"
import { toast } from "@/hooks/use-toast"
import { upload } from "@vercel/blob/client"
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg"

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
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [compressedFile, setCompressedFile] = useState<File | null>(null)
  const [compressionQuality, setCompressionQuality] = useState<"high" | "medium" | "low">("medium")
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
  const ffmpeg = useRef(
    createFFmpeg({
      log: true,
      progress: ({ ratio }) => {
        setCompressionProgress(Math.round(ratio * 100))
      },
    }),
  )

  const mediaInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const categories = ["Wellness", "ADS", "Experiência", "Beauty", "Pet", "Decor", "Receitas", "Moda"]

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        if (!ffmpeg.current.isLoaded()) {
          await ffmpeg.current.load()
          setFfmpegLoaded(true)
          console.log("FFmpeg loaded successfully")
        }
      } catch (error) {
        console.error("Error loading FFmpeg:", error)
        toast({
          title: "Aviso",
          description: "Não foi possível carregar o compressor de vídeo. O upload será feito sem compressão.",
          variant: "default",
        })
      }
    }

    loadFFmpeg()

    return () => {
      // Cleanup function
      if (ffmpeg.current.isLoaded()) {
        ffmpeg.current.exit()
      }
    }
  }, [])

  const compressVideo = async (file: File): Promise<File> => {
    if (!ffmpeg.current.isLoaded() || mediaType !== "video") {
      return file // Return original file if FFmpeg is not loaded or if it's not a video
    }

    setIsCompressing(true)
    setCompressionProgress(0)

    try {
      const inputName = "input.mp4"
      const outputName = "output.mp4"

      // Write the file to memory
      ffmpeg.current.FS("writeFile", inputName, await fetchFile(file))

      // Set compression parameters based on quality setting
      let crf = "23" // Default medium quality (lower is better quality, higher is smaller file)
      let preset = "medium" // Encoding speed (slower = better compression)

      switch (compressionQuality) {
        case "high":
          crf = "18" // Higher quality
          preset = "slow" // Slower encoding for better quality
          break
        case "medium":
          crf = "23" // Medium quality
          preset = "medium"
          break
        case "low":
          crf = "28" // Lower quality
          preset = "fast" // Faster encoding
          break
      }

      // Run the FFmpeg command
      await ffmpeg.current.run(
        "-i",
        inputName,
        "-c:v",
        "libx264", // Video codec
        "-crf",
        crf, // Constant Rate Factor (quality)
        "-preset",
        preset, // Encoding speed
        "-c:a",
        "aac", // Audio codec
        "-b:a",
        "128k", // Audio bitrate
        "-movflags",
        "+faststart", // Optimize for web streaming
        outputName,
      )

      // Read the result
      const data = ffmpeg.current.FS("readFile", outputName)

      // Create a new file from the result
      const compressedBlob = new Blob([data.buffer], { type: "video/mp4" })
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + "_compressed.mp4", {
        type: "video/mp4",
        lastModified: Date.now(),
      })

      console.log(`Original size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`)
      console.log(`Compressed size: ${(compressedFile.size / (1024 * 1024)).toFixed(2)} MB`)
      console.log(`Compression ratio: ${((compressedFile.size / file.size) * 100).toFixed(2)}%`)

      // Clean up
      ffmpeg.current.FS("unlink", inputName)
      ffmpeg.current.FS("unlink", outputName)

      setCompressedFile(compressedFile)
      return compressedFile
    } catch (error) {
      console.error("Error during video compression:", error)
      toast({
        title: "Erro na compressão",
        description: "Ocorreu um erro ao comprimir o vídeo. O arquivo original será usado.",
        variant: "destructive",
      })
      return file // Return original file if compression fails
    } finally {
      setIsCompressing(false)
    }
  }

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
      // Compress video if it's a video file
      let fileToUpload = mediaFile
      if (mediaType === "video" && ffmpegLoaded) {
        setUploadProgress(5)
        toast({
          title: "Comprimindo vídeo",
          description: "Aguarde enquanto o vídeo é comprimido...",
        })
        fileToUpload = await compressVideo(mediaFile)
        setUploadProgress(15)
      }

      // Generate a unique ID for this media item
      const mediaId = uuidv4()
      const timestamp = Date.now()

      // First upload the thumbnail
      setUploadProgress(20)
      const thumbnailFilename = `thumbnail-${timestamp}-${mediaId}-${thumbnailFile.name}`
      console.log("Uploading thumbnail...")

      const thumbnailBlob = await upload(thumbnailFilename, thumbnailFile, {
        access: "public",
        handleUploadUrl: "/api/upload-handler",
        clientPayload: JSON.stringify({
          mediaId,
          isThumb: true,
        }),
        onUploadProgress: ({ percentage }) => {
          // Scale progress from 20-50%
          setUploadProgress(20 + Math.round(percentage * 0.3))
        },
      })

      console.log("Thumbnail uploaded:", thumbnailBlob)
      setUploadProgress(50)

      // Then upload the media file with metadata including the thumbnail URL
      const mediaFilename = `${mediaType}-${timestamp}-${mediaId}-${fileToUpload.name}`
      console.log("Uploading media file...")

      // Prepare metadata
      const metadata = {
        title,
        description,
        fileType: mediaType,
        categories: selectedCategories,
      }

      const mediaBlob = await upload(mediaFilename, fileToUpload, {
        access: "public",
        handleUploadUrl: "/api/upload-handler",
        clientPayload: JSON.stringify({
          mediaId,
          thumbnailUrl: thumbnailBlob.url,
          metadata,
        }),
        onUploadProgress: ({ percentage }) => {
          // Scale progress from 50-90%
          setUploadProgress(50 + Math.round(percentage * 0.4))
        },
      })

      console.log("Media uploaded:", mediaBlob)
      setUploadProgress(90)

      // Now add the media item to our metadata storage
      try {
        const response = await fetch("/api/media/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            fileUrl: mediaBlob.url,
            thumbnailUrl: thumbnailBlob.url,
            fileType: mediaType,
            categories: selectedCategories,
            fileName: mediaFilename,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to save metadata")
        }

        console.log("Metadata saved successfully")
      } catch (error) {
        console.error("Error saving metadata:", error)
        toast({
          title: "Aviso",
          description: "Arquivo enviado, mas houve um erro ao salvar os metadados.",
          variant: "destructive",
        })
      }

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
          setCompressedFile(null)
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
            {/* Add this UI element for compression quality selection after the Media Type Selection section */}
            {/* Add this right after the Media Type Selection div */}
            {mediaType === "video" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Qualidade da Compressão</label>
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

        {/* Compression Progress */}
        {isCompressing && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span>Comprimindo vídeo...</span>
              <span>{compressionProgress}%</span>
            </div>
            <div className="w-full bg-[#252525] rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${compressionProgress}%` }}
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

