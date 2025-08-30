import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase'
import { createMedia, getAllMedia, deleteMedia as deleteMediaRecord } from '@/lib/supabase-db'
import { v4 as uuidv4 } from 'uuid'

// Configurações da API - APP ROUTER
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutos
export const dynamic = 'force-dynamic'

// UPLOAD ULTRA SIMPLES PARA iPhone
export async function POST(request: NextRequest) {
  try {
    console.log('🔥 API UPLOAD SIMPLES INICIADA')

    if (!supabaseAdmin) {
      console.log('❌ SUPABASE NÃO CONFIGURADO')
      return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log('❌ NENHUM ARQUIVO')
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    console.log(`📁 ARQUIVO RECEBIDO: ${file.name}`)
    console.log(`📏 TAMANHO: ${(file.size/1024/1024).toFixed(2)}MB`)
    console.log(`🎭 TIPO: ${file.type || 'VAZIO (iPhone)'}`)

    // Detectar tipo pela extensão se MIME type estiver vazio (problema iPhone)
    let fileType = 'video'
    let mimeType = file.type
    
    if (!mimeType || mimeType === '') {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      console.log(`🔍 EXTENSÃO DETECTADA: ${ext}`)
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(ext)) {
        fileType = 'photo'
        mimeType = ext === 'heic' ? 'image/heic' : ext === 'heif' ? 'image/heif' : 'image/jpeg'
      } else if (['mov', 'mp4', 'avi', 'hevc', 'webm'].includes(ext)) {
        fileType = 'video'
        mimeType = ext === 'mov' ? 'video/quicktime' : 'video/mp4'
      }
      
      console.log(`✅ TIPO INFERIDO: ${fileType} (${mimeType})`)
    } else {
      fileType = file.type.startsWith('image/') ? 'photo' : 'video'
    }

    // Nome e caminho simples
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'mov'
    const fileName = `iphone_${timestamp}.${ext}`
    const filePath = `debug/${fileName}`

    console.log(`📂 CAMINHO FINAL: media/${filePath}`)

    // Upload direto ao bucket 'media' (único)
    console.log('🚀 INICIANDO UPLOAD...')
    const startTime = Date.now()
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('media')
      .upload(filePath, file, {
        contentType: mimeType,
        upsert: false
      })

    const uploadTime = Date.now() - startTime
    console.log(`⏱️ UPLOAD LEVOU: ${uploadTime}ms`)

    if (uploadError) {
      console.error('❌ ERRO UPLOAD:', JSON.stringify(uploadError, null, 2))
      
      if (uploadError.message?.includes('not found')) {
        return NextResponse.json({
          error: 'Bucket "media" não encontrado',
          solution: 'Crie o bucket "media" no Supabase Dashboard',
          uploadError
        }, { status: 500 })
      }
      
      return NextResponse.json({
        error: 'Falha no upload',
        details: uploadError.message,
        uploadError
      }, { status: 500 })
    }

    console.log('✅ UPLOAD SUCESSO:', JSON.stringify(uploadData, null, 2))

    // URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('media')
      .getPublicUrl(filePath)

    const fileUrl = urlData.publicUrl
    console.log(`🔗 URL GERADA: ${fileUrl}`)

    return NextResponse.json({
      success: true,
      message: 'Upload iPhone concluído!',
      url: fileUrl,
      data: {
        fileName,
        filePath,
        fileType,
        fileSize: file.size,
        mimeType,
        uploadTime
      }
    })

  } catch (error: any) {
    console.error('❌ ERRO GERAL API:', error)
    return NextResponse.json({
      error: 'Erro interno da API',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

// Resto do código original removido para simplificar

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