// Upload direto para Supabase sem TUS para compatibilidade
// import * as tus from 'tus-js-client'

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

  try {
    console.log(`📱 Upload direto: ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)`)
    
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`
    const arrayBuffer = await file.arrayBuffer()
    
    // Simular progresso
    if (onProgress) onProgress(50)
    
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

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
    
    if (onProgress) onProgress(100)
    if (onSuccess) onSuccess(publicUrl)
    
    return publicUrl
  } catch (error) {
    console.error('Upload error:', error)
    if (onError) onError(error as Error)
    throw error
  }
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