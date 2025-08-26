'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { generateVideoThumbnail } from '@/lib/video-thumbnail'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export type MediaType = 'image' | 'video' | 'audio'

interface UploadResult {
  url: string
  type: MediaType
  fileName: string
  thumbnailUrl?: string
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']

// Increased to 500MB for iPhone videos
const MAX_FILE_SIZE = 500 * 1024 * 1024

export function useFastMediaUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const getMediaType = (mimeType: string): MediaType => {
    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image'
    if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video'
    if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'audio'
    throw new Error('Tipo de arquivo não suportado')
  }

  const validateFile = (file: File): void => {
    // Verificar tamanho
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Arquivo muito grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // Verificar tipo
    const allAllowedTypes = [
      ...ALLOWED_IMAGE_TYPES,
      ...ALLOWED_VIDEO_TYPES,
      ...ALLOWED_AUDIO_TYPES
    ]

    if (!allAllowedTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não suportado')
    }
  }

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    try {
      validateFile(file)
      
      setUploading(true)
      setUploadProgress(0)

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`

      const mediaType = getMediaType(file.type)
      let thumbnailUrl: string | undefined

      // Gerar thumbnail para vídeos no frontend
      if (mediaType === 'video') {
        try {
          console.log('🎬 Gerando thumbnail para vídeo...')
          setUploadProgress(10) // 10% para geração do thumbnail
          
          const thumbnailResult = await generateVideoThumbnail(file, {
            width: 320,
            height: 180,
            captureTime: 1,
            quality: 0.8
          })

          // Upload do thumbnail
          const thumbnailFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}_thumb.jpg`
          const thumbnailPath = `thumbnails/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${thumbnailFileName}`

          const { data: thumbnailData, error: thumbnailError } = await supabase.storage
            .from('media')
            .upload(thumbnailPath, thumbnailResult.blob, {
              cacheControl: '3600',
              upsert: false
            })

          if (thumbnailError) {
            console.warn('⚠️ Erro ao fazer upload do thumbnail:', thumbnailError)
          } else {
            const { data: { publicUrl: thumbnailPublicUrl } } = supabase.storage
              .from('media')
              .getPublicUrl(thumbnailData.path)
            
            thumbnailUrl = thumbnailPublicUrl
            console.log('✅ Thumbnail gerado:', thumbnailUrl)
          }

          setUploadProgress(30) // 30% após thumbnail
        } catch (thumbnailError) {
          console.warn('⚠️ Falha ao gerar thumbnail:', thumbnailError)
          // Continuar com upload do vídeo mesmo se thumbnail falhar
        }
      }

      // Upload do arquivo principal com progress
      console.log(`📤 Uploading file: ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)`)
      
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(data.path)

      setUploadProgress(100)

      console.log(`✅ Upload completed: ${publicUrl}`)

      return {
        url: publicUrl,
        type: mediaType,
        fileName: fileName,
        thumbnailUrl
      }
    } catch (error: any) {
      console.error('❌ Error uploading file:', error)
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