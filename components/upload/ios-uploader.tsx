"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  Video, 
  Image, 
  Smartphone, 
  Check, 
  X,
  FileVideo,
  FileImage
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from 'uuid'
import { uploadToSupabase, uploadSmallFile } from "@/lib/supabase-tus-upload"
import { VideoThumbnailSelector } from "./video-thumbnail-selector"

interface UploadedFile {
  file: File
  type: 'video' | 'photo'
  id: string
  preview: string
  thumbnail?: Blob
}

export function IOSUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentUpload, setCurrentUpload] = useState<string>("")
  
  // Form data
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")

  const categories = [
    "Wellness", "ADS", "Experiência", "Beauty", 
    "Pet", "Decor", "Receitas", "Moda", "Viagem"
  ]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    const newFiles: UploadedFile[] = selectedFiles.map(file => {
      const isVideo = file.type.startsWith('video/') || 
                     file.name.toLowerCase().match(/\.(mov|mp4|avi|hevc)$/i)
      
      return {
        file,
        type: isVideo ? 'video' : 'photo',
        id: uuidv4(),
        preview: URL.createObjectURL(file)
      }
    })

    setFiles(prev => [...prev, ...newFiles])
    
    // Auto-preencher título se vazio
    if (!title && newFiles[0]) {
      setTitle(newFiles[0].file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const handleThumbnailSelected = (fileId: string, thumbnailBlob: Blob) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, thumbnail: thumbnailBlob } : f
    ))
  }

  const uploadFiles = async () => {
    if (!title || !category) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e categoria",
        variant: "destructive"
      })
      return
    }

    // Verificar se vídeos têm thumbnails
    const videosWithoutThumbs = files.filter(f => f.type === 'video' && !f.thumbnail)
    if (videosWithoutThumbs.length > 0) {
      toast({
        title: "Thumbnail necessária",
        description: "Todos os vídeos precisam de thumbnail",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const totalFiles = files.length + files.filter(f => f.thumbnail).length
      let completedUploads = 0

      for (const fileData of files) {
        const { file, type, id, thumbnail } = fileData
        
        setCurrentUpload(`Enviando ${file.name}...`)
        
        // Gerar caminho único
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'unknown'
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `${year}/${month}/${fileName}`
        
        // Escolher bucket
        const bucket = type === 'video' ? 'videos' : 'images'
        
        let fileUrl: string

        try {
          // Upload do arquivo principal
          if (file.size > 6 * 1024 * 1024) { // > 6MB
            console.log(`📱 Arquivo grande (${(file.size/1024/1024).toFixed(2)}MB), usando TUS`)
            fileUrl = await uploadToSupabase({
              file,
              bucket,
              path: filePath,
              onProgress: (progress) => {
                const fileProgress = (completedUploads / totalFiles) * 100 + (progress / totalFiles)
                setUploadProgress(Math.round(fileProgress))
              }
            }) as string
          } else {
            console.log(`📱 Arquivo pequeno (${(file.size/1024/1024).toFixed(2)}MB), upload direto`)
            fileUrl = await uploadSmallFile({
              file,
              bucket,
              path: filePath
            })
          }
          
          completedUploads++
          setUploadProgress(Math.round((completedUploads / totalFiles) * 100))
          
          console.log(`✅ ${file.name} enviado:`, fileUrl)

        } catch (uploadError) {
          console.error(`❌ Erro enviando ${file.name}:`, uploadError)
          throw new Error(`Erro no upload de ${file.name}: ${uploadError}`)
        }

        // Upload da thumbnail se existir
        let thumbnailUrl = fileUrl
        if (thumbnail) {
          setCurrentUpload(`Enviando thumbnail de ${file.name}...`)
          
          const thumbFileName = `thumb_${fileName.replace(/\.[^/.]+$/, '.jpg')}`
          const thumbPath = `${year}/${month}/${thumbFileName}`
          
          try {
            thumbnailUrl = await uploadSmallFile({
              file: thumbnail,
              bucket: 'thumbnails',
              path: thumbPath
            })
            
            completedUploads++
            setUploadProgress(Math.round((completedUploads / totalFiles) * 100))
            
            console.log(`✅ Thumbnail de ${file.name} enviada:`, thumbnailUrl)
          } catch (thumbError) {
            console.warn(`⚠️ Erro na thumbnail de ${file.name}:`, thumbError)
            // Continua mesmo sem thumbnail
          }
        }

        // Salvar metadados no banco
        try {
          const response = await fetch('/api/save-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              description,
              category,
              fileUrl,
              thumbnailUrl,
              fileType: type,
              fileName: file.name,
              fileSize: file.size,
              supabasePath: filePath
            })
          })

          if (!response.ok) {
            console.warn('Erro salvando metadados (arquivo foi enviado)')
          }
        } catch (metaError) {
          console.warn('Erro salvando metadados:', metaError)
        }
      }

      setUploadProgress(100)
      setCurrentUpload("Upload concluído!")

      toast({
        title: "🎉 Upload concluído!",
        description: `${files.length} arquivo(s) enviado(s) com sucesso`,
      })

      // Reset form
      setTimeout(() => {
        setFiles([])
        setTitle("")
        setDescription("")
        setCategory("")
        setUploading(false)
        setUploadProgress(0)
        setCurrentUpload("")
      }, 2000)

    } catch (error) {
      console.error('❌ Erro no upload:', error)
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
      setUploading(false)
      setUploadProgress(0)
      setCurrentUpload("")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#1e1e1e] rounded-lg p-6 border border-[#333333]">
        <div className="flex items-center gap-3 mb-2">
          <Smartphone className="w-6 h-6 text-[#d87093]" />
          <h1 className="text-2xl font-bold text-white">Upload para iOS</h1>
        </div>
        <p className="text-gray-400">
          Sistema otimizado para vídeos MOV/HEVC grandes do iPhone (até 50GB)
        </p>
      </div>

      {/* File Selection */}
      {!uploading && (
        <div className="bg-[#1e1e1e] rounded-lg p-6 border border-[#333333]">
          <h2 className="text-lg font-medium text-white mb-4">Selecionar Arquivos</h2>
          
          <input
            type="file"
            id="file-upload"
            multiple
            accept="video/*,image/*,.mov,.heic,.heif"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#d87093] rounded-lg cursor-pointer hover:bg-[#252525] transition-colors"
          >
            <Upload className="w-8 h-8 text-[#d87093] mb-2" />
            <span className="text-white font-medium">Clique para selecionar arquivos</span>
            <span className="text-gray-400 text-sm">MOV, MP4, HEIC, JPG, PNG</span>
          </label>
        </div>
      )}

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="bg-[#1e1e1e] rounded-lg p-6 border border-[#333333]">
          <h2 className="text-lg font-medium text-white mb-4">
            Arquivos Selecionados ({files.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((fileData) => (
              <div key={fileData.id} className="bg-[#252525] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {fileData.type === 'video' ? (
                      <FileVideo className="w-8 h-8 text-blue-400" />
                    ) : (
                      <FileImage className="w-8 h-8 text-green-400" />
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <p className="text-white font-medium truncate">{fileData.file.name}</p>
                    <p className="text-gray-400 text-sm">
                      {(fileData.file.size / 1024 / 1024).toFixed(2)} MB • {fileData.type}
                    </p>
                    {fileData.thumbnail && (
                      <p className="text-[#d87093] text-sm">✅ Thumbnail selecionada</p>
                    )}
                  </div>
                  
                  {!uploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileData.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Thumbnail Selectors */}
      {files.filter(f => f.type === 'video').map((videoFile) => (
        <VideoThumbnailSelector
          key={videoFile.id}
          videoFile={videoFile.file}
          onThumbnailSelected={(blob) => handleThumbnailSelected(videoFile.id, blob)}
        />
      ))}

      {/* Form Fields */}
      {files.length > 0 && (
        <div className="bg-[#1e1e1e] rounded-lg p-6 border border-[#333333]">
          <h2 className="text-lg font-medium text-white mb-4">Informações</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Título *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título"
                className="bg-[#252525] border-[#333333] text-white"
                disabled={uploading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-[#252525] border border-[#333333] rounded-md text-white"
                disabled={uploading}
              >
                <option value="">Selecionar categoria</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Descrição
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição opcional"
                className="bg-[#252525] border-[#333333] text-white"
                disabled={uploading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload Button & Progress */}
      {files.length > 0 && (
        <div className="bg-[#1e1e1e] rounded-lg p-6 border border-[#333333]">
          {!uploading ? (
            <Button
              onClick={uploadFiles}
              className="w-full bg-[#d87093] hover:bg-[#c45c7c] text-white font-medium py-3"
              disabled={!title || !category || files.filter(f => f.type === 'video' && !f.thumbnail).length > 0}
            >
              <Upload className="w-5 h-5 mr-2" />
              Enviar {files.length} arquivo(s)
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin">
                  <Upload className="w-5 h-5 text-[#d87093]" />
                </div>
                <span className="text-white">{currentUpload}</span>
              </div>
              
              <Progress value={uploadProgress} className="w-full" />
              
              <p className="text-center text-gray-400">
                {uploadProgress}% completo
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}