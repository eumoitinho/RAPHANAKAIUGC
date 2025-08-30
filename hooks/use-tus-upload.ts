import { useState, useCallback } from 'react'
import * as tus from 'tus-js-client'
import { supabase } from '@/lib/supabase'

interface TUSUploadOptions {
  bucketName: string
  fileName: string
  file: File
  onProgress?: (progress: number) => void
  onError?: (error: Error) => void
  onSuccess?: (result: { url: string }) => void
}

interface TUSUploadResult {
  url: string
  path: string
}

export function useTUSUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (options: TUSUploadOptions): Promise<TUSUploadResult> => {
    const { bucketName, fileName, file, onProgress, onError, onSuccess } = options

    console.log('🔥 TUS RESUMABLE UPLOAD INICIADO')
    console.log('📁 ARQUIVO:', file.name, `${(file.size/1024/1024).toFixed(2)}MB`)
    
    // Pegar session do Supabase
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('❌ SESSÃO NECESSÁRIA PARA TUS')
      throw new Error('Sessão do Supabase necessária para TUS Upload')
    }

    const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]
    if (!projectId) {
      throw new Error('Project ID não encontrado')
    }

    console.log('🚀 USANDO TUS ENDPOINT:', `https://${projectId}.storage.supabase.co`)

    setUploading(true)
    setProgress(0)
    setError(null)

    return new Promise((resolve, reject) => {
      // Detectar tipo do arquivo
      let contentType = file.type
      if (!contentType) {
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (ext === 'mov') {
          contentType = 'video/quicktime'
        } else if (ext === 'mp4') {
          contentType = 'video/mp4'
        } else if (ext === 'hevc') {
          contentType = 'video/x-h265'
        } else {
          contentType = 'application/octet-stream'
        }
      }

      const upload = new tus.Upload(file, {
        // ENDPOINT OTIMIZADO para performance
        endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
        
        // RETRY automático
        retryDelays: [0, 3000, 5000, 10000, 20000, 30000],
        
        // HEADERS obrigatórios
        headers: {
          authorization: `Bearer ${session.access_token}`,
          'x-upsert': 'true', // Sobrescrever se existir
        },
        
        // CONFIGURAÇÕES obrigatórias
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true, // Permitir re-upload do mesmo arquivo
        
        // CHUNK SIZE obrigatório: 6MB
        chunkSize: 6 * 1024 * 1024, // 6MB - NÃO MUDAR
        
        // METADATA do arquivo
        metadata: {
          bucketName: bucketName,
          objectName: fileName,
          contentType: contentType,
          cacheControl: '3600'
        },

        // PROGRESSO em tempo real
        onProgress: (bytesUploaded: number, bytesTotal: number) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100)
          console.log(`📊 PROGRESSO TUS: ${percentage}% (${bytesUploaded}/${bytesTotal})`)
          setProgress(percentage)
          onProgress?.(percentage)
        },

        // SUCESSO
        onSuccess: () => {
          console.log('✅ TUS UPLOAD COMPLETO!')
          
          // Gerar URL pública
          const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName)

          const result = {
            url: data.publicUrl,
            path: fileName
          }

          console.log('🔗 URL GERADA:', result.url)
          setUploading(false)
          onSuccess?.(result)
          resolve(result)
        },

        // ERRO
        onError: (error: Error) => {
          console.error('❌ TUS ERRO:', error.message)
          console.error('❌ TUS STACK:', error.stack)
          setError(error.message)
          setUploading(false)
          onError?.(error)
          reject(error)
        },

        // CHUNK UPLOADADO
        onChunkComplete: (chunkSize: number, bytesAccepted: number, bytesTotal: number) => {
          console.log(`📦 CHUNK: ${chunkSize} bytes (${bytesAccepted}/${bytesTotal})`)
        }
      })

      console.log('🚀 INICIANDO TUS UPLOAD...')
      upload.start()
    })

  }, [])

  return {
    uploadFile,
    uploading,
    progress,
    error
  }
}