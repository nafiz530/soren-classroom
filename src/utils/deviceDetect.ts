import type { DeviceProfile, PerformanceMode } from '@/types';

export function detectDevice(): DeviceProfile {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      gpuTier: 'medium',
      memoryTier: 'medium',
      detectedMode: 'standard',
      screenResolution: { width: 1920, height: 1080 },
      pixelRatio: 1,
      supportsWebAudio: false,
      supportsOffscreenCanvas: false,
    };
  }

  const ua = navigator.userAgent;
  const width = window.screen.width;
  const height = window.screen.height;
  const pixelRatio = window.devicePixelRatio || 1;

  // Device type detection
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) && width < 768;
  const isTablet = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) || (width >= 768 && width < 1024);
  const isDesktop = !isMobile && !isTablet;

  // GPU tier estimation via WebGL
  const gpuTier = detectGpuTier();
  const memoryTier = detectMemoryTier();

  // Feature detection
  const supportsWebAudio = typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
  const supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

  // Determine best mode
  const detectedMode = calculateBestMode(isMobile, isTablet, gpuTier, memoryTier);

  return {
    isMobile,
    isTablet,
    isDesktop,
    gpuTier,
    memoryTier,
    detectedMode,
    screenResolution: { width, height },
    pixelRatio,
    supportsWebAudio,
    supportsOffscreenCanvas,
  };
}

function detectGpuTier(): 'low' | 'medium' | 'high' {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'low';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const rendererLower = renderer.toLowerCase();

      // Known low-end GPUs
      if (
        rendererLower.includes('mali-4') ||
        rendererLower.includes('adreno 3') ||
        rendererLower.includes('powervr sgx') ||
        rendererLower.includes('intel hd graphics') ||
        rendererLower.includes('swiftshader')
      ) {
        return 'low';
      }

      // Known high-end GPUs
      if (
        rendererLower.includes('nvidia geforce') ||
        rendererLower.includes('radeon rx') ||
        rendererLower.includes('apple gpu') ||
        rendererLower.includes('adreno 6') ||
        rendererLower.includes('mali-g7') ||
        rendererLower.includes('mali-g71') ||
        rendererLower.includes('apple m1') ||
        rendererLower.includes('apple m2') ||
        rendererLower.includes('apple m3') ||
        rendererLower.includes('apple m4')
      ) {
        return 'high';
      }
    }

    // Fallback: check max texture size
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (maxTextureSize >= 16384) return 'high';
    if (maxTextureSize >= 8192) return 'medium';
    return 'low';
  } catch {
    return 'medium';
  }
}

function detectMemoryTier(): 'low' | 'medium' | 'high' {
  if (typeof navigator !== 'undefined' && (navigator as any).deviceMemory) {
    const mem = (navigator as any).deviceMemory as number;
    if (mem >= 8) return 'high';
    if (mem >= 4) return 'medium';
    return 'low';
  }
  return 'medium';
}

function calculateBestMode(
  isMobile: boolean,
  isTablet: boolean,
  gpuTier: 'low' | 'medium' | 'high',
  memoryTier: 'low' | 'medium' | 'high'
): PerformanceMode {
  if (isMobile && gpuTier === 'low') return 'low';
  if (isMobile && gpuTier === 'medium') return 'standard';
  if (isTablet && gpuTier !== 'low') return 'smooth';
  if (gpuTier === 'high' && memoryTier === 'high') return 'ultra';
  if (gpuTier === 'high') return 'smooth';
  return 'standard';
}
