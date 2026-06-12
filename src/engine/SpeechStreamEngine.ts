import type { LanguageMode } from '@/types';

type ProgressCallback = (progress: number, text: string) => void;

export class SpeechStreamEngine {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPlaying = false;
  private isMuted = false;
  private isPaused = false;
  private languageMode: LanguageMode = 'both';
  private teacherSpeed: 'slow' | 'normal' | 'fast' = 'normal';
  private progressCallbacks: ProgressCallback[] = [];
  private completeCallbacks: (() => void)[] = [];
  private currentText = '';
  private voicesLoaded = false;

  constructor() {
    // Pre-load voices (some browsers load them asynchronously)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
        this.voicesLoaded = true;
      };
      loadVoices();
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  async stream(speech: string, speechBn?: string): Promise<void> {
    this.stop();
    this.isPlaying = true;
    this.isPaused = false;

    const textsToSpeak = this.getTextsForLanguage(speech, speechBn);

    for (const textPart of textsToSpeak) {
      if (!this.isPlaying) break;

      this.currentText = textPart;
      await this.speakText(textPart);
    }

    this.isPlaying = false;
    this.completeCallbacks.forEach((cb) => cb());
  }

  private getTextsForLanguage(speech: string, speechBn?: string): string[] {
    switch (this.languageMode) {
      case 'en':
        return [speech];
      case 'bn':
        return speechBn ? [speechBn] : [speech];
      case 'both':
        if (speechBn) {
          // For "both" mode: speak Bangla first (primary), then English
          // This matches how real BD teachers teach — Bangla explanation followed by English terms
          return [speechBn, speech];
        }
        return [speech];
      default:
        return [speech];
    }
  }

  private speakText(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        this.simulateProgress(text, resolve);
        return;
      }

      if (this.isMuted) {
        this.simulateProgress(text, resolve);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Detect language — check for Bengali Unicode range
      const isBengali = /[\u0980-\u09FF]/.test(text);
      utterance.lang = isBengali ? 'bn-BD' : 'en-US';

      // Speed based on teacher speed setting and language
      // Bengali speech naturally needs to be slightly slower
      const rateMap = {
        slow: isBengali ? 0.7 : 0.75,
        normal: isBengali ? 0.9 : 1.0,
        fast: isBengali ? 1.1 : 1.3,
      };
      utterance.rate = rateMap[this.teacherSpeed];

      // Pitch slightly varies for more natural sound
      utterance.pitch = isBengali ? 1.05 : 1.0;

      // Try to find the best matching voice
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = this.findBestVoice(voices, isBengali);
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      // Progress tracking
      const words = text.split(/\s+/);
      const totalWords = words.length;
      let reportedProgress = 0;

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const progress = Math.min(1, event.charIndex / Math.max(1, text.length));
          if (progress > reportedProgress) {
            reportedProgress = progress;
            this.progressCallbacks.forEach((cb) => cb(progress, text.substring(0, event.charIndex)));
          }
        }
      };

      utterance.onend = () => {
        this.progressCallbacks.forEach((cb) => cb(1, text));
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        if (event.error !== 'canceled') {
          console.warn('[SpeechStreamEngine] TTS error:', event.error);
        }
        this.currentUtterance = null;
        resolve();
      };

      // Chrome bug workaround: speechSynthesis can pause after ~15 seconds
      // We use a keepAlive interval to prevent this
      const keepAlive = setInterval(() => {
        if (!this.isPlaying) {
          clearInterval(keepAlive);
          return;
        }
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);

      const originalOnEnd = utterance.onend;
      utterance.onend = (event) => {
        clearInterval(keepAlive);
        originalOnEnd?.(event);
      };

      const originalOnError = utterance.onerror;
      utterance.onerror = (event) => {
        clearInterval(keepAlive);
        originalOnError?.(event);
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Find the best available voice for the given language.
   * Priority:
   * 1. Exact language match (bn-BD or en-US)
   * 2. Language prefix match (bn-* or en-*)
   * 3. Any voice (fallback)
   */
  private findBestVoice(voices: SpeechSynthesisVoice[], isBengali: boolean): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    const targetLang = isBengali ? 'bn' : 'en';
    const targetLocale = isBengali ? 'bn-BD' : 'en-US';

    // 1. Try exact locale match
    const exactMatch = voices.find((v) => v.lang === targetLocale);
    if (exactMatch) return exactMatch;

    // 2. Try language prefix match — prefer non-default voices (usually higher quality)
    const prefixMatches = voices.filter((v) => v.lang.startsWith(targetLang));
    if (prefixMatches.length > 0) {
      // Prefer "Google" or "Microsoft" voices (usually better quality)
      const premiumVoice = prefixMatches.find((v) =>
        v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural')
      );
      if (premiumVoice) return premiumVoice;

      // Prefer local voices over network (more reliable)
      const localVoice = prefixMatches.find((v) => v.localService);
      if (localVoice) return localVoice;

      return prefixMatches[0];
    }

    // 3. Fallback: no matching voice
    return null;
  }

  private simulateProgress(text: string, resolve: () => void): void {
    const words = text.split(/\s+/);
    // Simulate timing: ~300ms per word for Bangla, ~200ms for English
    const isBengali = /[\u0980-\u09FF]/.test(text);
    const msPerWord = isBengali ? 300 : 200;
    const speedFactor = this.teacherSpeed === 'slow' ? 1.5 : this.teacherSpeed === 'fast' ? 0.7 : 1;
    const totalDuration = words.length * msPerWord * speedFactor;
    const stepDuration = totalDuration / words.length;
    let step = 0;

    const interval = setInterval(() => {
      if (!this.isPlaying) {
        clearInterval(interval);
        resolve();
        return;
      }

      step++;
      const progress = Math.min(1, step / words.length);
      const charIndex = Math.min(text.length, words.slice(0, step).join(' ').length);
      this.progressCallbacks.forEach((cb) => cb(progress, text.substring(0, charIndex)));

      if (step >= words.length) {
        clearInterval(interval);
        resolve();
      }
    }, stepDuration);
  }

  pause(): void {
    if (this.isPlaying && !this.isPaused) {
      this.isPaused = true;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.pause();
      }
    }
  }

  resume(): void {
    if (this.isPlaying && this.isPaused) {
      this.isPaused = false;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.resume();
      }
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted && this.isPlaying) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }

  setLanguageMode(mode: LanguageMode): void {
    this.languageMode = mode;
  }

  setTeacherSpeed(speed: 'slow' | 'normal' | 'fast'): void {
    this.teacherSpeed = speed;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  onProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.push(callback);
    return () => {
      this.progressCallbacks = this.progressCallbacks.filter((cb) => cb !== callback);
    };
  }

  onComplete(callback: () => void): () => void {
    this.completeCallbacks.push(callback);
    return () => {
      this.completeCallbacks = this.completeCallbacks.filter((cb) => cb !== callback);
    };
  }
}
