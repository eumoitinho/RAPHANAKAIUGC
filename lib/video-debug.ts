console.log('🔍 Verificando vídeos não reproduzindo...')

// Vamos criar um teste simples para verificar se os vídeos estão sendo servidos corretamente
const testVideoURL = '/uploads/videos/test.mp4' // URL de exemplo

// Função para testar se um vídeo pode ser carregado
async function testVideoLoad(videoUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.src = videoUrl
    video.muted = true
    video.playsInline = true
    
    video.addEventListener('loadeddata', () => {
      console.log('✅ Vídeo carregado com sucesso:', videoUrl)
      resolve(true)
    })
    
    video.addEventListener('error', (e) => {
      console.error('❌ Erro ao carregar vídeo:', videoUrl, e)
      resolve(false)
    })
    
    // Timeout após 10 segundos
    setTimeout(() => {
      console.warn('⏰ Timeout ao carregar vídeo:', videoUrl)
      resolve(false)
    }, 10000)
    
    video.load()
  })
}

console.log('🎬 Sistema de debug para vídeos criado!')
