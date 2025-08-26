// Upload usando protocolo TUS para arquivos grandes
import * as tus from 'tus-js-client'

interface UploadOptions {
  file: File
  bucket: string
  path: string
  onProgress?: (percentage: number) => void
  onSuccess?: (url: string) => void
  onError?: (error: Error) => void
}

export async function uploadToSupabase({
  file,
  bucket,
  path,
  onProgress,
  onSuccess,
  onError
}: UploadOptions) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }

  const projectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
  
  // URL do TUS endpoint do Supabase
  const uploadUrl = `https://${projectId}.supabase.co/storage/v1/upload/resumable`

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: uploadUrl,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 6 * 1024 * 1024, // 6MB chunks como recomendado
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      },
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        'x-upsert': 'true', // Sobrescreve se existir
      },
      onError: (error) => {
        console.error('TUS upload error:', error)
        if (onError) onError(error)
        reject(error)
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = Math.round((bytesUploaded / bytesTotal) * 100)
        console.log(`Upload progress: ${percentage}%`)
        if (onProgress) onProgress(percentage)
      },
      onSuccess: () => {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
        console.log('Upload complete:', publicUrl)
        if (onSuccess) onSuccess(publicUrl)
        resolve(publicUrl)
      },
    })

    // Verifica uploads anteriores e resume se possível
    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length) {
        console.log('Resuming previous upload')
        upload.resumeFromPreviousUpload(previousUploads[0])
      }
      upload.start()
    })
  })
}

// Upload simplificado sem TUS para arquivos pequenos (<6MB)
export async function uploadSmallFile({
  file,
  bucket,
  path
}: {
  file: File | Blob
  bucket: string
  path: string
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`
  
  const arrayBuffer = await file.arrayBuffer()
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: arrayBuffer
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Upload failed: ${error}`)
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}