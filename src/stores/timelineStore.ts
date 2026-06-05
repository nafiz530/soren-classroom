import { create } from 'zustand';
import type { TimelineEvent, LessonTimeline, PlaybackState } from '@/types';

interface TimelineState {
  timeline: LessonTimeline | null;
  events: TimelineEvent[];
  playback: PlaybackState;
  activeEvents: Set<string>; // IDs of currently active visual events

  // Actions
  setTimeline: (timeline: LessonTimeline) => void;
  clearTimeline: () => void;
  setPlaybackStatus: (status: PlaybackState['status']) => void;
  setCurrentTime: (time: number) => void;
  setCurrentEventIndex: (index: number) => void;
  addActiveEvent: (eventId: string) => void;
  removeActiveEvent: (eventId: string) => void;
  clearActiveEvents: () => void;
  setError: (error: string) => void;
  resetPlayback: () => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  timeline: null,
  events: [],
  playback: {
    status: 'idle',
    currentTime: 0,
    totalDuration: 0,
    currentEventIndex: 0,
    isLoading: false,
  },
  activeEvents: new Set(),

  setTimeline: (timeline) =>
    set({
      timeline,
      events: timeline.events,
      playback: {
        status: 'idle',
        currentTime: 0,
        totalDuration: timeline.totalDuration,
        currentEventIndex: 0,
        isLoading: false,
      },
    }),

  clearTimeline: () =>
    set({
      timeline: null,
      events: [],
      playback: {
        status: 'idle',
        currentTime: 0,
        totalDuration: 0,
        currentEventIndex: 0,
        isLoading: false,
      },
      activeEvents: new Set(),
    }),

  setPlaybackStatus: (status) =>
    set((state) => ({
      playback: { ...state.playback, status, isLoading: status === 'loading' },
    })),

  setCurrentTime: (time) =>
    set((state) => ({
      playback: { ...state.playback, currentTime: time },
    })),

  setCurrentEventIndex: (index) =>
    set((state) => ({
      playback: { ...state.playback, currentEventIndex: index },
    })),

  addActiveEvent: (eventId) =>
    set((state) => {
      const newSet = new Set(state.activeEvents);
      newSet.add(eventId);
      return { activeEvents: newSet };
    }),

  removeActiveEvent: (eventId) =>
    set((state) => {
      const newSet = new Set(state.activeEvents);
      newSet.delete(eventId);
      return { activeEvents: newSet };
    }),

  clearActiveEvents: () => set({ activeEvents: new Set() }),

  setError: (error) =>
    set((state) => ({
      playback: { ...state.playback, status: 'error', error },
    })),

  resetPlayback: () =>
    set((state) => ({
      playback: {
        status: 'idle',
        currentTime: 0,
        totalDuration: state.playback.totalDuration,
        currentEventIndex: 0,
        isLoading: false,
      },
      activeEvents: new Set(),
    })),
}));
