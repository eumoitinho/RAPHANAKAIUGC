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
      category, 
      video_url, 
      thumbnail_url, 
      video_path, 
      thumbnail_path 
    } = await request.json()

    if (!title || !category || !video_url || !thumbnail_url) {
      return NextResponse.json({ message: 'Dados incompletos.' }, { status: 400 })
    }

    console.log('🔥 SALVANDO METADADOS:', { title, category });

    const { data, error } = await supabase
      .from('portfolio_items')
      .insert([
        {
          title,
          category,
          video_url,
          thumbnail_url,
          video_path, // Para futuras operações de exclusão
          thumbnail_path, // Para futuras operações de exclusão
          status: 'active',
        },
      ])
      .select()
      .single() // Retorna o objeto inserido

    if (error) {
      console.error('❌ Erro ao salvar no Supabase:', error)
      throw new Error(error.message)
    }

    console.log('✅ Metadados salvos com sucesso:', data);

    return NextResponse.json(data, { status: 201 })

  } catch (error: any) {
    console.error('❌ Erro na API /api/save-media-metadata:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
