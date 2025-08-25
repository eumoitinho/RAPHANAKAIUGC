"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, Smartphone, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB por chunk

export function IPhoneUploader({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [isIPhone, setIsIPhone] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    // Detectar iPhone/iPad
    const userAgent = navigator.userAgent || navigator.vendor
    const isApple = /iPhone|iPad|iPod/i.test(userAgent)
    setIsIPhone(isApple)
  }, [])

  const uploadInChunks = async (file: File) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const isVideo = file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mov')
    
    console.log(`📱 Iniciando upload em ${totalChunks} chunks de ${file.name}`)
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)
      
      const formData = new FormData()
      formData.append('chunk', chunk)
      formData.append('chunkIndex', i.toString())
      formData.append('totalChunks', totalChunks.toString())
      formData.append('fileName', file.name)
      formData.append('uploadId', uploadId)
      formData.append('fileType', isVideo ? 'video' : 'photo')
      
      try {
        const response = await fetch('/api/upload-chunk', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          throw new Error(`Falha no chunk ${i + 1}`)
        }
        
        const result = await response.json()
        
        // Atualizar progresso
        const currentProgress = ((i + 1) / totalChunks) * 100
        setProgress(currentProgress)
        
        if (result.complete) {
          console.log('✅ Upload completo:', result.fileUrl)
          
          // Agora salvar os metadados
          const metadataFormData = new FormData()
          metadataFormData.append('fileUrl', result.fileUrl)
          metadataFormData.append('fileName', file.name)
          metadataFormData.append('fileType', isVideo ? 'video' : 'photo')
          metadataFormData.append('title', file.name.replace(/\.[^/.]+$/, ''))
          metadataFormData.append('path', result.path)
          
          const metaResponse = await fetch('/api/upload-metadata', {
            method: 'POST',
            body: metadataFormData
          })
          
          if (metaResponse.ok) {
            toast({
              title: "Upload concluído!",
              description: `${file.name} foi enviado com sucesso.`,
            })
            
            if (onUploadComplete) {
              onUploadComplete()
            }
          }
        }
        
      } catch (error) {
        console.error(`❌ Erro no chunk ${i + 1}:`, error)
        toast({
          title: "Erro no upload",
          description: `Falha ao enviar chunk ${i + 1} de ${totalChunks}`,
          variant: "destructive"
        })
        throw error
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSelectedFile(file)
    setUploading(true)
    setProgress(0)
    
    try {
      await uploadInChunks(file)
      setSelectedFile(null)
    } catch (error) {
      console.error('Erro no upload:', error)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  // Sempre mostrar para permitir uso manual em desktop também

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-[#d87093]">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="w-5 h-5 text-[#d87093]" />
        <h3 className="text-lg font-medium">
          {isIPhone ? 'Upload Otimizado para iPhone' : 'Upload em Chunks (Anti-erro 413)'}
        </h3>
      </div>
      
      <p className="text-sm text-gray-400 mb-4">
        {isIPhone 
          ? 'Sistema especial de upload em chunks para contornar limitações do Safari mobile.'
          : 'Use este método se o upload normal estiver dando erro 413. Divide arquivos grandes automaticamente.'
        }
      </p>

      <input
        type="file"
        id="iphone-upload"
        accept="video/*,image/*,.mov,.heic,.heif"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />
      
      <label
        htmlFor="iphone-upload"
        className={`
          flex flex-col items-center justify-center
          w-full h-32 border-2 border-dashed rounded-lg
          ${uploading ? 'border-gray-600 bg-gray-900' : 'border-[#d87093] hover:bg-gray-900'}
          transition-colors cursor-pointer
        `}
      >
        {uploading ? (
          <div className="w-full px-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-spin">
                <Upload className="w-6 h-6 text-[#d87093]" />
              </div>
              <span className="text-sm">Enviando {selectedFile?.name}</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-gray-400 mt-1">{Math.round(progress)}% completo</p>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-[#d87093] mb-2" />
            <span className="text-sm">Toque para selecionar arquivo</span>
            <span className="text-xs text-gray-400">Suporta MOV, HEIC e todos formatos iPhone</span>
          </>
        )}
      </label>

      {/* Status */}
      <div className="mt-4 p-3 bg-green-900/20 rounded-lg flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-400" />
        <span className="text-xs text-green-400">
          Upload em chunks ativo • Limite: 1GB • Otimizado para iPhone
        </span>
      </div>
    </div>
  )
}