import { create } from 'zustand';
import type { TokenUsage, TokenSessionSummary } from '@/types';
import { storage } from '@/services/storage';

interface TokenState {
  showTokens: boolean;
  currentLesson: TokenUsage | null;
  sessionSummary: TokenSessionSummary;
  recordUsage: (usage: TokenUsage) => void;
  setCurrentLesson: (usage: TokenUsage | null) => void;
  loadFromStorage: () => void;
}

export const useTokenStore = create<TokenState>((set) => ({
  showTokens: false,
  currentLesson: null,
  sessionSummary: {
    lessons: [],
    cumulative_input: 0,
    cumulative_output: 0,
    cumulative_total: 0,
  },

  recordUsage: (usage) => {
    storage.recordTokenUsage(usage);
    set((state) => ({
      currentLesson: usage,
      sessionSummary: {
        lessons: [...state.sessionSummary.lessons, usage],
        cumulative_input: state.sessionSummary.cumulative_input + usage.input_tokens,
        cumulative_output: state.sessionSummary.cumulative_output + usage.output_tokens,
        cumulative_total: state.sessionSummary.cumulative_total + usage.total_tokens,
      },
    }));
  },

  setCurrentLesson: (usage) => {
    set({ currentLesson: usage });
  },

  loadFromStorage: () => {
    const showTokens = process.env.NEXT_PUBLIC_TOKEN_SHOW === 'true';
    const summary = storage.getTokenHistory();
    set({ showTokens, sessionSummary: summary });
  },
}));
