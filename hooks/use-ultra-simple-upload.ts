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

export function useUltraSimpleUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    console.log('🔥🔥🔥 ULTRA SIMPLE UPLOAD INICIADO')
    console.log('📁 ARQUIVO:', file.name, `${(file.size/1024/1024).toFixed(2)}MB`)
    
    try {      
      setUploading(true)
      setUploadProgress(10)
      
      // Detectar tipo sem validação
      let mediaType: MediaType = 'video'
      if (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i)) {
        mediaType = 'image'
      }
      console.log('🎯 TIPO:', mediaType)

      // Nome único
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop() || 'mp4'
      const fileName = `${timestamp}.${fileExt}`
      const filePath = `uploads/${fileName}`
      
      console.log('📂 PATH:', filePath)
      setUploadProgress(30)
      
      console.log('🚀 FAZENDO UPLOAD...')
      
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('❌ ERRO SUPABASE:', error)
        throw new Error(`Upload falhou: ${error.message}`)
      }

      console.log('✅ UPLOAD OK:', data)
      setUploadProgress(80)

      // URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(data.path)

      console.log('🔗 URL:', publicUrl)
      setUploadProgress(100)

      const result = {
        url: publicUrl,
        type: mediaType,
        fileName: fileName
      }
      
      console.log('🎉 RESULTADO:', result)
      return result
      
    } catch (error: any) {
      console.error('❌ ERRO TOTAL:', error)
      throw error
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [])

  return {
    uploadFile,
    uploading,
    uploadProgress
  }
}