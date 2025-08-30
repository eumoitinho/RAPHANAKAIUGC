'use server'

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Use a chave de serviço para ter permissões de escrita no servidor
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const { 
      title, 
      description, // Campo de descrição adicionado
      category, 
      video_url, 
      thumbnail_url, 
      video_path, 
      thumbnail_path 
    } = await request.json()

    // Validação dos campos essenciais
    if (!title || !category || !video_url || !thumbnail_url || !video_path || !thumbnail_path) {
      return NextResponse.json({ message: 'Dados incompletos. Todos os campos são necessários.' }, { status: 400 })
    }

    console.log('✅ API RECEBEU: Salvando metadados para o vídeo:', { title, description, category });

    const { data, error } = await supabase
      .from('portfolio_items') // Certifique-se que o nome da tabela está correto
      .insert([
        {
          title,
          description, // Salvando a descrição
          category, // Salvando a categoria correta
          video_url,
          thumbnail_url,
          video_path, 
          thumbnail_path, 
          status: 'active', // ou 'pending' se precisar de aprovação
          item_type: 'video' // Adicionando um tipo para diferenciar de fotos no futuro
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
