import { TimelineEngine } from './TimelineEngine';
import { AudioEngine } from './AudioEngine';
import type { TimelineEvent, RenderIntensity } from '@/types';

export class SyncEngine {
  private timelineEngine: TimelineEngine;
  private audioEngine: AudioEngine;
  private renderSettings: RenderIntensity;
  private onCanvasEvent: ((event: TimelineEvent) => void) | null = null;
  private voiceQueue: string[] = [];
  private isProcessingVoice: boolean = false;

  constructor(renderSettings: RenderIntensity) {
    this.timelineEngine = new TimelineEngine();
    this.audioEngine = new AudioEngine();
    this.renderSettings = renderSettings;

    // Register event handlers
    this.timelineEngine.on('voice', this.handleVoiceEvent);
    this.timelineEngine.on('board_write', this.handleBoardEvent);
    this.timelineEngine.on('board_erase', this.handleBoardEvent);
    this.timelineEngine.on('board_clear', this.handleBoardEvent);
    this.timelineEngine.on('highlight', this.handleBoardEvent);
    this.timelineEngine.on('zoom', this.handleBoardEvent);
    this.timelineEngine.on('diagram', this.handleBoardEvent);
    this.timelineEngine.on('pause', this.handlePauseEvent);
    this.timelineEngine.on('input_prompt', this.handleBoardEvent);
  }

  /**
   * Set the callback for canvas rendering events
   */
  setCanvasEventHandler(handler: (event: TimelineEvent) => void) {
    this.onCanvasEvent = handler;
  }

  /**
   * Update render settings when mode changes
   */
  updateRenderSettings(settings: RenderIntensity) {
    this.renderSettings = settings;
  }

  /**
   * Load a timeline
   */
  loadTimeline(timeline: any) {
    this.timelineEngine.loadTimeline(timeline);
  }

  /**
   * Start playback
   */
  play() {
    this.timelineEngine.play();
  }

  /**
   * Pause playback
   */
  pause() {
    this.timelineEngine.pause();
    this.audioEngine.pause();
  }

  /**
   * Stop playback
   */
  stop() {
    this.timelineEngine.stop();
    this.audioEngine.stop();
  }

  /**
   * Seek to position
   */
  seek(time: number) {
    this.timelineEngine.seek(time);
    this.audioEngine.stop();
  }

  /**
   * Handle voice events - queue and play TTS
   */
  private handleVoiceEvent = (event: TimelineEvent) => {
    if (event.voiceText) {
      this.voiceQueue.push(event.voiceText);
      this.processVoiceQueue();
    }
  };

  private async processVoiceQueue() {
    if (this.isProcessingVoice || this.voiceQueue.length === 0) return;
    this.isProcessingVoice = true;

    while (this.voiceQueue.length > 0) {
      const text = this.voiceQueue.shift()!;
      await this.audioEngine.speak(text);
    }

    this.isProcessingVoice = false;
  }

  /**
   * Handle board/canvas events
   */
  private handleBoardEvent = (event: TimelineEvent) => {
    if (this.onCanvasEvent) {
      this.onCanvasEvent(event);
    }
  };

  /**
   * Handle pause events in the timeline
   */
  private handlePauseEvent = (event: TimelineEvent) => {
    if (event.duration && event.duration > 0) {
      // The timeline engine handles timing, this is for dramatic pauses
    }
  };

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.timelineEngine.getCurrentTime();
  }

  /**
   * Get total duration
   */
  getTotalDuration(): number {
    return this.timelineEngine.getTotalDuration();
  }

  /**
   * Check if playing
   */
  isPlaying(): boolean {
    return this.timelineEngine.getIsRunning();
  }

  /**
   * Clean up
   */
  destroy() {
    this.timelineEngine.destroy();
    this.audioEngine.destroy();
  }
}
