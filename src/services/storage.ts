import type {
  Classroom,
  StudentProgress,
  SavedSession,
  TokenUsage,
  TokenSessionSummary,
  HistoryEntry,
} from '@/types';

const KEYS = {
  classrooms: 'soren:classrooms',
  progress: 'soren:progress',
  session: 'soren:session',
  tokens: 'soren:tokens',
  history: 'soren:history',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[Storage] Failed to save ${key}:`, err);
  }
}

export const storage = {
  // ---- Classrooms ----
  getClassrooms(): Classroom[] {
    return safeGet<Classroom[]>(KEYS.classrooms, []);
  },

  saveClassroom(classroom: Classroom): void {
    const classrooms = this.getClassrooms();
    const idx = classrooms.findIndex((c) => c.id === classroom.id);
    if (idx !== -1) {
      classrooms[idx] = classroom;
    } else {
      classrooms.push(classroom);
    }
    safeSet(KEYS.classrooms, classrooms);
  },

  deleteClassroom(id: string): void {
    const classrooms = this.getClassrooms().filter((c) => c.id !== id);
    safeSet(KEYS.classrooms, classrooms);
  },

  getClassroom(id: string): Classroom | undefined {
    return this.getClassrooms().find((c) => c.id === id);
  },

  // ---- Progress ----
  getProgress(): StudentProgress | null {
    return safeGet<StudentProgress | null>(KEYS.progress, null);
  },

  saveProgress(progress: StudentProgress): void {
    safeSet(KEYS.progress, progress);
  },

  // ---- Session ----
  getSession(): SavedSession | null {
    return safeGet<SavedSession | null>(KEYS.session, null);
  },

  saveSession(session: SavedSession): void {
    safeSet(KEYS.session, session);
  },

  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(KEYS.session);
    }
  },

  // ---- Tokens ----
  getTokenHistory(): TokenSessionSummary {
    return safeGet<TokenSessionSummary>(KEYS.tokens, {
      lessons: [],
      cumulative_input: 0,
      cumulative_output: 0,
      cumulative_total: 0,
    });
  },

  recordTokenUsage(usage: TokenUsage): void {
    const summary = this.getTokenHistory();
    summary.lessons.push(usage);
    summary.cumulative_input += usage.input_tokens;
    summary.cumulative_output += usage.output_tokens;
    summary.cumulative_total += usage.total_tokens;
    safeSet(KEYS.tokens, summary);
  },

  // ---- History ----
  getHistory(classroomId?: string): HistoryEntry[] {
    const all = safeGet<HistoryEntry[]>(KEYS.history, []);
    if (classroomId) {
      return all.filter((h) => h.classroom_id === classroomId);
    }
    return all;
  },

  saveHistoryEntry(entry: HistoryEntry): void {
    const history = this.getHistory();
    history.unshift(entry);
    safeSet(KEYS.history, history.slice(0, 100)); // Keep last 100 entries
  },
};
