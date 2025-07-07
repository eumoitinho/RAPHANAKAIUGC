import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Logs para debugging
  console.log('🌐 Middleware:', pathname)

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
  ],
}
