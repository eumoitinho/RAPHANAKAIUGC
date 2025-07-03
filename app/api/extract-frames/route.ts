import { NextRequest, NextResponse } from 'next/server'

const UPLOADS_API_URL = process.env.UPLOADS_API_URL || 'https://uploads.catalisti.com.br'

// Configurações para Vercel
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🎬 Redirecionando extração de frames para VPS...')
    
    const formData = await request.formData()
    
    // Reenviar diretamente para a VPS
    const response = await fetch(`${UPLOADS_API_URL}/video/frames`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro da VPS:', errorText)
      throw new Error(`VPS Error: ${response.status}`)
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