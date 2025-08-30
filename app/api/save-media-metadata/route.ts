'use server'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const { 
      title, 
      description, 
      category, 
      item_type, // 'video' or 'image'
      video_url, // for images, this will be the image_url
      thumbnail_url, 
      video_path, // for images, this will be the image_path
      thumbnail_path 
    } = await request.json()

    if (!title || !category || !item_type || !video_url || !thumbnail_url || !video_path || !thumbnail_path) {
      return NextResponse.json({ message: 'Dados incompletos. Todos os campos são necessários.' }, { status: 400 })
    }

    console.log(`✅ API RECEBEU (${item_type}):`, { title, description, category });

    // No Supabase, vamos continuar usando as colunas existentes.
    // A coluna `item_type` vai diferenciar o conteúdo.
    // A coluna `video_url` armazenará a URL tanto do vídeo quanto da imagem principal.
    const { data, error } = await supabase
      .from('portfolio_items')
      .insert([
        {
          title,
          description,
          category,
          item_type, // Salva 'video' ou 'image'
          video_url,
          thumbnail_url,
          video_path,
          thumbnail_path,
          status: 'active', 
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao salvar dados no Supabase:', error)
      throw new Error(`Erro do Supabase: ${error.message}`)
    }

    console.log('🎉 Metadados salvos com sucesso no banco de dados:', data);

    return NextResponse.json(data, { status: 201 })

  } catch (error: any) {
    console.error('❌ Erro geral na API /api/save-media-metadata:', error)
    return NextResponse.json({ message: error.message || 'Ocorreu um erro interno no servidor.' }, { status: 500 })
  }
}
