import { create } from 'zustand';
import type { FlowPhase, BoardBlock, TeachingIntent, LanguageMode, TeacherPersona } from '@/types';

interface FlowStore {
  // State
  phase: FlowPhase;
  currentIntentIndex: number;
  isSpeaking: boolean;
  isWriting: boolean;
  speechProgress: number;
  speechText: string;
  boardBlocks: BoardBlock[];
  allBoardBlocks: BoardBlock[];  // full session history for notebook
  currentIntent: TeachingIntent | null;
  languageMode: LanguageMode;
  teacherPersona: TeacherPersona;
  teacherSpeed: 'slow' | 'normal' | 'fast';
  isMuted: boolean;
  elapsedTime: number;
  activeQuiz: TeachingIntent['quiz'] | null;

  // Actions
  setPhase: (phase: FlowPhase) => void;
  setCurrentIntentIndex: (index: number) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setIsWriting: (writing: boolean) => void;
  setSpeechProgress: (progress: number, text: string) => void;
  setBoardBlocks: (blocks: BoardBlock[]) => void;
  addToAllBlocks: (newBlocks: BoardBlock[]) => void;
  setCurrentIntent: (intent: TeachingIntent | null) => void;
  setLanguageMode: (mode: LanguageMode) => void;
  setTeacherPersona: (persona: TeacherPersona) => void;
  setTeacherSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  setIsMuted: (muted: boolean) => void;
  setElapsedTime: (time: number) => void;
  setActiveQuiz: (quiz: TeachingIntent['quiz'] | null) => void;
  reset: () => void;
}

const initialState = {
  phase: 'idle' as FlowPhase,
  currentIntentIndex: 0,
  isSpeaking: false,
  isWriting: false,
  speechProgress: 0,
  speechText: '',
  boardBlocks: [] as BoardBlock[],
  allBoardBlocks: [] as BoardBlock[],
  currentIntent: null as TeachingIntent | null,
  languageMode: 'both' as LanguageMode,
  teacherPersona: 'friendly_teacher' as TeacherPersona,
  teacherSpeed: 'normal' as const,
  isMuted: false,
  elapsedTime: 0,
  activeQuiz: null as TeachingIntent['quiz'] | null,
};

export const useFlowStore = create<FlowStore>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setCurrentIntentIndex: (index) => set({ currentIntentIndex: index }),
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setIsWriting: (writing) => set({ isWriting: writing }),
  setSpeechProgress: (progress, text) => set({ speechProgress: progress, speechText: text }),
  setBoardBlocks: (blocks) => set({ boardBlocks: blocks }),
  addToAllBlocks: (newBlocks) => set((s) => ({
    allBoardBlocks: [...s.allBoardBlocks, ...newBlocks.filter(nb => !s.allBoardBlocks.find(b => b.id === nb.id))],
  })),
  setCurrentIntent: (intent) => set({ currentIntent: intent }),
  setLanguageMode: (mode) => set({ languageMode: mode }),
  setTeacherPersona: (persona) => set({ teacherPersona: persona }),
  setTeacherSpeed: (speed) => set({ teacherSpeed: speed }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  setElapsedTime: (time) => set({ elapsedTime: time }),
  setActiveQuiz: (quiz) => set({ activeQuiz: quiz }),
  reset: () => set(initialState),
}));
