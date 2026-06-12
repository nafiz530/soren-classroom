import type { Classroom, LessonPlan, TeachingIntent, TeachingIntentType, BoardContentType, TeacherPersona } from '@/types';

interface MemoryEntry {
  topic: string;
  intents: TeachingIntent[];
  timestamp: string;
}

const MEMORY_KEY = 'soren:classroom-memory';

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
    console.error(`[ClassroomMemory] Failed to save ${key}:`, err);
  }
}

export const classroomMemory = {
  getMemory(classroomId: string): MemoryEntry[] {
    const all = safeGet<Record<string, MemoryEntry[]>>(MEMORY_KEY, {});
    return all[classroomId] || [];
  },

  addEntry(classroomId: string, topic: string, lessonPlan: LessonPlan): void {
    const all = safeGet<Record<string, MemoryEntry[]>>(MEMORY_KEY, {});
    if (!all[classroomId]) {
      all[classroomId] = [];
    }
    all[classroomId].unshift({
      topic,
      intents: lessonPlan.intents.map((i) => ({
        ...i,
        content: { ...i.content },
      })),
      timestamp: new Date().toISOString(),
    });
    // Keep last 20 entries per classroom
    all[classroomId] = all[classroomId].slice(0, 20);
    safeSet(MEMORY_KEY, all);
  },

  getRecentTopics(classroomId: string, limit = 5): string[] {
    const entries = this.getMemory(classroomId);
    return entries.slice(0, limit).map((e) => e.topic);
  },

  getTopicCount(classroomId: string): number {
    return this.getMemory(classroomId).length;
  },

  clearMemory(classroomId: string): void {
    const all = safeGet<Record<string, MemoryEntry[]>>(MEMORY_KEY, {});
    delete all[classroomId];
    safeSet(MEMORY_KEY, all);
  },

  buildContextForPrompt(classroomId: string): string {
    const entries = this.getMemory(classroomId);
    if (entries.length === 0) return '';

    const recentTopics = entries.slice(0, 3).map((e) => e.topic).join(', ');
    const pastIntents = entries.slice(0, 2).flatMap((e) =>
      e.intents.slice(0, 3).map((i) => `${i.intent}: ${i.content.speech.substring(0, 80)}...`)
    ).join('\n');

    return `Previous topics covered: ${recentTopics}\nRecent teaching points:\n${pastIntents}`;
  },
};
