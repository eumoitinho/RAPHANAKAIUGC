import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Logs para debugging
  console.log('🌐 Middleware:', pathname)

  // Tratar uploads da API especialmente para iPhone
  if (pathname === '/api/upload-supabase') {
    const userAgent = request.headers.get('user-agent') || ''
    const isAppleDevice = /iPhone|iPad|iPod|Safari/i.test(userAgent)
    
    if (isAppleDevice) {
      console.log('🍎 iPhone/iPad upload detectado')
      const response = NextResponse.next()
      response.headers.set('x-apple-device', 'true')
      response.headers.set('x-max-body-size', '1073741824') // 1GB
      return response
    }
  }

  // Permitir arquivos de upload
  if (pathname.startsWith('/uploads/')) {
    console.log('📁 Servindo arquivo estático:', pathname)
    
    const response = NextResponse.next()
    
    // Headers específicos para vídeos
    if (pathname.includes('/videos/')) {
      response.headers.set('Accept-Ranges', 'bytes')
      response.headers.set('Content-Type', 'video/mp4')
      response.headers.set('Cache-Control', 'public, max-age=3600')
      console.log('🎬 Headers de vídeo aplicados')
    }
    
    // Headers para thumbnails
    if (pathname.includes('/thumbnails/')) {
      response.headers.set('Content-Type', 'image/jpeg')
      response.headers.set('Cache-Control', 'public, max-age=86400')
      console.log('🖼️ Headers de thumbnail aplicados')
    }
    
    // Headers para fotos
    if (pathname.includes('/photos/')) {
      response.headers.set('Content-Type', 'image/webp')
      response.headers.set('Cache-Control', 'public, max-age=86400')
      console.log('📷 Headers de foto aplicados')
    }
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/uploads/:path*',
    '/api/upload-supabase',
  ],
}
