import { NextRequest, NextResponse } from 'next/server'

const UPLOADS_API_URL = process.env.UPLOADS_API_URL || 'https://uploads.catalisti.com.br'

// Configurações para Vercel
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Redirecionando upload para VPS:', UPLOADS_API_URL)
    
    const formData = await request.formData()
    
    // Log do que está sendo enviado
    const file = formData.get('file') as File
    console.log('Arquivo:', file?.name, 'Tamanho:', file?.size, 'bytes')
    
    // Verificar se o arquivo não é muito grande para a Vercel processar
    const maxVercelSize = 50 * 1024 * 1024 // 50MB
    if (file && file.size > maxVercelSize) {
      return NextResponse.json(
        { 
          error: 'Arquivo muito grande para processamento via Vercel. Use upload direto na VPS.',
          suggestion: 'Tente um arquivo menor que 50MB ou use upload direto.'
        },
        { status: 413 }
      )
    }
    
    // Reenviar para a VPS
    const response = await fetch(`${UPLOADS_API_URL}/upload`, {
      method: 'POST',
      body: formData,
    })

    console.log('Status da VPS:', response.status)

    if (!response.ok) {
      let errorMessage = `VPS Error: ${response.status}`
      
      try {
        const errorText = await response.text()
        console.error('❌ Erro da VPS:', errorText)
        errorMessage = errorText
      } catch (e) {
        console.error('❌ Erro ao ler resposta da VPS')
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('✅ Upload concluído na VPS:', result.item?.fileName)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Erro no upload:', error)
    
    if (error instanceof Error && (
      error.message.includes('PayloadTooLargeError') || 
      error.message.includes('Body exceeded') ||
      error.message.includes('413')
    )) {
      return NextResponse.json(
        { 
          error: 'Arquivo muito grande para a Vercel processar',
          suggestion: 'Tente um arquivo menor que 50MB'
        },
        { status: 413 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Upload failed',
        details: 'Erro ao conectar com o servidor de uploads'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    console.log('📋 Buscando arquivos da VPS:', UPLOADS_API_URL)
    
    const response = await fetch(`${UPLOADS_API_URL}/files`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })

    if (!response.ok) {
      throw new Error(`VPS Error: ${response.status}`)
    }

    const result = await response.json()
    console.log(`✅ ${result.files?.length || 0} arquivos encontrados`)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Erro ao buscar arquivos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files from VPS' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    const fileType = searchParams.get('fileType')
    
    if (!filename || !fileType) {
      return NextResponse.json(
        { error: 'Filename and fileType are required' },
        { status: 400 }
      )
    }
    
    console.log('🗑️ Deletando arquivo da VPS:', filename)
    
    const response = await fetch(
      `${UPLOADS_API_URL}/delete/${filename}?fileType=${fileType}`,
      { method: 'DELETE' }
    )
    
    if (!response.ok) {
      throw new Error(`VPS Error: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('✅ Arquivo deletado da VPS')
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Erro ao deletar arquivo:', error)
    return NextResponse.json(
      { error: 'Failed to delete file from VPS' },
      { status: 500 }
    )
  }
}