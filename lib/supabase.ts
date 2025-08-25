import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase usando as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Verificar se as variáveis existem
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing!')
}

// Cliente público para uso no frontend
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null as any

// Cliente com privilégios de serviço para uso no backend
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null as any

// Configuração dos buckets
export const STORAGE_BUCKETS = {
  VIDEOS: 'videos',
  IMAGES: 'images',
  THUMBNAILS: 'thumbnails'
}

// Helper functions para trabalhar com o Storage
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { upsert?: boolean; contentType?: string }
) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized')
  }
  
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert ?? true,
      contentType: options?.contentType,
    })

  if (error) {
    console.error('Error uploading file:', error)
    throw error
  }

  return data
}

export const getPublicUrl = (bucket: string, path: string) => {
  if (!supabase) {
    return ''
  }
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}

export const deleteFile = async (bucket: string, paths: string[]) => {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized')
  }
  
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .remove(paths)

  if (error) {
    console.error('Error deleting file:', error)
    throw error
  }

  return data
}

// Função para criar os buckets se não existirem
export const initializeStorageBuckets = async () => {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized')
    return
  }
  
  const buckets = [STORAGE_BUCKETS.VIDEOS, STORAGE_BUCKETS.IMAGES, STORAGE_BUCKETS.THUMBNAILS]
  
  for (const bucketName of buckets) {
    try {
      // Verifica se o bucket existe
      const { data: existingBucket } = await supabaseAdmin.storage.getBucket(bucketName)
      
      if (!existingBucket) {
        // Cria o bucket se não existir
        const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: true, // Buckets públicos para acesso direto às URLs
          fileSizeLimit: bucketName === STORAGE_BUCKETS.VIDEOS ? 524288000 : 10485760, // 500MB para vídeos, 10MB para imagens
        })
        
        if (error && !error.message.includes('already exists')) {
          console.error(`Error creating bucket ${bucketName}:`, error)
        } else {
          console.log(`Bucket ${bucketName} created successfully`)
        }
      }
    } catch (error) {
      console.error(`Error checking/creating bucket ${bucketName}:`, error)
    }
  }
}