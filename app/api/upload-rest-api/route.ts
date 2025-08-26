import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// Configurações do App Router
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutos
export const dynamic = 'force-dynamic'

// UPLOAD VIA REST API DIRETA (SERVIDOR)
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Upload REST API iniciado...')
    
    // Verificar configuração
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase incompleta' },
        { status: 500 }
      )
    }

    // Pegar dados do formulário
    const formData = await request.formData()
    const file = formData.get('file') as File
    const needsThumbnail = formData.get('needsThumbnail') === 'true'
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    console.log(`📁 Arquivo: ${file.name} (${file.size} bytes)`)
    
    // Detectar se é arquivo do iPhone
    const fileName = file.name.toLowerCase()
    const ext = fileName.split('.').pop()
    const isiPhoneVideo = ext === 'mov' || fileName.includes('img_')
    
    if (isiPhoneVideo) {
      console.log('📱 Vídeo do iPhone detectado, thumbnail será gerada no servidor')
    }

    // Determinar tipo
    const isVideo = file.type.startsWith('video/') || 
                    ['.mov', '.mp4', '.avi'].some(ext => file.name.toLowerCase().endsWith(ext))
    const bucket = isVideo ? 'videos' : 'images'
    
    // Gerar caminho único
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const year = new Date().getFullYear()
    const month = new Date().getMonth() + 1
    const filePath = `${year}/${month}/${fileName}`
    
    console.log(`📂 Destino: ${bucket}/${filePath}`)

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // URL da REST API do Supabase Storage
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`
    console.log(`🎯 REST API URL: ${uploadUrl}`)

    // UPLOAD VIA REST API COM SERVICE ROLE KEY (MAIS PRIVILÉGIOS)
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true',
        'Cache-Control': 'max-age=3600'
      },
      body: buffer
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('❌ Erro REST API:', uploadResponse.status, errorText)
      
      // Tratamento específico de erros
      if (uploadResponse.status === 404) {
        return NextResponse.json({
          error: `Bucket "${bucket}" não existe`,
          solution: `Crie o bucket no Supabase Dashboard > Storage > New Bucket`,
          details: {
            bucket,
            public: true,
            maxFileSize: isVideo ? '500MB' : '10MB'
          }
        }, { status: 404 })
      }
      
      if (uploadResponse.status === 413) {
        return NextResponse.json({
          error: 'Arquivo muito grande',
          maxSize: isVideo ? '500MB' : '10MB'
        }, { status: 413 })
      }
      
      throw new Error(`Upload falhou: ${uploadResponse.status} - ${errorText}`)
    }

    const uploadResult = await uploadResponse.json()
    console.log('✅ Upload REST API concluído:', uploadResult)

    // Gerar URL pública
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`
    console.log('📎 URL pública:', publicUrl)
    
    // Gerar thumbnail se for vídeo do iPhone
    let thumbnailUrl = publicUrl
    let thumbnailPath = ''
    
    if (isVideo && (isiPhoneVideo || needsThumbnail)) {
      console.log('🎬 Gerando thumbnail para vídeo...')
      
      try {
        // Salvar temporariamente para processar com ffmpeg
        const os = await import('os')
        const tempDir = os.tmpdir() // Usa o diretório temporário do sistema
        const tempPath = `${tempDir}/${fileName}`
        const fs = await import('fs')
        const path = await import('path')
        
        // Salvar arquivo temporário
        fs.writeFileSync(tempPath, buffer)
        
        // Gerar thumbnail com ffmpeg
        const ffmpeg = await import('fluent-ffmpeg')
        const ffmpegStatic = await import('ffmpeg-static')
        
        if (ffmpegStatic.default) {
          ffmpeg.default.setFfmpegPath(ffmpegStatic.default)
        }
        
        // Extrair frame para thumbnail
        const thumbnailName = `thumb_${fileName.replace(/\.[^/.]+$/, '.jpg')}`
        thumbnailPath = `${year}/${month}/${thumbnailName}`
        
        await new Promise((resolve, reject) => {
          ffmpeg.default(tempPath)
            .screenshots({
              count: 1,
              folder: tempDir,
              filename: thumbnailName,
              size: '1080x1920'
            })
            .on('end', resolve)
            .on('error', reject)
        })
        
        // Upload da thumbnail
        const thumbnailBuffer = fs.readFileSync(`${tempDir}/${thumbnailName}`)
        const thumbUploadUrl = `${supabaseUrl}/storage/v1/object/thumbnails/${thumbnailPath}`
        
        const thumbResponse = await fetch(thumbUploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true'
          },
          body: thumbnailBuffer
        })
        
        if (thumbResponse.ok) {
          thumbnailUrl = `${supabaseUrl}/storage/v1/object/public/thumbnails/${thumbnailPath}`
          console.log('✅ Thumbnail gerada:', thumbnailUrl)
        }
        
        // Limpar arquivos temporários
        fs.unlinkSync(tempPath)
        fs.unlinkSync(`${tempDir}/${thumbnailName}`)
        
      } catch (thumbError) {
        console.error('⚠️ Erro gerando thumbnail (vídeo foi salvo):', thumbError)
      }
    }

    // Salvar metadados no banco (opcional)
    try {
      const { createMedia } = await import('@/lib/supabase-db')
      
      await createMedia({
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        file_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        file_type: isVideo ? 'video' : 'photo',
        categories: [],
        views: 0,
        file_name: file.name,
        file_size: file.size,
        width: 0,
        height: 0,
        supabase_path: filePath,
        supabase_thumbnail_path: thumbnailUrl !== publicUrl ? thumbnailPath : '',
      })
      
      console.log('✅ Metadados salvos no banco')
    } catch (dbError) {
      console.warn('⚠️ Erro salvando metadados (upload funcionou):', dbError)
    }

    return NextResponse.json({
      success: true,
      message: 'Upload REST API concluído!',
      data: {
        fileUrl: publicUrl,
        thumbnailUrl: thumbnailUrl,
        bucket,
        path: filePath,
        size: file.size,
        isiPhone: isiPhoneVideo
      }
    })
    
  } catch (error) {
    console.error('❌ ERRO GERAL REST API:', error)
    return NextResponse.json(
      { 
        error: 'Erro no upload REST API',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// TESTAR CONFIGURAÇÃO
export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return NextResponse.json({
    status: 'REST API Upload Ready',
    config: {
      supabaseUrl: supabaseUrl ? '✅ Configurado' : '❌ Faltando',
      serviceRoleKey: hasServiceKey ? '✅ Configurado' : '❌ Faltando',
      anonKey: hasAnonKey ? '✅ Configurado' : '❌ Faltando',
    },
    buckets: ['videos', 'images', 'thumbnails'],
    maxSize: {
      videos: '500MB',
      images: '10MB'
    }
  })
}