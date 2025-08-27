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

      const mediaType = getMediaType(file.type)
      
      // Upload direto sem processamento
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('❌ SUPABASE ERROR:', error)
        throw new Error(`Upload falhou: ${error.message}`)
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(data.path)

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