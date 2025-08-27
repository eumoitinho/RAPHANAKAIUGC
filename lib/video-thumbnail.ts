/**
 * Video Thumbnail Generation Utility
 * Generates thumbnails from video files using HTML5 Canvas API
 * Based on oplove_v2 efficient approach for iOS compatibility
 */

export interface ThumbnailOptions {
  /** Time in seconds to capture thumbnail (default: 1) */
  captureTime?: number;
  /** Thumbnail width (default: 320) */
  width?: number;
  /** Thumbnail height (default: 180) */
  height?: number;
  /** Image quality for JPEG (0-1, default: 0.8) */
  quality?: number;
  /** Output format (default: 'image/jpeg') */
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ThumbnailResult {
  /** Generated thumbnail as Blob */
  blob: Blob;
  /** Generated thumbnail as data URL */
  dataUrl: string;
  /** Thumbnail dimensions */
  dimensions: { width: number; height: number };
}

/**
 * Generates a thumbnail from a video file
 */
export async function generateVideoThumbnail(
  videoFile: File,
  options: ThumbnailOptions = {}
): Promise<ThumbnailResult> {
  const {
    captureTime = 1,
    width = 320,
    height = 180,
    quality = 0.8,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    console.log(`🎬 GERANDO THUMB: ${videoFile.name} no tempo ${captureTime}s`)
    
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('❌ Canvas context não disponível')
      reject(new Error('Canvas context não disponível'));
      return;
    }

    // Configuração otimizada para iOS
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.autoplay = false;
    video.controls = false;

    let hasResolved = false;

    const cleanup = () => {
      if (video.src) {
        URL.revokeObjectURL(video.src);
      }
      video.remove();
    };

    const onError = (event: Event) => {
      if (hasResolved) return;
      hasResolved = true;
      console.error('❌ Erro carregando vídeo:', event)
      cleanup();
      reject(new Error('Falha ao carregar vídeo'));
    };

    const onLoadedMetadata = () => {
      if (hasResolved) return;
      console.log(`📐 Metadata carregado: ${video.videoWidth}x${video.videoHeight}, duração: ${video.duration}s`)
      
      // Canvas com aspecto original do vídeo
      const aspectRatio = video.videoWidth / video.videoHeight;
      let canvasWidth = width;
      let canvasHeight = height;

      if (aspectRatio > width / height) {
        canvasHeight = Math.round(width / aspectRatio);
      } else {
        canvasWidth = Math.round(height * aspectRatio);
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Tempo de captura seguro
      const seekTime = Math.min(Math.max(captureTime, 0.1), video.duration - 0.1);
      console.log(`⏰ Buscando tempo: ${seekTime}s`)
      video.currentTime = seekTime;
    };

    const onSeeked = () => {
      if (hasResolved) return;
      hasResolved = true;
      
      try {
        console.log('🎨 Desenhando frame no canvas...')
        
        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar frame do vídeo
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.error('❌ Falha ao criar blob')
              cleanup();
              reject(new Error('Falha ao criar blob'));
              return;
            }

            const dataUrl = canvas.toDataURL(format, quality);
            console.log(`✅ THUMBNAIL GERADA: ${blob.size} bytes`)
            
            cleanup();
            resolve({
              blob,
              dataUrl,
              dimensions: { width: canvas.width, height: canvas.height }
            });
          },
          format,
          quality
        );
      } catch (error) {
        console.error('❌ Erro desenhando frame:', error)
        cleanup();
        reject(new Error(`Erro desenhando frame: ${error}`));
      }
    };

    const onCanPlayThrough = () => {
      console.log('▶️ Vídeo pronto para reprodução')
    };

    // Event listeners
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    video.addEventListener('canplaythrough', onCanPlayThrough);

    // Timeout de segurança
    setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        console.error('⏰ TIMEOUT - Thumbnail demorou muito')
        cleanup();
        reject(new Error('Timeout gerando thumbnail'));
      }
    }, 10000); // 10 segundos

    // Carregar vídeo
    try {
      const videoUrl = URL.createObjectURL(videoFile);
      console.log('📁 Carregando vídeo URL:', videoUrl)
      video.src = videoUrl;
    } catch (error) {
      console.error('❌ Erro criando object URL:', error)
      reject(new Error('Erro criando URL do vídeo'));
    }
  });
}

/**
 * Generates multiple thumbnails at different time points
 */
export async function generateMultipleThumbnails(
  videoFile: File,
  timePoints: number[],
  options: Omit<ThumbnailOptions, 'captureTime'> = {}
): Promise<ThumbnailResult[]> {
  console.log(`🎬 GERANDO ${timePoints.length} THUMBNAILS para ${videoFile.name}`)
  const thumbnails: ThumbnailResult[] = [];

  for (let i = 0; i < timePoints.length; i++) {
    const timePoint = timePoints[i];
    try {
      console.log(`📸 Thumbnail ${i + 1}/${timePoints.length} no tempo ${timePoint}s`)
      const thumbnail = await generateVideoThumbnail(videoFile, {
        ...options,
        captureTime: timePoint
      });
      thumbnails.push(thumbnail);
      console.log(`✅ Thumbnail ${i + 1} gerada com sucesso`)
    } catch (error) {
      console.error(`❌ Falha thumbnail ${i + 1} no tempo ${timePoint}s:`, error);
      // Continuar tentando os outros tempos mesmo se um falhar
    }
    
    // Pequena pausa entre gerações para evitar sobrecarga
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`✅ THUMBNAILS FINALIZADAS: ${thumbnails.length}/${timePoints.length}`)
  return thumbnails;
}

/**
 * Gets video metadata without generating thumbnail
 */
export async function getVideoMetadata(videoFile: File): Promise<{
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onError);
      URL.revokeObjectURL(video.src);
    };

    const onError = () => {
      cleanup();
      reject(new Error('Failed to load video metadata'));
    };

    const onLoadedMetadata = () => {
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight
      };
      
      cleanup();
      resolve(metadata);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('error', onError);
    video.preload = 'metadata';
    video.src = URL.createObjectURL(videoFile);
  });
}

// Legacy function for backward compatibility
export const createThumbnailFromVideo = async (videoFile: File): Promise<File> => {
  const thumbnailResult = await generateVideoThumbnail(videoFile);
  const fileName = videoFile.name.replace(/\.[^.]+$/, '_thumb.jpg');
  
  return new File([thumbnailResult.blob], fileName, { 
    type: 'image/jpeg',
    lastModified: Date.now()
  });
};