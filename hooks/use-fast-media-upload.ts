'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export type MediaType = 'image' | 'video' | 'audio'

interface UploadResult {
  url: string
  type: MediaType
  fileName: string
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']

// No size limit for iPhone videos
const MAX_FILE_SIZE = Infinity

export function useFastMediaUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const getMediaType = (mimeType: string): MediaType => {
    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image'
    if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video'
    if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'audio'
    throw new Error('Tipo de arquivo não suportado')
  }

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    try {      
      setUploading(true)
      setUploadProgress(0)

      console.log(`📤 UPLOAD DIRETO: ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)`)

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`

      // Alguns navegadores móveis (iOS) retornam file.type === '' — inferir a partir da extensão
      const inferMimeFromName = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase() || ''
        const map: Record<string, string> = {
          jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', heic: 'image/heic', heif: 'image/heif',
          mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', ogg: 'video/ogg', avi: 'video/x-msvideo'
        }
        return map[ext] || ''
      }

      const mimeType = file.type && file.type !== '' ? file.type : inferMimeFromName(file.name)
      if (!mimeType) throw new Error('Não foi possível determinar o tipo do arquivo')
      const mediaType = getMediaType(mimeType)
      
      // Upload direto sem processamento
      console.log('🔎 Iniciando upload para Supabase, filePath=', filePath)
        const { data, error } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        console.log('📥 Supabase upload response received', { data, error })

        if (error || !data) {
          console.warn('⚠️ Supabase client upload failed, attempting server-side fallback', { error })

          // Fallback: upload via server-side route using service role
          try {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('path', filePath)

            const fallbackResp = await fetch('/api/upload-supabase', {
              method: 'POST',
              body: fd
            })

            if (!fallbackResp.ok) {
              const text = await fallbackResp.text()
              console.error('❌ Fallback upload failed:', text)
              throw new Error('Fallback upload failed')
            }

            const fallbackJson = await fallbackResp.json()
            const publicUrl = fallbackJson.publicUrl
            setUploadProgress(100)
            console.log(`✅ UPLOAD SUCESSO (fallback): ${publicUrl}`)
            return {
              url: publicUrl,
              type: mediaType,
              fileName: fileName
            }
          } catch (fallbackError) {
            console.error('❌ Fallback upload error:', fallbackError)
            throw fallbackError
          }
        }

        // Obter URL pública
        const getUrlResp = supabase.storage
          .from('media')
          .getPublicUrl(data.path)
        const publicUrl = getUrlResp.data?.publicUrl || (getUrlResp as any).publicUrl || ''

        if (!publicUrl) {
          console.error('❌ Falha ao obter publicUrl:', getUrlResp)
          throw new Error('Falha ao obter URL pública do arquivo')
        }

        setUploadProgress(100)
        console.log(`✅ UPLOAD SUCESSO: ${publicUrl}`)

        return {
          url: publicUrl,
          type: mediaType,
          fileName: fileName
        }
    } catch (error: any) {
      console.error('❌ UPLOAD ERROR:', error)
      throw error
    } finally {
      // Garantir que o estado não fique preso em "uploading"
      setUploading(false)
      setUploadProgress(0)
    }
  }, [])

  const uploadMultiple = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    const results: UploadResult[] = []
    
    for (const file of files) {
      try {
        const result = await uploadFile(file)
        results.push(result)
      } catch (error) {
        // Continue com os próximos arquivos mesmo se um falhar
        console.error(`Failed to upload ${file.name}:`, error)
      }
    }

    return results
  }, [uploadFile])

  const deleteFile = useCallback(async (url: string): Promise<void> => {
    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = url.split('/storage/v1/object/public/media/')
      if (urlParts.length !== 2) {
        throw new Error('URL inválida')
      }

      const filePath = urlParts[1]

      const { error } = await supabase.storage
        .from('media')
        .remove([filePath])

      if (error) throw error
    } catch (error: any) {
      console.error('Error deleting file:', error)
      throw error
    }
  }, [])

  return {
    uploadFile,
    uploadMultiple,
    deleteFile,
    uploading,
    uploadProgress
  }
}