import { create } from 'zustand';
import type { PerformanceMode, RenderIntensity, DeviceProfile } from '@/types';

const RENDER_PRESETS: Record<PerformanceMode, RenderIntensity> = {
  low: {
    animationSmoothing: false,
    handwritingStrokeSpeed: 0,
    highlightEffects: false,
    zoomTransitions: false,
    particleEffects: false,
    shadowEffects: false,
    maxCanvasResolution: 768,
    targetFPS: 24,
  },
  standard: {
    animationSmoothing: false,
    handwritingStrokeSpeed: 15,
    highlightEffects: true,
    zoomTransitions: false,
    particleEffects: false,
    shadowEffects: false,
    maxCanvasResolution: 1024,
    targetFPS: 30,
  },
  smooth: {
    animationSmoothing: true,
    handwritingStrokeSpeed: 25,
    highlightEffects: true,
    zoomTransitions: true,
    particleEffects: false,
    shadowEffects: true,
    maxCanvasResolution: 1536,
    targetFPS: 40,
  },
  ultra: {
    animationSmoothing: true,
    handwritingStrokeSpeed: 40,
    highlightEffects: true,
    zoomTransitions: true,
    particleEffects: true,
    shadowEffects: true,
    maxCanvasResolution: 2048,
    targetFPS: 60,
  },
};

interface ModeState {
  currentMode: PerformanceMode;
  deviceProfile: DeviceProfile | null;
  renderSettings: RenderIntensity;
  isTransitioning: boolean;

  // Actions
  setMode: (mode: PerformanceMode) => void;
  setDeviceProfile: (profile: DeviceProfile) => void;
  detectBestMode: () => void;
  startTransition: () => void;
  endTransition: () => void;
}

export const useModeStore = create<ModeState>((set, get) => ({
  currentMode: 'auto',
  deviceProfile: null,
  renderSettings: RENDER_PRESETS.standard,
  isTransitioning: false,

  setMode: (mode) => {
    if (mode === 'auto') {
      get().detectBestMode();
      return;
    }
    set({ currentMode: mode, renderSettings: RENDER_PRESETS[mode] });
  },

  setDeviceProfile: (profile) => {
    set({ deviceProfile: profile });
    // Auto-detect best mode when profile is set
    if (get().currentMode === 'auto') {
      get().detectBestMode();
    }
  },

  detectBestMode: () => {
    const profile = get().deviceProfile;
    if (!profile) {
      set({ currentMode: 'standard', renderSettings: RENDER_PRESETS.standard });
      return;
    }

    let bestMode: PerformanceMode = 'standard';

    if (profile.isMobile && profile.gpuTier === 'low') {
      bestMode = 'low';
    } else if (profile.isMobile && profile.gpuTier === 'medium') {
      bestMode = 'standard';
    } else if (profile.isTablet || (profile.isDesktop && profile.gpuTier === 'medium')) {
      bestMode = 'smooth';
    } else if (profile.isDesktop && profile.gpuTier === 'high') {
      bestMode = 'ultra';
    }

    set({ currentMode: bestMode, renderSettings: RENDER_PRESETS[bestMode] });
  },

  startTransition: () => set({ isTransitioning: true }),
  endTransition: () => set({ isTransitioning: false }),
}));
