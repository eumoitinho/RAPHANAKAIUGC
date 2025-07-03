"use client"

import type React from "react"
import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import VideoThumbnailSelector from "./videothumbnailselector"

export function MediaUploaderVPS() {
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
      setSelectedThumbnail(null) // Reset thumbnail quando trocar arquivo
      setThumbnailPreview("")

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setMediaPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleThumbnailSelected = (thumbnailBlob: Blob) => {
    setSelectedThumbnail(thumbnailBlob)
    
    // Criar preview da thumbnail
    const thumbnailUrl = URL.createObjectURL(thumbnailBlob)
    setThumbnailPreview(thumbnailUrl)
    
    toast({
      title: "Thumbnail selecionada",
      description: "Thumbnail do vídeo definida com sucesso!",
    })
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!mediaFile || !title || selectedCategories.length === 0) {
    toast({
      title: "Erro de validação",
      description: "Por favor, preencha todos os campos obrigatórios",
      variant: "destructive",
    });
    return;
  }

  if (mediaType === "video" && !selectedThumbnail) {
    toast({
      title: "Thumbnail necessária",
      description: "Por favor, selecione uma thumbnail para o vídeo",
      variant: "destructive",
    });
    return;
  }

  const maxVpsSize = 500 * 1024 * 1024; // 500MB
  let totalSize = mediaFile.size;
  if (selectedThumbnail) {
    totalSize += selectedThumbnail.size;
  }
  totalSize += new Blob([title, description, JSON.stringify(selectedCategories)]).size;

  if (totalSize > maxVpsSize) {
    toast({
      title: "Payload muito grande",
      description: `O tamanho total dos dados (${(totalSize / 1024 / 1024).toFixed(2)}MB) excede o limite de 500MB`,
      variant: "destructive",
    });
    return;
  }

setIsUploading(true);
  setUploadProgress(10);

  try {
    const formData = new FormData();
    formData.append("file", mediaFile);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("fileType", mediaType);
    formData.append("categories", JSON.stringify(selectedCategories));
    if (mediaType === "video" && selectedThumbnail) {
      formData.append("thumbnail", selectedThumbnail, "thumbnail.jpg");
    }

    setUploadProgress(20);

    // ✅ ALTERAÇÃO: Enviar diretamente para a VPS
    const vpsApiUrl = process.env.NEXT_PUBLIC_UPLOADS_API_URL;
    if (!vpsApiUrl) {
      throw new Error("A URL de upload da VPS não está configurada.");
    }

    const response = await fetch(`${vpsApiUrl}/upload`, {
      method: "POST",
      body: formData,
    });

    setUploadProgress(80);

    if (!response.ok) {
      let errorMessage = `Falha no upload: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        const errorText = await response.text();
        errorMessage = errorText.substring(0, 100) || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("Upload VPS concluído:", result);

    setUploadProgress(100);

    toast({
      title: "Upload completo",
      description: `${mediaType === "video" ? "Vídeo" : "Foto"} enviado com sucesso para VPS!`,
    });

    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setSelectedCategories([]);
        setMediaFile(null);
        setMediaPreview(null);
        setSelectedThumbnail(null);
        setThumbnailPreview("");
        setUploadSuccess(false);
        setUploadProgress(0);
      }, 2000);
    }, 1000);
  } catch (error) {
    console.error("Erro no upload VPS:", error);
    setIsUploading(false);
    setUploadProgress(0);

    let errorMessage = "Ocorreu um erro durante o upload";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    toast({
      title: "Erro no upload",
      description: errorMessage,
      variant: "destructive",
    });
  }
};

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="bg-[#1e1e1e] rounded-lg p-6">
        <h2 className="text-xl font-bold mb-6">Upload de Mídia - VPS</h2>
        <p className="text-sm text-gray-400 mb-6">Upload direto para sua VPS com seleção de thumbnail</p>

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
                          setSelectedThumbnail(null)
                          setThumbnailPreview("")
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
                        {mediaType === "video" ? "MP4, WebM ou OGV (máx. 500MB)" : "PNG, JPG ou GIF (máx. 500MB)"}
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
                    <p><strong>Nome:</strong> {mediaFile.name}</p>
                    <p><strong>Tamanho:</strong> {(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p><strong>Tipo:</strong> {mediaFile.type}</p>
                    {selectedThumbnail && (
                      <p className="text-green-400"><strong>✅ Thumbnail:</strong> Selecionada</p>
                    )}
                  </div>
                  
                  {/* Preview da thumbnail selecionada */}
                  {thumbnailPreview && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-300 mb-1">Thumbnail selecionada:</p>
                      <div className="relative w-20 h-12 rounded overflow-hidden">
                        <Image 
                          src={thumbnailPreview} 
                          alt="Thumbnail" 
                          fill 
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
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
              disabled={isUploading || uploadSuccess || (mediaType === "video" && !selectedThumbnail)}
              className="bg-[#d87093] hover:bg-[#c45c7c] text-white px-8"
            >
              {isUploading ? "Enviando..." : "Enviar para VPS"}
            </Button>
          </div>
        </form>
      </div>

      {/* Video Thumbnail Selector */}
      {mediaType === "video" && mediaFile && (
        <VideoThumbnailSelector
          videoFile={mediaFile}
          onThumbnailSelected={handleThumbnailSelected}
        />
      )}
    </div>
  )
}