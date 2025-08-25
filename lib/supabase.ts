import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase usando as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vkhrmorqajgnzchenrpq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraHJtb3JxYWpnbnpjaGVucnBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzA3NTcsImV4cCI6MjA3MTcwNjc1N30.fVVmziGoJ87CPeET59fVoar2zL0OvqgC2zIx3VLdjmY'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraHJtb3JxYWpnbnpjaGVucnBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjEzMDc1NywiZXhwIjoyMDcxNzA2NzU3fQ.hLhqBcrIaOAVs-cNAO1cDM3nN79l8mwAPyVyP-_ljQs'

// Cliente público para uso no frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Cliente com privilégios de serviço para uso no backend
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

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
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}

export const deleteFile = async (bucket: string, paths: string[]) => {
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