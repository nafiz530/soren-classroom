import { create } from 'zustand';
import type { StudentProgress, SubjectProgress, QuizAnswer } from '@/types';
import { storage } from '@/services/storage';

interface ProgressStore {
  progress: StudentProgress | null;
  loadProgress: () => void;
  recordQuizAnswer: (answer: QuizAnswer) => void;
  incrementTopics: (subject: string, subjectLabel: string) => void;
  addTime: (subject: string, seconds: number) => void;
  addWeakArea: (subject: string, area: string) => void;
}

const DEFAULT_PROGRESS: StudentProgress = {
  totalTopicsLearned: 0,
  totalTimeSpentSeconds: 0,
  subjects: [],
  recentQuizAnswers: [],
  lastUpdated: new Date().toISOString(),
};

export const useProgressStore = create<ProgressStore>((set, get) => ({
  progress: null,

  loadProgress: () => {
    const progress = storage.getProgress() || DEFAULT_PROGRESS;
    set({ progress });
  },

  recordQuizAnswer: (answer) => {
    const progress = get().progress || DEFAULT_PROGRESS;
    const updated: StudentProgress = {
      ...progress,
      recentQuizAnswers: [answer, ...progress.recentQuizAnswers].slice(0, 50),
      lastUpdated: new Date().toISOString(),
    };

    // Update subject quiz scores
    const subjectIdx = updated.subjects.findIndex((s) => s.subject === answer.subject);
    if (subjectIdx !== -1) {
      const sub = updated.subjects[subjectIdx];
      updated.subjects[subjectIdx] = {
        ...sub,
        quizScore: sub.quizScore + (answer.isCorrect ? 1 : 0),
        quizTotal: sub.quizTotal + 1,
      };
    }

    storage.saveProgress(updated);
    set({ progress: updated });
  },

  incrementTopics: (subject, subjectLabel) => {
    const progress = get().progress || DEFAULT_PROGRESS;
    const subjectIdx = progress.subjects.findIndex((s) => s.subject === subject);
    let subjects = [...progress.subjects];

    if (subjectIdx !== -1) {
      subjects[subjectIdx] = {
        ...subjects[subjectIdx],
        topicsLearned: subjects[subjectIdx].topicsLearned + 1,
      };
    } else {
      subjects.push({
        subject,
        subjectLabel,
        topicsLearned: 1,
        timeSpentSeconds: 0,
        quizScore: 0,
        quizTotal: 0,
        weakAreas: [],
      });
    }

    const updated: StudentProgress = {
      ...progress,
      totalTopicsLearned: progress.totalTopicsLearned + 1,
      subjects,
      lastUpdated: new Date().toISOString(),
    };
    storage.saveProgress(updated);
    set({ progress: updated });
  },

  addTime: (subject, seconds) => {
    const progress = get().progress || DEFAULT_PROGRESS;
    const subjectIdx = progress.subjects.findIndex((s) => s.subject === subject);
    let subjects = [...progress.subjects];

    if (subjectIdx !== -1) {
      subjects[subjectIdx] = {
        ...subjects[subjectIdx],
        timeSpentSeconds: subjects[subjectIdx].timeSpentSeconds + seconds,
      };
    } else {
      subjects.push({
        subject,
        subjectLabel: subject,
        topicsLearned: 0,
        timeSpentSeconds: seconds,
        quizScore: 0,
        quizTotal: 0,
        weakAreas: [],
      });
    }

    const updated: StudentProgress = {
      ...progress,
      totalTimeSpentSeconds: progress.totalTimeSpentSeconds + seconds,
      subjects,
      lastUpdated: new Date().toISOString(),
    };
    storage.saveProgress(updated);
    set({ progress: updated });
  },

  addWeakArea: (subject, area) => {
    const progress = get().progress || DEFAULT_PROGRESS;
    const subjectIdx = progress.subjects.findIndex((s) => s.subject === subject);
    if (subjectIdx !== -1) {
      const subjects = [...progress.subjects];
      const weakAreas = [...subjects[subjectIdx].weakAreas];
      if (!weakAreas.includes(area)) {
        weakAreas.push(area);
      }
      subjects[subjectIdx] = { ...subjects[subjectIdx], weakAreas };
      const updated = { ...progress, subjects, lastUpdated: new Date().toISOString() };
      storage.saveProgress(updated);
      set({ progress: updated });
    }
  },
}));
