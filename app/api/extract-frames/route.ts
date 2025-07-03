import { NextRequest, NextResponse } from 'next/server'

const UPLOADS_API_URL = process.env.UPLOADS_API_URL || 'https://uploads.catalisti.com.br'

// Configurações para Vercel
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🎬 Redirecionando extração de frames para VPS...')
    
    const formData = await request.formData()
    
    // Verificar se o vídeo foi enviado
    const video = formData.get('video') as File
    if (!video) {
      return NextResponse.json(
        { error: 'Nenhum vídeo enviado' },
        { status: 400 }
      )
    }

    console.log('📄 Vídeo recebido:', video.name, 'Tamanho:', video.size, 'bytes')

    // Reenviar diretamente para a VPS
    const response = await fetch(`${UPLOADS_API_URL}/video/frames`, {
      method: 'POST',
      body: formData
    })

    console.log('Status da VPS:', response.status)
    console.log('Content-Type:', response.headers.get('content-type'))

    if (!response.ok) {
      const responseText = await response.text()
      console.error('❌ Erro da VPS:', responseText)
      
      // Tentar extrair mensagem de erro se for HTML
      let errorMessage = `VPS Error: ${response.status}`
      
      if (responseText.includes('<title>')) {
        // É uma página de erro HTML
        const titleMatch = responseText.match(/<title>(.*?)<\/title>/i)
        if (titleMatch) {
          errorMessage = titleMatch[1]
        }
      } else {
        // Tentar como JSON
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = responseText.substring(0, 100)
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      const responseText = await response.text()
      console.error('❌ Resposta não é JSON:', responseText.substring(0, 200))
      
      return NextResponse.json(
        { error: 'Servidor VPS retornou resposta inválida (não é JSON)' },
        { status: 500 }
      )
    }

    const result = await response.json()
    console.log('✅ Frames extraídos na VPS:', result.frames?.length || 0)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Erro ao extrair frames:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract frames' },
      { status: 500 }
    )
  }
}