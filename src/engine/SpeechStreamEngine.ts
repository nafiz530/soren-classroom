import type { LanguageMode } from '@/types';

type ProgressCallback = (progress: number, text: string) => void;

// ─── Voice scoring ────────────────────────────────────────────────
// Finds the best available voice for a given language from whatever
// the browser / OS provides — all free, no API key needed.
function pickBestVoice(
  voices: SpeechSynthesisVoice[],
  isBengali: boolean,
): SpeechSynthesisVoice | null {
  if (isBengali) {
    // Priority order for Bangla
    const bnOrder = ['bn-BD', 'bn-IN', 'bn', 'hi-IN', 'hi'];
    for (const code of bnOrder) {
      const v = voices.find(
        (v) => v.lang.startsWith(code) && !v.name.toLowerCase().includes('espeak'),
      );
      if (v) return v;
    }
    return voices.find((v) => v.lang.startsWith('bn')) ?? null;
  }

  // English — prefer Google neural voices (ships with Chrome)
  const enPreference = [
    'Google UK English Female',
    'Google UK English Male',
    'Google US English',
    'Microsoft Aria Online',
    'Microsoft Guy Online',
    'Samantha',        // macOS / iOS
    'Karen',           // macOS
    'Daniel',          // macOS UK
  ];
  for (const name of enPreference) {
    const v = voices.find((v) => v.name === name);
    if (v) return v;
  }
  // Fallback: any non-espeak English voice
  return (
    voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        !v.name.toLowerCase().includes('espeak') &&
        !v.name.toLowerCase().includes('festival'),
    ) ?? null
  );
}

// ─── Text preprocessing ───────────────────────────────────────────
// Splits a paragraph into natural speaking chunks so the engine
// can insert pauses between them — biggest de-roboticer trick.
function splitIntoChunks(text: string): string[] {
  // Split on sentence-ending punctuation, keeping the delimiter
  const raw = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[।.!?])\s+/);

  const chunks: string[] = [];
  for (const chunk of raw) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    // If a sentence is very long, split further on commas/semicolons
    if (trimmed.length > 120) {
      const sub = trimmed.split(/(?<=[,;—])\s+/);
      for (const s of sub) {
        if (s.trim()) chunks.push(s.trim());
      }
    } else {
      chunks.push(trimmed);
    }
  }
  return chunks.length ? chunks : [text.trim()];
}

// Detect whether a text chunk is primarily Bengali
function isBengaliText(text: string): boolean {
  const bengaliChars = (text.match(/[\u0980-\u09FF]/g) || []).length;
  return bengaliChars / text.length > 0.25;
}

// ─── Main engine ──────────────────────────────────────────────────
export class SpeechStreamEngine {
  private isPlaying = false;
  private isMuted = false;
  private isPaused = false;
  private languageMode: LanguageMode = 'both';
  private teacherSpeed: 'slow' | 'normal' | 'fast' = 'normal';
  private progressCallbacks: ProgressCallback[] = [];
  private completeCallbacks: (() => void)[] = [];
  private currentText = '';
  private stopRequested = false;
  private voicesReady = false;

