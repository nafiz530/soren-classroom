import { create } from 'zustand';
import type { Classroom, ClassroomStatus, ClassNumber, SubjectId } from '@/types';

interface ClassroomState {
  classrooms: Classroom[];
  currentClassroom: Classroom | null;
  isLoading: boolean;
  error: string | null;
  filter: {
    classNumber: ClassNumber | 'all';
    subject: SubjectId | 'all';
    status: ClassroomStatus | 'all';
  };

  // Actions
  setClassrooms: (classrooms: Classroom[]) => void;
  addClassroom: (classroom: Classroom) => void;
  updateClassroom: (id: string, updates: Partial<Classroom>) => void;
  removeClassroom: (id: string) => void;
  setCurrentClassroom: (classroom: Classroom | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: Partial<ClassroomState['filter']>) => void;
}

export const useClassroomStore = create<ClassroomState>((set) => ({
  classrooms: [],
  currentClassroom: null,
  isLoading: false,
  error: null,
  filter: {
    classNumber: 'all',
    subject: 'all',
    status: 'all',
  },

  setClassrooms: (classrooms) => set({ classrooms }),
  addClassroom: (classroom) =>
    set((state) => ({ classrooms: [classroom, ...state.classrooms] })),
  updateClassroom: (id, updates) =>
    set((state) => ({
      classrooms: state.classrooms.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
      currentClassroom:
        state.currentClassroom?.id === id
          ? { ...state.currentClassroom, ...updates }
          : state.currentClassroom,
    })),
  removeClassroom: (id) =>
    set((state) => ({
      classrooms: state.classrooms.filter((c) => c.id !== id),
      currentClassroom:
        state.currentClassroom?.id === id ? null : state.currentClassroom,
    })),
  setCurrentClassroom: (classroom) => set({ currentClassroom: classroom }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFilter: (filter) =>
    set((state) => ({ filter: { ...state.filter, ...filter } })),
}));
