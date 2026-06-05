import type { TimelineEvent, LessonTimeline } from '@/types';
import { useTimelineStore } from '@/stores/timelineStore';

export type TimelineEventCallback = (event: TimelineEvent, index: number) => void;

export class TimelineEngine {
  private events: TimelineEvent[] = [];
  private currentIndex: number = 0;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private callbacks: Map<string, TimelineEventCallback[]> = new Map();
  private pendingEvents: TimelineEvent[] = [];

  /**
   * Load a timeline and prepare for playback
   */
  loadTimeline(timeline: LessonTimeline) {
    this.stop();
    this.events = timeline.events.sort((a, b) => a.t - b.t);
    this.currentIndex = 0;
    this.pausedAt = 0;
    this.pendingEvents = [];

    useTimelineStore.getState().setTimeline(timeline);
  }

  /**
   * Start or resume playback from the current position
   */
  play() {
    if (this.events.length === 0) return;

    if (!this.isRunning) {
      this.isRunning = true;
      this.startTime = performance.now() - this.pausedAt * 1000;
      useTimelineStore.getState().setPlaybackStatus('playing');
      this.tick();
    }
  }

  /**
   * Pause playback, preserving current position
   */
  pause() {
    if (this.isRunning) {
      this.isRunning = false;
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      const currentTime = (performance.now() - this.startTime) / 1000;
      this.pausedAt = Math.min(currentTime, this.getTotalDuration());
      useTimelineStore.getState().setPlaybackStatus('paused');
    }
  }

  /**
   * Stop playback and reset to the beginning
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.currentIndex = 0;
    this.pausedAt = 0;
    this.pendingEvents = [];
    useTimelineStore.getState().resetPlayback();
  }

  /**
   * Seek to a specific time position
   */
  seek(time: number) {
    const wasRunning = this.isRunning;
    if (wasRunning) {
      this.pause();
    }

    this.pausedAt = Math.max(0, Math.min(time, this.getTotalDuration()));

    // Recalculate current event index
    this.currentIndex = 0;
    for (let i = 0; i < this.events.length; i++) {
      if (this.events[i].t <= this.pausedAt) {
        this.currentIndex = i + 1;
      } else {
        break;
      }
    }

    useTimelineStore.getState().setCurrentTime(this.pausedAt);
    useTimelineStore.getState().setCurrentEventIndex(this.currentIndex);

    if (wasRunning) {
      this.play();
    }
  }

  /**
   * Register a callback for a specific event type
   */
  on(eventType: string, callback: TimelineEventCallback) {
    const existing = this.callbacks.get(eventType) || [];
    existing.push(callback);
    this.callbacks.set(eventType, existing);
  }

  /**
   * Remove a callback for a specific event type
   */
  off(eventType: string, callback: TimelineEventCallback) {
    const existing = this.callbacks.get(eventType);
    if (existing) {
      const filtered = existing.filter((cb) => cb !== callback);
      if (filtered.length === 0) {
        this.callbacks.delete(eventType);
      } else {
        this.callbacks.set(eventType, filtered);
      }
    }
  }

  /**
   * Internal tick loop
   */
  private tick = () => {
    if (!this.isRunning) return;

    const currentTime = (performance.now() - this.startTime) / 1000;

    // Process events that should fire by this time
    while (this.currentIndex < this.events.length && this.events[this.currentIndex].t <= currentTime) {
      const event = this.events[this.currentIndex];
      this.emitEvent(event, this.currentIndex);
      this.currentIndex++;
    }

    // Update time in store
    useTimelineStore.getState().setCurrentTime(currentTime);

    // Check if we've reached the end
    if (currentTime >= this.getTotalDuration()) {
      this.pause();
      useTimelineStore.getState().setPlaybackStatus('completed');
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  /**
   * Emit an event to all registered callbacks
   */
  private emitEvent(event: TimelineEvent, index: number) {
    const callbacks = this.callbacks.get(event.type);
    if (callbacks) {
      callbacks.forEach((cb) => cb(event, index));
    }

    // Also emit to wildcard listeners
    const wildcardCallbacks = this.callbacks.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach((cb) => cb(event, index));
    }
  }

  /**
   * Get the total duration of the timeline
   */
  getTotalDuration(): number {
    if (this.events.length === 0) return 0;
    return Math.max(...this.events.map((e) => e.t)) + 3; // Add 3s buffer after last event
  }

  getCurrentTime(): number {
    if (this.isRunning) {
      return (performance.now() - this.startTime) / 1000;
    }
    return this.pausedAt;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  destroy() {
    this.stop();
    this.callbacks.clear();
  }
}
