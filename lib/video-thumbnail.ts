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
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Set up video element for iOS compatibility
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      URL.revokeObjectURL(video.src);
    };

    const onError = () => {
      cleanup();
      reject(new Error('Failed to load video'));
    };

    const onLoadedMetadata = () => {
      // Set canvas dimensions maintaining aspect ratio
      const aspectRatio = video.videoWidth / video.videoHeight;
      let canvasWidth = width;
      let canvasHeight = height;

      if (aspectRatio > width / height) {
        canvasHeight = width / aspectRatio;
      } else {
        canvasWidth = height * aspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Seek to capture time (but not beyond video duration)
      const seekTime = Math.min(captureTime, video.duration - 0.1);
      video.currentTime = seekTime;
    };

    const onSeeked = () => {
      try {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              cleanup();
              reject(new Error('Failed to generate thumbnail blob'));
              return;
            }

            const dataUrl = canvas.toDataURL(format, quality);
            
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
        cleanup();
        reject(new Error(`Failed to draw video frame: ${error}`));
      }
    };

    // Set up event listeners
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);

    // Start loading video
    video.src = URL.createObjectURL(videoFile);
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
  const thumbnails: ThumbnailResult[] = [];

  for (const timePoint of timePoints) {
    try {
      const thumbnail = await generateVideoThumbnail(videoFile, {
        ...options,
        captureTime: timePoint
      });
      thumbnails.push(thumbnail);
    } catch (error) {
      console.warn(`Failed to generate thumbnail at ${timePoint}s:`, error);
    }
  }

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