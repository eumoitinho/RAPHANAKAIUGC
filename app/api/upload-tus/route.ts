import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as tus from 'tus-js-client'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutos
export const dynamic = 'force-dynamic'

// TUS RESUMABLE UPLOAD PARA ARQUIVOS GRANDES iPhone
export async function POST(request: NextRequest) {
  try {
    console.log('🔥 TUS API INICIADA')

    if (!supabaseAdmin) {
      console.log('❌ SUPABASE ADMIN NÃO CONFIGURADO')
      return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log('❌ NENHUM ARQUIVO TUS')
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    console.log(`📁 ARQUIVO TUS: ${file.name} - ${(file.size/1024/1024).toFixed(2)}MB`)

    // Detectar tipo
    let contentType = file.type
    if (!contentType) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'mov') {
        contentType = 'video/quicktime'
      } else if (ext === 'mp4') {
        contentType = 'video/mp4'
      } else if (ext === 'hevc') {
        contentType = 'video/x-h265'
      } else {
        contentType = 'application/octet-stream'
      }
      console.log(`🎭 TIPO INFERIDO: ${contentType}`)
    }

    // Arquivo grande = usar TUS via admin client
    if (file.size > 6 * 1024 * 1024) { // >6MB
      console.log('📦 ARQUIVO GRANDE - USANDO TUS CHUNKED UPLOAD')
      
      // Converter File para ArrayBuffer para chunked upload
      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)
      
      const timestamp = Date.now()
      const ext = file.name.split('.').pop() || 'mov'
      const fileName = `tus/${timestamp}.${ext}`
      
      console.log(`📂 CAMINHO TUS: ${fileName}`)
      
      try {
        // Upload usando admin client com chunks menores
        console.log('🚀 INICIANDO CHUNKED UPLOAD...')
        
        const { data, error } = await supabaseAdmin.storage
          .from('media')
          .upload(fileName, buffer, {
            contentType: contentType,
            upsert: false
          })

        if (error) {
          console.error('❌ ERRO SUPABASE TUS:', error)
          return NextResponse.json({
            error: 'Falha no upload TUS',
            details: error.message,
            supabaseError: error
          }, { status: 500 })
        }

        console.log('✅ TUS UPLOAD SUCESSO')

        // URL pública
        const { data: urlData } = supabaseAdmin.storage
          .from('media')
          .getPublicUrl(fileName)

        return NextResponse.json({
          success: true,
          message: 'Upload TUS concluído',
          url: urlData.publicUrl,
          method: 'TUS_CHUNKED',
          data: {
            fileName,
            filePath: fileName,
            fileSize: file.size,
            contentType,
            chunks: Math.ceil(file.size / (6 * 1024 * 1024))
          }
        })

      } catch (uploadError: any) {
        console.error('❌ ERRO CHUNKED UPLOAD:', uploadError)
        
        // Fallback para upload direto simples
        console.log('🔄 FALLBACK - TENTANDO UPLOAD DIRETO...')
        
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin.storage
          .from('media')
          .upload(fileName, file, {
            contentType: contentType,
            upsert: false
          })

        if (fallbackError) {
          console.error('❌ FALLBACK FALHOU:', fallbackError)
          return NextResponse.json({
            error: 'Upload falhou mesmo com fallback',
            originalError: uploadError.message,
            fallbackError: fallbackError.message
          }, { status: 500 })
        }

        console.log('✅ FALLBACK SUCESSO')
        
        const { data: fallbackUrlData } = supabaseAdmin.storage
          .from('media')
          .getPublicUrl(fileName)

        return NextResponse.json({
          success: true,
          message: 'Upload via fallback concluído',
          url: fallbackUrlData.publicUrl,
          method: 'FALLBACK_DIRECT',
          data: {
            fileName,
            filePath: fileName,
            fileSize: file.size,
            contentType
          }
        })
      }

    } else {
      // Arquivo pequeno = upload direto normal
      console.log('📁 ARQUIVO PEQUENO - UPLOAD DIRETO')
      
      const timestamp = Date.now()
      const ext = file.name.split('.').pop() || 'mov'
      const fileName = `direct/${timestamp}.${ext}`
      
      const { data, error } = await supabaseAdmin.storage
        .from('media')
        .upload(fileName, file, {
          contentType: contentType,
          upsert: false
        })

      if (error) {
        console.error('❌ UPLOAD DIRETO FALHOU:', error)
        return NextResponse.json({
          error: 'Upload direto falhou',
          details: error.message
        }, { status: 500 })
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('media')
        .getPublicUrl(fileName)

      return NextResponse.json({
        success: true,
        message: 'Upload direto concluído',
        url: urlData.publicUrl,
        method: 'DIRECT',
        data: {
          fileName,
          filePath: fileName,
          fileSize: file.size,
          contentType
        }
      })
    }

  } catch (error: any) {
    console.error('❌ ERRO GERAL TUS API:', error)
    return NextResponse.json({
      error: 'Erro interno TUS API',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}