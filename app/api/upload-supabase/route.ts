import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase'
import { createMedia, getAllMedia, deleteMedia as deleteMediaRecord } from '@/lib/supabase-db'
import { v4 as uuidv4 } from 'uuid'

// Configurações da API
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutos
export const preferredRegion = 'auto'

// Configuração de tamanho máximo
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1gb',
    },
    responseLimit: false,
  },
}

// UPLOAD DE FOTOS E VÍDEOS
export async function POST(request: NextRequest) {
  try {
    console.log('📤 Upload iniciado...')
    
    // Verificar se Supabase está configurado
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase não configurado. Verifique as variáveis de ambiente.' },
        { status: 500 }
      )
    }

    // Pegar dados do formulário
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const categories = JSON.parse(formData.get('categories') as string || '[]')
    const customThumbnail = formData.get('thumbnail') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    console.log(`📁 Arquivo: ${file.name} (${file.type})`)

    // Determinar tipo: VÍDEO ou FOTO
    const isVideo = file.type.startsWith('video/')
    const fileType = isVideo ? 'video' : 'photo'
    const bucket = isVideo ? 'videos' : 'images'
    
    // Gerar nome único
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const year = new Date().getFullYear()
    const month = new Date().getMonth() + 1
    const filePath = `${year}/${month}/${fileName}`
    
    console.log(`📂 Salvando em: ${bucket}/${filePath}`)

    // UPLOAD DO ARQUIVO PRINCIPAL
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError)
      
      // Se o bucket não existir, dar instruções claras
      if (uploadError.message?.includes('not found')) {
        return NextResponse.json({
          error: `Bucket "${bucket}" não existe no Supabase Storage.`,
          solution: `Crie o bucket "${bucket}" no Supabase Dashboard > Storage > New Bucket`,
          details: {
            name: bucket,
            public: true,
            maxFileSize: isVideo ? '500MB' : '10MB'
          }
        }, { status: 500 })
      }
      
      throw uploadError
    }

    // Gerar URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    const fileUrl = urlData.publicUrl
    console.log(`✅ Upload concluído: ${fileUrl}`)

    // PROCESSAR THUMBNAIL
    let thumbnailUrl = fileUrl
    let thumbnailPath = ''
    
    if (customThumbnail) {
      // Se enviou thumbnail customizada, usar ela
      console.log('🖼️ Usando thumbnail customizada')
      
      const thumbName = `thumb_${fileName.replace(/\.[^.]+$/, '.jpg')}`
      thumbnailPath = `${year}/${month}/${thumbName}`
      
      const { data: thumbData, error: thumbError } = await supabaseAdmin.storage
        .from('thumbnails')
        .upload(thumbnailPath, customThumbnail, {
          contentType: customThumbnail.type || 'image/jpeg',
          upsert: true
        })

      if (!thumbError) {
        const { data: thumbUrlData } = supabaseAdmin.storage
          .from('thumbnails')
          .getPublicUrl(thumbnailPath)
        thumbnailUrl = thumbUrlData.publicUrl
      }
    } else if (!isVideo) {
      // Para fotos, gerar thumbnail automaticamente
      console.log('🖼️ Gerando thumbnail para foto')
      
      try {
        const sharp = await import('sharp')
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        const thumbnailBuffer = await sharp.default(buffer)
          .resize(400, 600, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer()
        
        const thumbName = `thumb_${fileName.replace(/\.[^.]+$/, '.jpg')}`
        thumbnailPath = `${year}/${month}/${thumbName}`
        
        const { data: thumbData, error: thumbError } = await supabaseAdmin.storage
          .from('thumbnails')
          .upload(thumbnailPath, thumbnailBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          })

        if (!thumbError) {
          const { data: thumbUrlData } = supabaseAdmin.storage
            .from('thumbnails')
            .getPublicUrl(thumbnailPath)
          thumbnailUrl = thumbUrlData.publicUrl
        }
      } catch (error) {
        console.error('Erro gerando thumbnail:', error)
      }
    }
    // Para vídeos sem thumbnail customizada, usar o próprio vídeo como preview

    // SALVAR NO BANCO DE DADOS
    const mediaItem = await createMedia({
      title: title || file.name,
      description: description || '',
      file_url: fileUrl,
      thumbnail_url: thumbnailUrl,
      file_type: fileType as 'video' | 'photo',
      categories: categories || [],
      views: 0,
      file_name: file.name,
      file_size: file.size,
      width: 0,
      height: 0,
      supabase_path: filePath,
      supabase_thumbnail_path: thumbnailPath,
    })
    
    console.log('✅ Salvo no banco de dados')

    return NextResponse.json({
      success: true,
      message: 'Upload concluído com sucesso!',
      data: {
        id: mediaItem.id,
        fileUrl,
        thumbnailUrl,
        fileType,
      }
    })
    
  } catch (error) {
    console.error('❌ ERRO GERAL:', error)
    return NextResponse.json(
      { 
        error: 'Erro no upload',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// LISTAR ARQUIVOS
export async function GET(request: NextRequest) {
  try {
    const media = await getAllMedia()
    
    return NextResponse.json({
      success: true,
      media,
      total: media.length
    })
  } catch (error) {
    console.error('Erro ao buscar mídia:', error)
    return NextResponse.json(
      { error: 'Falha ao buscar mídia' },
      { status: 500 }
    )
  }
}

// DELETAR ARQUIVO
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }
    
    await deleteMediaRecord(id)
    
    return NextResponse.json({
      success: true,
      message: 'Mídia deletada com sucesso'
    })
    
  } catch (error) {
    console.error('Erro ao deletar:', error)
    return NextResponse.json(
      { error: 'Falha ao deletar mídia' },
      { status: 500 }
    )
  }
}