"use client"

import { useState, useCallback } from "react"
import { Upload, X, FileVideo, FileImage, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type FileWithPreview = {
  file: File
  preview: string
  type: 'video' | 'photo'
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const categories = ["ADS", "Wellness", "Receitas", "Moda", "Beauty", "Decor", "Experiência", "Pet", "Viagem"]

export function SupabaseMediaUploader({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFiles = (fileList: FileList) => {
    const newFiles: FileWithPreview[] = []

    Array.from(fileList).forEach((file) => {
      const isVideo = file.type.startsWith("video/")
      const isImage = file.type.startsWith("image/")

      if (!isVideo && !isImage) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `${file.name} não é um vídeo ou imagem válido`,
          variant: "destructive",
        })
        return
      }

      // Limite de tamanho: 500MB para vídeos, 10MB para imagens
      const maxSize = isVideo ? 500 * 1024 * 1024 : 10 * 1024 * 1024
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de ${isVideo ? '500MB' : '10MB'}`,
          variant: "destructive",
        })
        return
      }

      const preview = URL.createObjectURL(file)
      newFiles.push({
        file,
        preview,
        type: isVideo ? 'video' : 'photo',
        progress: 0,
        status: 'pending'
      })
    })

    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const uploadFile = async (fileWithPreview: FileWithPreview, index: number) => {
    const formData = new FormData()
    formData.append('file', fileWithPreview.file)
    formData.append('title', title || fileWithPreview.file.name)
    formData.append('description', description)
    formData.append('categories', JSON.stringify(selectedCategories))

    // Atualizar status para uploading
    setFiles(prev => {
      const newFiles = [...prev]
      newFiles[index] = { ...newFiles[index], status: 'uploading' }
      return newFiles
    })

    try {
      // Simular progresso do upload
      const progressInterval = setInterval(() => {
        setFiles(prev => {
          const newFiles = [...prev]
          if (newFiles[index] && newFiles[index].progress < 90) {
            newFiles[index] = { ...newFiles[index], progress: newFiles[index].progress + 10 }
          }
          return newFiles
        })
      }, 200)

      const response = await fetch('/api/upload-supabase', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()

      // Atualizar status para success
      setFiles(prev => {
        const newFiles = [...prev]
        newFiles[index] = { ...newFiles[index], status: 'success', progress: 100 }
        return newFiles
      })

      return result
    } catch (error) {
      // Atualizar status para error
      setFiles(prev => {
        const newFiles = [...prev]
        newFiles[index] = { 
          ...newFiles[index], 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed' 
        }
        return newFiles
      })
      throw error
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione pelo menos um arquivo para enviar",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Upload de todos os arquivos em paralelo
      const uploadPromises = files.map((file, index) => 
        file.status === 'pending' ? uploadFile(file, index) : Promise.resolve()
      )

      const results = await Promise.allSettled(uploadPromises)
      
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failCount = results.filter(r => r.status === 'rejected').length

      if (successCount > 0) {
        toast({
          title: "Upload concluído",
          description: `${successCount} arquivo(s) enviado(s) com sucesso${failCount > 0 ? `, ${failCount} falhou` : ''}`,
        })

        // Limpar arquivos com sucesso
        setFiles(prev => prev.filter(f => f.status !== 'success'))
        
        // Limpar formulário se todos foram enviados
        if (failCount === 0) {
          setTitle("")
          setDescription("")
          setSelectedCategories([])
        }

        onUploadComplete?.()
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Falha ao enviar arquivos",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Área de Upload */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-[#d87093] bg-[#d87093]/5" : "border-gray-700 hover:border-gray-600"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center space-y-2"
        >
          <Upload className="w-12 h-12 text-gray-400" />
          <span className="text-lg font-medium">
            Arraste arquivos aqui ou clique para selecionar
          </span>
          <span className="text-sm text-gray-500">
            Suporta imagens (até 10MB) e vídeos (até 500MB)
          </span>
        </label>
      </div>

      {/* Preview dos Arquivos */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Arquivos Selecionados ({files.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-[9/16] rounded-lg overflow-hidden bg-gray-900">
                  {file.type === 'video' ? (
                    <video
                      src={file.preview}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <img
                      src={file.preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Overlay com status */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    {file.status === 'uploading' && (
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-white mb-2 mx-auto" />
                        <Progress value={file.progress} className="w-20" />
                      </div>
                    )}
                    {file.status === 'success' && (
                      <CheckCircle className="w-12 h-12 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <div className="text-center px-2">
                        <X className="w-12 h-12 text-red-500 mb-2 mx-auto" />
                        <p className="text-xs text-red-300">{file.error}</p>
                      </div>
                    )}
                  </div>

                  {/* Botão de remover */}
                  {file.status === 'pending' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}

                  {/* Tipo de arquivo */}
                  <div className="absolute bottom-2 left-2">
                    {file.type === 'video' ? (
                      <FileVideo className="w-5 h-5 text-white" />
                    ) : (
                      <FileImage className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>
                <p className="text-xs mt-1 truncate">{file.file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadados */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do conteúdo"
            className="bg-[#252525] border-gray-700"
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição do conteúdo"
            className="bg-[#252525] border-gray-700 min-h-[100px]"
          />
        </div>

        <div>
          <Label>Categorias</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategories.includes(category) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Botão de Upload */}
      <Button
        onClick={handleUpload}
        disabled={isUploading || files.length === 0}
        className="w-full bg-[#d87093] hover:bg-[#c45c7c] text-white"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando para Supabase...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Enviar {files.length} arquivo(s) para Supabase
          </>
        )}
      </Button>
    </div>
  )
}