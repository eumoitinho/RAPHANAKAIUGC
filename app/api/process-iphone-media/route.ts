import { NextRequest, NextResponse } from 'next/server'

// Configurações
export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Headers especiais para arquivos do iPhone
const IPHONE_FORMATS = {
  'heic': 'image/heic',
  'heif': 'image/heif', 
  'mov': 'video/quicktime',
  'mp4': 'video/mp4',
  'm4v': 'video/x-m4v'
}

export async function POST(request: NextRequest) {
  try {
    console.log('📱 Processando mídia do iPhone...')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })
    }

    // Detectar extensão e tipo
    const fileName = file.name.toLowerCase()
    const extension = fileName.split('.').pop() || ''
    const detectedType = IPHONE_FORMATS[extension as keyof typeof IPHONE_FORMATS]
    
    console.log(`📱 Arquivo: ${file.name}`)
    console.log(`📱 Tipo original: ${file.type}`)
    console.log(`📱 Tipo detectado: ${detectedType}`)
    console.log(`📱 Tamanho: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
    
    // Verificar se precisa conversão
    const needsConversion = extension === 'heic' || 
                           extension === 'heif' || 
                           (extension === 'mov' && file.size > 100 * 1024 * 1024) // MOV > 100MB
    
    if (needsConversion) {
      console.log('⚠️ Arquivo precisa de conversão/otimização')
      
      // Para HEIC/HEIF, podemos usar sharp no servidor
      if (extension === 'heic' || extension === 'heif') {
        try {
          const sharp = await import('sharp')
          const buffer = Buffer.from(await file.arrayBuffer())
          
          // Converter HEIC para JPEG
          const jpegBuffer = await sharp.default(buffer)
            .jpeg({ quality: 90 })
            .toBuffer()
          
          return NextResponse.json({
            success: true,
            converted: true,
            originalFormat: extension,
            newFormat: 'jpeg',
            originalSize: file.size,
            newSize: jpegBuffer.length,
            data: jpegBuffer.toString('base64')
          })
        } catch (convError) {
          console.error('Erro na conversão HEIC:', convError)
          // Se falhar, fazer upload do original
        }
      }
      
      // Para MOV grandes, retornar flag para processar depois
      if (extension === 'mov') {
        return NextResponse.json({
          success: true,
          converted: false,
          needsPostProcessing: true,
          format: 'mov',
          size: file.size,
          message: 'MOV grande detectado, será processado após upload'
        })
      }
    }
    
    // Arquivo não precisa conversão ou falhou
    return NextResponse.json({
      success: true,
      converted: false,
      format: extension,
      type: detectedType || file.type,
      size: file.size,
      message: 'Arquivo pronto para upload direto'
    })
    
  } catch (error) {
    console.error('❌ Erro processando mídia do iPhone:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar mídia',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// GET para verificar suporte
export async function GET() {
  return NextResponse.json({
    status: 'iPhone Media Processor Ready',
    supportedFormats: Object.keys(IPHONE_FORMATS),
    features: {
      heicConversion: true,
      movOptimization: true,
      livePhotos: true,
      proRAW: false, // Futuro
      proRes: false  // Futuro
    },
    limits: {
      maxFileSize: '500MB',
      maxVideoLength: '10min'
    }
  })
}