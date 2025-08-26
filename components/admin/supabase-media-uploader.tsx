"use client"

import { useState, useCallback } from "react"
import { Upload, X, FileVideo, FileImage, Loader2, CheckCircle, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { VideoThumbnailSelector } from "./video-thumbnail-selector"
import { generateVideoThumbnail } from "@/lib/video-thumbnail"

type FileWithPreview = {
  file: File
  preview: string
  type: 'video' | 'photo'
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  thumbnail?: Blob
}

const categories = ["ADS", "Wellness", "Receitas", "Moda", "Beauty", "Decor", "Experiência", "Pet", "Viagem"]

export function SupabaseMediaUploader({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [thumbnailSelectorOpen, setThumbnailSelectorOpen] = useState(false)
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null)

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
      // Verificar tipos de arquivo suportados (incluindo todos os formatos de iPhone)
      const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.3gp', '.quicktime']
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.heic', '.heif']
      
      const fileName = file.name.toLowerCase()
      const isVideo = file.type.startsWith("video/") || videoExtensions.some(ext => fileName.endsWith(ext))
      const isImage = file.type.startsWith("image/") || imageExtensions.some(ext => fileName.endsWith(ext))

      if (!isVideo && !isImage) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `${file.name} não é um vídeo ou imagem válido. Suporte: MP4, MOV, AVI, MKV, WebM, M4V para vídeos e JPG, PNG, WebP, GIF, HEIC para imagens`,
          variant: "destructive",
        })
        return
      }

      // SEM LIMITE DE TAMANHO - Upload direto pro Supabase

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

  const openThumbnailSelector = (index: number) => {
    console.log('openThumbnailSelector chamado com index:', index)
    console.log('Arquivo:', files[index])
    setSelectedVideoIndex(index)
    setThumbnailSelectorOpen(true)
  }

  const handleThumbnailSelect = (thumbnailBlob: Blob) => {
    if (selectedVideoIndex !== null) {
      setFiles(prev => {
        const newFiles = [...prev]
        newFiles[selectedVideoIndex] = {
          ...newFiles[selectedVideoIndex],
          thumbnail: thumbnailBlob
        }
        return newFiles
      })
    }
    setThumbnailSelectorOpen(false)
    setSelectedVideoIndex(null)
  }

  const uploadFile = async (fileWithPreview: FileWithPreview, index: number) => {
    const formData = new FormData()
    
    // Detectar se é upload do iPhone/Safari mobile
    const isIPhone = /iPhone|iPad|iPod|Safari/i.test(navigator.userAgent)
    const isMobile = /Mobile|Android/i.test(navigator.userAgent)
    
    formData.append('file', fileWithPreview.file)
    formData.append('title', title || fileWithPreview.file.name)
    formData.append('description', description)
    formData.append('categories', JSON.stringify(selectedCategories))
    
    // Adicionar flag para dispositivos Apple
    if (isIPhone) {
      formData.append('device', 'iphone')
    }
    
    // Se tiver thumbnail customizada, usar ela
    if (fileWithPreview.thumbnail) {
      formData.append('thumbnail', fileWithPreview.thumbnail)
    }

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

      // UPLOAD DIRETO PARA SUPABASE (BYPASSA VERCEL COMPLETAMENTE)
      const { createClient } = await import('@supabase/supabase-js')
      const { v4: uuidv4 } = await import('uuid')
      
      // Usar valores hardcoded se env não estiver disponível
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vkhrmorqajgnzchenrpq.supabase.co'
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraHJtb3JxYWpnbnpjaGVucnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzA3NTcsImV4cCI6MjA3MTcwNjc1N30.fVVmziGoJ87CPeET59fVoar2zL0OvqgC2zIx3VLdjmY'
      
      console.log('Conectando ao Supabase:', supabaseUrl)
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Gerar caminho único
      const date = new Date()
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const fileExt = fileWithPreview.file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${year}/${month}/${fileName}`
      
      // Upload do arquivo principal - DIRETO PRO SUPABASE SEM PASSAR PELA VERCEL
      const bucket = fileWithPreview.type === 'video' ? 'videos' : 'images'
      
      console.log(`Iniciando upload para bucket: ${bucket}, arquivo: ${fileName}, tamanho: ${fileWithPreview.file.size} bytes`)
      
      // Tentar upload com retry em caso de falha
      let uploadData
      let uploadError
      let retries = 3
      
      while (retries > 0) {
        const result = await supabase.storage
          .from(bucket)
          .upload(filePath, fileWithPreview.file, {
            cacheControl: '3600',
            upsert: false,
            duplex: 'half' // Adicionar para melhor compatibilidade
          })
        
        uploadData = result.data
        uploadError = result.error
        
        if (!uploadError) break
        
        console.warn(`Tentativa de upload falhou (${4 - retries}/3):`, uploadError)
        retries--
        
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)) // Esperar 2 segundos antes de tentar novamente
        }
      }
      
      clearInterval(progressInterval)
      
      if (uploadError) {
        console.error('Erro detalhado do upload:', uploadError)
        throw new Error(`Upload falhou após 3 tentativas: ${uploadError.message || uploadError}`)
      }
      
      console.log('Upload concluído com sucesso:', uploadData)
      
      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
      
      let thumbnailUrl = urlData.publicUrl
      let thumbnailPath = ''
      
      // Upload da thumbnail se houver
      if (fileWithPreview.thumbnail) {
        const thumbName = `thumb_${fileName.replace(/\.[^.]+$/, '.jpg')}`
        thumbnailPath = `${year}/${month}/${thumbName}`
        
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailPath, fileWithPreview.thumbnail)
        
        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(thumbnailPath)
          thumbnailUrl = thumbUrlData.publicUrl
        }
      }
      
      // Salvar metadados no banco
      const response = await fetch('/api/save-media-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || fileWithPreview.file.name,
          description: description,
          categories: selectedCategories,
          file_url: urlData.publicUrl,
          thumbnail_url: thumbnailUrl,
          file_type: fileWithPreview.type,
          file_name: fileWithPreview.file.name,
          file_size: fileWithPreview.file.size,
          supabase_path: filePath,
          supabase_thumbnail_path: thumbnailPath
        })
      })
      
      if (!response.ok) {
        console.warn('Aviso: Upload funcionou mas metadados não foram salvos')
      }
      
      const result = { success: true, url: urlData.publicUrl }

      // Atualizar status para success
      setFiles(prev => {
        const newFiles = [...prev]
        newFiles[index] = { ...newFiles[index], status: 'success', progress: 100 }
        return newFiles
      })

      return result
    } catch (error) {
      console.error('Erro completo no upload:', error)
      
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
      
      // Mostrar erro detalhado
      toast({
        title: "Erro no upload",
        description: `${fileWithPreview.file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
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

    // Verificar se todos os vídeos têm thumbnail selecionada
    const videosWithoutThumbnail = files.filter(file => 
      file.type === 'video' && !file.thumbnail
    )

    if (videosWithoutThumbnail.length > 0) {
      toast({
        title: "Thumbnail obrigatória para vídeos",
        description: `${videosWithoutThumbnail.length} vídeo(s) precisam de thumbnail. Clique no ícone da imagem para selecionar.`,
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
          accept="image/*,video/*,.mov,.avi,.mkv,.m4v,.heic,.heif,.3gp"
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
            Suporta qualquer mídia - SEM LIMITE de tamanho
          </span>
          <span className="text-xs text-gray-400 mt-1">
            Vídeos: MP4, MOV, AVI, MKV, WebM, M4V • Imagens: JPG, PNG, WebP, GIF, HEIC
          </span>
          <span className="text-xs text-green-400 font-medium">
            ✓ Suporte completo para arquivos de iPhone/iPad
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

                  {/* Botões de ação */}
                  {file.status === 'pending' && (
                    <>
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full z-10 transition-opacity hover:opacity-100"
                        style={{ opacity: 0.8 }}
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                      
                      {/* Botão para selecionar thumbnail de vídeo */}
                      {file.type === 'video' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Botão thumbnail clicado!', index)
                              openThumbnailSelector(index)
                            }}
                            className={`absolute top-2 left-2 p-2 rounded-full z-20 transition-all cursor-pointer ${
                              file.thumbnail 
                                ? 'bg-green-500 opacity-90 hover:opacity-100' 
                                : 'bg-[#d87093] opacity-100 animate-pulse shadow-lg'
                            }`}
                            title={file.thumbnail ? "Alterar Thumbnail" : "Selecionar Thumbnail (OBRIGATÓRIO)"}
                          >
                            <ImageIcon className="w-4 h-4 text-white" />
                          </button>
                          
                          {/* Aviso de thumbnail obrigatória */}
                          {!file.thumbnail && (
                            <div className="absolute top-12 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded animate-pulse z-10 shadow-lg">
                              Thumbnail OBRIGATÓRIA
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Indicador de thumbnail selecionada */}
                      {file.thumbnail && (
                        <div className="absolute bottom-12 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          ✓ Thumbnail selecionada
                        </div>
                      )}
                    </>
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
        disabled={isUploading || files.length === 0 || files.some(f => f.type === 'video' && !f.thumbnail)}
        className={`w-full text-white ${
          files.some(f => f.type === 'video' && !f.thumbnail)
            ? 'bg-gray-500 cursor-not-allowed'
            : 'bg-[#d87093] hover:bg-[#c45c7c]'
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando direto para Supabase (sem Vercel)...
          </>
        ) : files.some(f => f.type === 'video' && !f.thumbnail) ? (
          <>
            <ImageIcon className="mr-2 h-4 w-4" />
            Selecione thumbnail dos vídeos primeiro
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Enviar {files.length} arquivo(s) direto para Supabase
          </>
        )}
      </Button>

      {/* Seletor de Thumbnail para Vídeos */}
      {thumbnailSelectorOpen && selectedVideoIndex !== null && files[selectedVideoIndex] && (
        <VideoThumbnailSelector
          videoFile={files[selectedVideoIndex].file}
          onSelect={handleThumbnailSelect}
          isOpen={thumbnailSelectorOpen}
          onClose={() => {
            setThumbnailSelectorOpen(false)
            setSelectedVideoIndex(null)
          }}
        />
      )}
    </div>
  )
}