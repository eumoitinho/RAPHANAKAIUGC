import { supabaseAdmin } from './supabase'

// Criar tabela de mídia se não existir
export async function createMediaTable() {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized')
    return
  }
  
  const { error } = await supabaseAdmin.rpc('create_media_table_if_not_exists', {
    table_sql: `
      CREATE TABLE IF NOT EXISTS media (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        thumbnail_url TEXT,
        file_type TEXT CHECK (file_type IN ('video', 'photo')) NOT NULL,
        categories TEXT[],
        date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        views INTEGER DEFAULT 0,
        file_name TEXT,
        file_size BIGINT,
        duration INTEGER,
        width INTEGER,
        height INTEGER,
        supabase_path TEXT,
        supabase_thumbnail_path TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_media_file_type ON media(file_type);
      CREATE INDEX IF NOT EXISTS idx_media_date_created ON media(date_created DESC);
    `
  }).catch(() => {
    // Se RPC não existir, tentar criar direto
    return supabaseAdmin.from('media').select('id').limit(1)
  })

  if (error) {
    console.log('Table might already exist or will be created manually:', error.message)
  }
}

// Tipo para a tabela media
export type MediaItem = {
  id?: string
  title: string
  description?: string
  file_url: string
  thumbnail_url?: string
  file_type: 'video' | 'photo'
  categories: string[]
  date_created?: string
  views: number
  file_name: string
  file_size: number
  duration?: number
  width?: number
  height?: number
  supabase_path?: string
  supabase_thumbnail_path?: string
  created_at?: string
  updated_at?: string
}

// Buscar toda mídia
export async function getAllMedia() {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized')
    return []
  }
  
  const { data, error } = await supabaseAdmin
    .from('media')
    .select('*')
    .order('date_created', { ascending: false })

  if (error) {
    console.error('Error fetching media:', error)
    return []
  }

  return data || []
}

// Buscar mídia por ID
export async function getMediaById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('media')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching media by id:', error)
    return null
  }

  return data
}

// Criar nova mídia
export async function createMedia(media: Omit<MediaItem, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabaseAdmin
    .from('media')
    .insert(media)
    .select()
    .single()

  if (error) {
    console.error('Error creating media:', error)
    throw error
  }

  return data
}

// Atualizar mídia
export async function updateMedia(id: string, updates: Partial<MediaItem>) {
  const { data, error } = await supabaseAdmin
    .from('media')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating media:', error)
    throw error
  }

  return data
}

// Deletar mídia
export async function deleteMedia(id: string) {
  const { error } = await supabaseAdmin
    .from('media')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting media:', error)
    throw error
  }

  return true
}

// Incrementar views
export async function incrementViews(id: string) {
  const { error } = await supabaseAdmin.rpc('increment_views', {
    media_id: id
  }).catch(() => {
    // Fallback se a função não existir
    return supabaseAdmin
      .from('media')
      .update({ views: supabaseAdmin.raw('views + 1') })
      .eq('id', id)
  })

  if (error) {
    console.error('Error incrementing views:', error)
  }

  return true
}

// Inicializar tabela
createMediaTable().catch(console.error)