  // Ensure voices are loaded (Chrome loads them async)
  private async ensureVoices(): Promise<SpeechSynthesisVoice[]> {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      this.voicesReady = true;
      return voices;
    }
    return new Promise((resolve) => {
      const handler = () => {
        voices = window.speechSynthesis.getVoices();
        this.voicesReady = true;
        resolve(voices);
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);
      // Safety timeout
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 2000);
    });
  }

  async stream(speech: string, speechBn?: string): Promise<void> {
    this.stop();
    this.stopRequested = false;
    this.isPlaying = true;

    const segments = this.buildSegments(speech, speechBn);
    const voices = await this.ensureVoices();
    const totalChars = segments.reduce((a, s) => a + s.text.length, 0);
    let spokenChars = 0;

    for (const segment of segments) {
      if (this.stopRequested) break;

      this.currentText = segment.text;
      const chunks = splitIntoChunks(segment.text);

      for (let ci = 0; ci < chunks.length; ci++) {
        if (this.stopRequested) break;

        const chunk = chunks[ci];
        const isBn = isBengaliText(chunk);
        const voice = pickBestVoice(voices, isBn);

        await this.speakChunk(chunk, isBn, voice);

        spokenChars += chunk.length;
        const progress = Math.min(0.98, spokenChars / Math.max(1, totalChars));
        this.progressCallbacks.forEach((cb) => cb(progress, chunk));

        // Natural pause between chunks — like a teacher breathing
        if (ci < chunks.length - 1 && !this.stopRequested) {
          await this.sleep(this.pauseBetweenChunks());
        }
      }

      // Longer pause between language segments
      if (!this.stopRequested && segments.length > 1) {
        await this.sleep(600);
      }
    }

    if (!this.stopRequested) {
      this.progressCallbacks.forEach((cb) => cb(1, speech));
    }
    this.isPlaying = false;
    this.completeCallbacks.forEach((cb) => cb());
  }

  private buildSegments(
    speech: string,
    speechBn?: string,
  ): { text: string; lang: string }[] {
    switch (this.languageMode) {
      case 'en':
        return [{ text: speech, lang: 'en-US' }];
      case 'bn':
        return [{ text: speechBn || speech, lang: 'bn-BD' }];
      case 'both':
      default:
        if (speechBn) {
          // Speak Bangla first (primary), then English — teacher style
          return [
            { text: speechBn, lang: 'bn-BD' },
            { text: speech, lang: 'en-US' },
          ];
        }
        return [{ text: speech, lang: 'en-US' }];
    }
  }

  private speakChunk(
    text: string,
    isBengali: boolean,
    voice: SpeechSynthesisVoice | null,
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!text.trim()) { resolve(); return; }

      if (typeof window === 'undefined' || !window.speechSynthesis) {
        this.simulateProgress(text, resolve);
        return;
      }

      if (this.isMuted) {
        this.simulateProgress(text, resolve);
        return;
      }

      // Chrome bug: cancel any lingering speech before speaking
      window.speechSynthesis.cancel();

      const utter = new SpeechSynthesisUtterance(text);

      // ── Humanization settings ──────────────────────────────────
      const speedMap = { slow: 0.82, normal: 0.91, fast: 1.1 };
      utter.rate = speedMap[this.teacherSpeed];

      if (isBengali) {
        utter.lang = 'bn-BD';
        utter.rate = Math.min(utter.rate, 0.88); // Bangla needs slightly slower
        utter.pitch = 1.05;
        utter.volume = 1.0;
      } else {
        utter.lang = 'en-US';
        utter.pitch = 1.08;   // Slightly higher pitch = less robotic on most voices
        utter.volume = 0.95;
      }

      if (voice) utter.voice = voice;

      // Progress via boundary events
      utter.onboundary = (e) => {
        if (e.name === 'word') {
          const progress = Math.min(0.98, e.charIndex / Math.max(1, text.length));
          this.progressCallbacks.forEach((cb) =>
            cb(progress, text.substring(0, e.charIndex)),
          );
        }
      };

      utter.onend = () => resolve();
      utter.onerror = (e) => {
        if (e.error !== 'canceled') console.warn('[Speech] error:', e.error);
        resolve();
      };

      // Chrome desktop sometimes gets stuck — kick it
      setTimeout(() => window.speechSynthesis.speak(utter), 50);
    });
  }

  private pauseBetweenChunks(): number {
    const base = { slow: 500, normal: 320, fast: 160 };
    return base[this.teacherSpeed];
  }

  private simulateProgress(text: string, resolve: () => void): void {
    const words = text.split(' ').length;
    const totalMs =
      words * 180 *
      (this.teacherSpeed === 'slow' ? 1.6 : this.teacherSpeed === 'fast' ? 0.65 : 1);
    const steps = Math.max(words, 4);
    const step = totalMs / steps;
    let i = 0;
    const iv = setInterval(() => {
      if (this.stopRequested) { clearInterval(iv); resolve(); return; }
      i++;
      const p = Math.min(1, i / steps);
      const charIdx = Math.min(text.length, Math.floor(p * text.length));
      this.progressCallbacks.forEach((cb) => cb(p, text.substring(0, charIdx)));
      if (i >= steps) { clearInterval(iv); resolve(); }
    }, step);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ── Controls ───────────────────────────────────────────────────
  stop(): void {
    this.stopRequested = true;
    this.isPlaying = false;
    this.isPaused = false;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  pause(): void {
    if (!this.isPaused) {
      this.isPaused = true;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.pause();
      }
    }
  }

  resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.resume();
      }
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) this.stop();
  }

  setLanguageMode(mode: LanguageMode): void { this.languageMode = mode; }
  setTeacherSpeed(speed: 'slow' | 'normal' | 'fast'): void { this.teacherSpeed = speed; }
  getIsPlaying(): boolean { return this.isPlaying; }
  getIsMuted(): boolean { return this.isMuted; }

  onProgress(cb: ProgressCallback): () => void {
    this.progressCallbacks.push(cb);
    return () => { this.progressCallbacks = this.progressCallbacks.filter((c) => c !== cb); };
  }
  onComplete(cb: () => void): () => void {
    this.completeCallbacks.push(cb);
    return () => { this.completeCallbacks = this.completeCallbacks.filter((c) => c !== cb); };
  }
}
