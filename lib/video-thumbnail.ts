// Utilidade para gerar thumbnail de vídeo usando canvas
export const generateVideoThumbnail = (videoFile: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    video.addEventListener('loadedmetadata', () => {
      // Configurar canvas com proporção 9:16
      canvas.width = 400
      canvas.height = 600
      
      // Ir para 1 segundo do vídeo (ou 10% da duração, o que for menor)
      video.currentTime = Math.min(1, video.duration * 0.1)
    })

    video.addEventListener('seeked', () => {
      // Desenhar frame no canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Converter para blob JPEG
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create thumbnail blob'))
        }
      }, 'image/jpeg', 0.8)
      
      // Limpar
      video.remove()
    })

    video.addEventListener('error', (e) => {
      reject(new Error('Video loading failed'))
    })

    // Configurar vídeo
    video.muted = true
    video.crossOrigin = 'anonymous'
    video.src = URL.createObjectURL(videoFile)
    video.load()
  })
}

export const createThumbnailFromVideo = async (videoFile: File): Promise<File> => {
  const thumbnailBlob = await generateVideoThumbnail(videoFile)
  const fileName = videoFile.name.replace(/\.[^.]+$/, '_thumb.jpg')
  
  return new File([thumbnailBlob], fileName, { 
    type: 'image/jpeg',
    lastModified: Date.now()
  })
}