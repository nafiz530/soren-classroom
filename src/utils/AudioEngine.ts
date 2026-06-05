export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private speechSynthUtterance: SpeechSynthesisUtterance | null = null;
  private useWebSpeechAPI: boolean = false;

  /**
   * Initialize the audio engine
   */
  async init() {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 1.0;
      this.useWebSpeechAPI = false;
    } catch {
      // Fallback to Web Speech API for TTS
      if ('speechSynthesis' in window) {
        this.useWebSpeechAPI = true;
      }
    }
  }

  /**
   * Speak text using TTS
   */
  async speak(text: string): Promise<void> {
    if (!text || text.trim().length === 0) return;

    // Stop any current speech
    this.stop();

    if (this.useWebSpeechAPI) {
      return this.speakWithWebSpeech(text);
    }

    return this.speakWithWebAudio(text);
  }

  private speakWithWebSpeech(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to select a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
      ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        this.isPlaying = false;
        resolve();
      };

      utterance.onerror = () => {
        this.isPlaying = false;
        resolve();
      };

      this.speechSynthUtterance = utterance;
      this.isPlaying = true;
      window.speechSynthesis.speak(utterance);
    });
  }

  private async speakWithWebAudio(_text: string): Promise<void> {
    // In production, this would fetch TTS audio from the backend and play it
    // For demo, fall back to Web Speech API
    if ('speechSynthesis' in window) {
      this.useWebSpeechAPI = true;
      return this.speakWithWebSpeech(_text);
    }
  }

  /**
   * Play an audio file URL
   */
  async playUrl(url: string): Promise<void> {
    this.stop();

    if (!this.audioContext) {
      await this.init();
    }

    if (!this.audioContext) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.gainNode!);
      this.currentSource.onended = () => {
        this.isPlaying = false;
      };

      this.currentSource.start(0);
      this.isPlaying = true;
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  }

  /**
   * Stop all audio playback
   */
  stop() {
    if (this.speechSynthUtterance && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.speechSynthUtterance = null;
    }

    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Source may have already stopped
      }
      this.currentSource = null;
    }

    this.isPlaying = false;
  }

  /**
   * Pause audio (Web Speech API doesn't truly support pause, so we cancel)
   */
  pause() {
    if (this.speechSynthUtterance && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isPlaying = false;
    }
  }

  /**
   * Resume audio
   */
  async resume() {
    // Web Speech API doesn't support resume well, would need to re-speak
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
