"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, Rocket, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from 'uuid'

export function RestApiSupabaseUploader({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>("")
  const [useServerApi, setUseServerApi] = useState(false)

  const uploadViaRestApi = async (file: File) => {
    try {
      setUploading(true)
      setProgress(10)
      setStatus("Preparando upload...")

      // Detectar tipo de arquivo
      const isVideo = file.type.startsWith('video/') || 
                      ['.mov', '.mp4', '.avi'].some(ext => file.name.toLowerCase().endsWith(ext))
      const isImage = file.type.startsWith('image/') || 
                      ['.jpg', '.jpeg', '.png', '.heic'].some(ext => file.name.toLowerCase().endsWith(ext))

      if (!isVideo && !isImage) {
        throw new Error('Tipo de arquivo não suportado')
      }

      // Gerar nome único
      const date = new Date()
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${year}/${month}/${fileName}`

      // Escolher bucket
      const bucket = isVideo ? 'videos' : 'images'
      
      setProgress(30)
      setStatus(`Enviando ${file.name} via REST API...`)

      let response: Response

      if (useServerApi) {
        // OPÇÃO 1: Usar API do servidor (com Service Role Key)
        console.log(`🔐 Usando API do servidor com Service Role Key`)
        setStatus("Enviando via servidor (mais privilégios)...")
        
        const formData = new FormData()
        formData.append('file', file)
        
        response = await fetch('/api/upload-rest-api', {
          method: 'POST',
          body: formData
        })
      } else {
        // OPÇÃO 2: Upload direto do browser (com Anon Key)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Configuração do Supabase incompleta')
        }

        // UPLOAD DIRETO VIA REST API (IGUAL VPS!)
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`
        console.log(`🚀 Upload REST API para: ${uploadUrl}`)

        // Converter File para ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()

        setProgress(50)
        setStatus("Enviando dados para Supabase Storage...")

        // Fazer upload via REST API direto
        response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': file.type || 'application/octet-stream',
            'x-upsert': 'true' // Permite sobrescrever se existir
          },
          body: arrayBuffer
        })
      }

      setProgress(75)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Erro na REST API:', response.status, errorData)
        
        // Se for erro 401, pode ser problema de autenticação
        if (response.status === 401) {
          throw new Error('Erro de autenticação. Verifique as políticas RLS do bucket.')
        }
        
        throw new Error(`Upload falhou: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      console.log('✅ Upload REST API concluído:', result)

      setProgress(90)
      setStatus("Gerando URL pública...")

      // Obter URL pública
      let publicUrl: string
      if (useServerApi && result.data?.fileUrl) {
        publicUrl = result.data.fileUrl
      } else {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`
      }
      console.log('📎 URL pública:', publicUrl)

      // Salvar metadados no banco
      setStatus("Salvando metadados...")
      const formData = new FormData()
      formData.append('fileUrl', publicUrl)
      formData.append('fileName', file.name)
      formData.append('fileType', isVideo ? 'video' : 'photo')
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''))
      formData.append('path', filePath)

      try {
        const metaResponse = await fetch('/api/upload-metadata', {
          method: 'POST',
          body: formData
        })

        if (!metaResponse.ok) {
          console.warn('Aviso: Metadados não salvos, mas upload funcionou')
        }
      } catch (metaError) {
        console.warn('Erro salvando metadados:', metaError)
      }

      setProgress(100)
      setStatus("Upload concluído!")

      toast({
        title: "🚀 Upload REST API bem-sucedido!",
        description: `${file.name} foi enviado diretamente via REST API.`,
      })

      if (onUploadComplete) {
        onUploadComplete()
      }

      setTimeout(() => {
        setProgress(0)
        setUploading(false)
        setStatus("")
      }, 2000)

    } catch (error) {
      console.error('❌ Erro no upload REST API:', error)
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      })
      setUploading(false)
      setProgress(0)
      setStatus("")
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Upload de múltiplos arquivos
    for (const file of Array.from(files)) {
      await uploadViaRestApi(file)
    }
  }

  return (
    <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg p-6 border border-purple-500">
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-medium text-purple-400">
          Upload REST API Direto (NOVO SISTEMA)
        </h3>
      </div>
      
      <p className="text-sm text-gray-300 mb-4">
        🚀 <strong>SISTEMA OTIMIZADO IGUAL VPS</strong><br/>
        Upload direto via REST API do Supabase Storage.<br/>
        Sem usar cliente JavaScript = Máxima performance!
      </p>

      {/* Toggle para escolher o modo */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="checkbox"
          id="use-server-api"
          checked={useServerApi}
          onChange={(e) => setUseServerApi(e.target.checked)}
          className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded"
        />
        <label htmlFor="use-server-api" className="text-sm text-gray-300">
          Usar API do servidor (Service Role Key - mais privilégios)
        </label>
      </div>

      <input
        type="file"
        id="rest-api-upload"
        accept="video/*,image/*,.mov,.heic,.heif,.mp4,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        disabled={uploading}
        multiple
        className="hidden"
      />
      
      <label
        htmlFor="rest-api-upload"
        className={`
          flex flex-col items-center justify-center
          w-full h-32 border-2 border-dashed rounded-lg
          ${uploading ? 'border-gray-600 bg-gray-900' : 'border-purple-500 hover:bg-gray-900 cursor-pointer'}
          transition-colors
        `}
      >
        {uploading ? (
          <div className="w-full px-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-spin">
                <Upload className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-sm">{status || 'Enviando via REST API...'}</span>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-xs text-gray-400 mt-1">{progress}% completo</p>
          </div>
        ) : (
          <>
            <Rocket className="w-8 h-8 text-purple-400 mb-2" />
            <span className="text-sm font-medium">Clique ou arraste arquivos aqui</span>
            <span className="text-xs text-gray-400">REST API • Máxima Performance • Igual VPS</span>
          </>
        )}
      </label>

      {/* Status */}
      <div className="mt-4 p-3 bg-purple-900/20 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-purple-400 mt-0.5" />
        <div className="text-xs text-purple-400">
          <p className="font-semibold mb-1">Vantagens do REST API:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Upload direto sem intermediários</li>
            <li>Funciona com arquivos grandes</li>
            <li>Sem problemas de CORS</li>
            <li>Mesma arquitetura da VPS</li>
          </ul>
        </div>
      </div>
    </div>
  )
}