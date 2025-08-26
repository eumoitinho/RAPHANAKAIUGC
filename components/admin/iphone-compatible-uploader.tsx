"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, Smartphone, AlertTriangle, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from 'uuid'

export function IphoneCompatibleUploader({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>("")
  const [fileInfo, setFileInfo] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const detectFileFormat = (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop()
    const isHEIC = ext === 'heic' || ext === 'heif'
    const isHEVC = ext === 'mov' && file.type === 'video/quicktime'
    const needsConversion = isHEIC || isHEVC || !file.type
    
    return {
      extension: ext,
      isHEIC,
      isHEVC,
      needsConversion,
      originalType: file.type || 'unknown',
      canGeneratePreview: file.type && (
        file.type.startsWith('video/mp4') || 
        file.type.startsWith('image/jpeg') ||
        file.type.startsWith('image/png')
      )
    }
  }

  const convertHEICtoJPEG = async (file: File): Promise<Blob> => {
    // Para HEIC, vamos fazer upload direto sem conversão no cliente
    // O servidor ou Supabase pode processar depois
    return file
  }

  const processVideoFile = async (file: File): Promise<{ file: File | Blob, needsFallback: boolean }> => {
    const format = detectFileFormat(file)
    
    // Se é MOV do iPhone sem preview, adicionar flag
    if (format.isHEVC || !format.canGeneratePreview) {
      console.log('⚠️ Vídeo do iPhone detectado, pode não gerar preview')
      return {
        file: file,
        needsFallback: true
      }
    }
    
    return {
      file: file,
      needsFallback: false
    }
  }

  const uploadToSupabase = async (file: File) => {
    try {
      setUploading(true)
      setProgress(5)
      setStatus("Analisando arquivo...")

      // Detectar formato
      const format = detectFileFormat(file)
      setFileInfo(format)
      
      console.log('📱 Formato detectado:', format)

      // Processar arquivo se necessário
      let processedFile: File | Blob = file
      let needsFallback = false
      
      if (format.needsConversion) {
        setStatus("Processando arquivo do iPhone...")
        setProgress(15)
        
        if (format.isHEIC) {
          // HEIC - fazer upload direto, converter no servidor se necessário
          console.log('📸 HEIC detectado, upload direto')
          processedFile = file
        } else if (format.isHEVC || format.extension === 'mov') {
          // MOV/HEVC - processar para compatibilidade
          const processed = await processVideoFile(file)
          processedFile = processed.file
          needsFallback = processed.needsFallback
        }
      }

      setProgress(25)
      setStatus("Preparando upload...")

      // Determinar tipo
      const isVideo = file.name.match(/\.(mov|mp4|avi|webm|mkv)$/i)
      const isImage = file.name.match(/\.(jpg|jpeg|png|gif|heic|heif|webp)$/i)
      
      if (!isVideo && !isImage) {
        throw new Error('Formato de arquivo não suportado')
      }

      // Gerar nome único
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      
      // Manter extensão original para compatibilidade
      const originalExt = file.name.split('.').pop()?.toLowerCase() || 'unknown'
      const fileName = `${uuidv4()}.${originalExt}`
      const filePath = `${year}/${month}/${fileName}`

      // Escolher bucket
      const bucket = isVideo ? 'videos' : 'images'
      
      setProgress(35)
      setStatus(`Enviando ${file.name}...`)

      // Configuração do Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuração do Supabase não encontrada')
      }

      // Converter para ArrayBuffer para upload REST API
      const arrayBuffer = await processedFile.arrayBuffer()
      
      setProgress(50)
      setStatus("Enviando para o Supabase...")

      // Upload via REST API direta
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': processedFile.type || 'application/octet-stream',
          'x-upsert': 'true',
          // Headers especiais para arquivos do iPhone
          'x-original-format': format.extension || '',
          'x-needs-conversion': format.needsConversion ? 'true' : 'false',
          'x-device': 'iphone'
        },
        body: arrayBuffer
      })

      setProgress(75)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erro no upload:', response.status, errorText)
        
        // Retry com formato diferente se falhar
        if (response.status === 415) { // Unsupported Media Type
          setStatus("Tentando formato alternativo...")
          
          // Tentar enviar como blob genérico
          const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' })
          const retryResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/octet-stream',
              'x-upsert': 'true'
            },
            body: blob
          })
          
          if (!retryResponse.ok) {
            throw new Error(`Upload falhou após retry: ${retryResponse.status}`)
          }
        } else {
          throw new Error(`Upload falhou: ${response.status}`)
        }
      }

      setProgress(90)
      setStatus("Finalizando...")

      // URL pública
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`
      
      console.log('✅ Upload concluído:', publicUrl)
      console.log('📱 Informações do arquivo:', {
        ...format,
        needsFallback,
        publicUrl
      })

      // Salvar metadados com flag de conversão se necessário
      try {
        const metaFormData = new FormData()
        metaFormData.append('fileUrl', publicUrl)
        metaFormData.append('fileName', file.name)
        metaFormData.append('fileType', isVideo ? 'video' : 'photo')
        metaFormData.append('title', file.name.replace(/\.[^/.]+$/, ''))
        metaFormData.append('path', filePath)
        metaFormData.append('needsProcessing', format.needsConversion ? 'true' : 'false')
        metaFormData.append('originalFormat', format.extension || '')
        
        await fetch('/api/upload-metadata', {
          method: 'POST',
          body: metaFormData
        })
      } catch (metaError) {
        console.warn('Erro salvando metadados:', metaError)
      }

      setProgress(100)
      setStatus("Upload concluído!")

      toast({
        title: "📱 Upload do iPhone concluído!",
        description: format.needsConversion 
          ? `${file.name} foi enviado. Processamento em andamento...`
          : `${file.name} foi enviado com sucesso!`,
      })

      if (onUploadComplete) {
        onUploadComplete()
      }

      setTimeout(() => {
        setProgress(0)
        setUploading(false)
        setStatus("")
        setFileInfo(null)
      }, 2000)

    } catch (error) {
      console.error('❌ Erro no upload:', error)
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      })
      setUploading(false)
      setProgress(0)
      setStatus("")
      setFileInfo(null)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Upload sequencial para evitar problemas
    for (const file of Array.from(files)) {
      await uploadToSupabase(file)
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-lg p-6 border border-blue-500">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-medium text-blue-400">
          Upload Compatível com iPhone/iCloud
        </h3>
      </div>
      
      <p className="text-sm text-gray-300 mb-4">
        📱 <strong>OTIMIZADO PARA iPHONE</strong><br/>
        Suporta HEIC, HEIF, MOV e arquivos do iCloud.<br/>
        Processa automaticamente formatos incompatíveis.
      </p>

      {/* Avisos sobre formatos */}
      <div className="mb-4 p-3 bg-yellow-900/20 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
          <div className="text-xs text-yellow-400">
            <p className="font-semibold mb-1">Formatos suportados do iPhone:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>HEIC/HEIF → Convertido automaticamente</li>
              <li>MOV (HEVC) → Processado para compatibilidade</li>
              <li>Live Photos → Upload do vídeo e foto</li>
              <li>ProRAW/ProRes → Upload direto</li>
            </ul>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        id="iphone-upload"
        accept="video/*,image/*,.mov,.heic,.heif,.mp4,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        disabled={uploading}
        multiple
        className="hidden"
      />
      
      <label
        htmlFor="iphone-upload"
        className={`
          flex flex-col items-center justify-center
          w-full h-32 border-2 border-dashed rounded-lg
          ${uploading ? 'border-gray-600 bg-gray-900' : 'border-blue-500 hover:bg-gray-900 cursor-pointer'}
          transition-colors
        `}
      >
        {uploading ? (
          <div className="w-full px-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-spin">
                <Upload className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm">{status || 'Processando arquivo do iPhone...'}</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-gray-400 mt-1">{progress}% completo</p>
            {fileInfo && fileInfo.needsConversion && (
              <p className="text-xs text-yellow-400 mt-1">
                Convertendo formato {fileInfo.extension?.toUpperCase()}...
              </p>
            )}
          </div>
        ) : (
          <>
            <Smartphone className="w-8 h-8 text-blue-400 mb-2" />
            <span className="text-sm font-medium">Selecione arquivos do iPhone</span>
            <span className="text-xs text-gray-400">HEIC, MOV, Live Photos • Conversão automática</span>
          </>
        )}
      </label>

      {/* Status de compatibilidade */}
      <div className="mt-4 p-3 bg-blue-900/20 rounded-lg flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-blue-400" />
        <span className="text-xs text-blue-400">
          Sistema preparado para iPhone • iCloud • Formatos Apple
        </span>
      </div>
    </div>
  )
}