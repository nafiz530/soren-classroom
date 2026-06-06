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
          return [speech, speechBn];
        }
        return [speech];
      default:
        return [speech];
    }
  }

  private speakText(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        // Fallback: just simulate timing
        this.simulateProgress(text, resolve);
        return;
      }

      if (this.isMuted) {
        // When muted, simulate the speech timing but don't actually speak
        this.simulateProgress(text, resolve);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Detect language
      const isBengali = /[\u0980-\u09FF]/.test(text);
      utterance.lang = isBengali ? 'bn-BD' : 'en-US';

      // Speed
      const rateMap = { slow: 0.75, normal: 1.0, fast: 1.3 };
      utterance.rate = rateMap[this.teacherSpeed];

      // Try to find appropriate voice
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find((v) => {
        if (isBengali) return v.lang.startsWith('bn');
        return v.lang.startsWith('en');
      });
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      // Progress tracking
      const words = text.split(' ');
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

      window.speechSynthesis.speak(utterance);
    });
  }

  private simulateProgress(text: string, resolve: () => void): void {
    const words = text.split(' ');
    const totalDuration = words.length * 200 * (this.teacherSpeed === 'slow' ? 1.5 : this.teacherSpeed === 'fast' ? 0.7 : 1);
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
