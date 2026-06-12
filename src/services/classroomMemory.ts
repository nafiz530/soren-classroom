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
    // Keep last 30 entries per classroom (increased from 20 for better context)
    all[classroomId] = all[classroomId].slice(0, 30);
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

    const recentTopics = entries.slice(0, 5).map((e) => e.topic).join(', ');

    // Build a richer context showing what was taught and key points
    const teachingPoints = entries.slice(0, 3).flatMap((e) => {
      const keyIntents = e.intents.filter((i) =>
        i.intent === 'introduce' || i.intent === 'explain_concept' || i.intent === 'recap'
      ).slice(0, 2);

      return keyIntents.map((i) => {
        const speech = i.content.speechBn || i.content.speech;
        return `${i.intent}: ${speech.substring(0, 120)}...`;
      });
    }).join('\n');

    return `Previously taught topics: ${recentTopics}\nKey teaching points covered:\n${teachingPoints}\n\nIMPORTANT: Build on what was already taught. Don't repeat the same explanations. Connect new content to previously covered material.`;
  },
};
