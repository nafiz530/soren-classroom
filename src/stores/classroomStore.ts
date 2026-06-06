import { create } from 'zustand';
import type { Classroom, CreateClassroomRequest, ClassroomStatus } from '@/types';
import { storage } from '@/services/storage';
import { v4 as uuidv4 } from 'uuid';

interface ClassroomStore {
  classrooms: Classroom[];
  activeClassroomId: string | null;
  isLoading: boolean;

  // Actions
  loadClassrooms: () => void;
  createClassroom: (req: CreateClassroomRequest) => Classroom;
  updateClassroom: (id: string, updates: Partial<Classroom>) => void;
  deleteClassroom: (id: string) => void;
  setActiveClassroom: (id: string | null) => void;
  updateClassroomStatus: (id: string, status: ClassroomStatus) => void;
  incrementSessions: (id: string) => void;
  getClassroom: (id: string) => Classroom | undefined;
}

export const useClassroomStore = create<ClassroomStore>((set, get) => ({
  classrooms: [],
  activeClassroomId: null,
  isLoading: false,

  loadClassrooms: () => {
    const classrooms = storage.getClassrooms();
    set({ classrooms });
  },

  createClassroom: (req: CreateClassroomRequest) => {
    const now = new Date().toISOString();
    const classroom: Classroom = {
      id: uuidv4(),
      name: req.name || `${req.subjectLabel} - Class ${req.classNumber}`,
      classNumber: req.classNumber,
      stream: req.stream,
      subject: req.subject,
      subjectLabel: req.subjectLabel,
      subjectIcon: req.subjectIcon,
      status: 'active',
      created_at: now,
      updated_at: now,
      sessions_count: 0,
      teacher_persona: req.teacher_persona,
    };

    storage.saveClassroom(classroom);
    const classrooms = get().classrooms;
    set({ classrooms: [...classrooms, classroom] });
    return classroom;
  },

  updateClassroom: (id, updates) => {
    const classrooms = get().classrooms;
    const idx = classrooms.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const updated = { ...classrooms[idx], ...updates, updated_at: new Date().toISOString() };
      classrooms[idx] = updated;
      storage.saveClassroom(updated);
      set({ classrooms: [...classrooms] });
    }
  },

  deleteClassroom: (id) => {
    storage.deleteClassroom(id);
    const classrooms = get().classrooms.filter((c) => c.id !== id);
    set({ classrooms });
    if (get().activeClassroomId === id) {
      set({ activeClassroomId: null });
    }
  },

  setActiveClassroom: (id) => {
    set({ activeClassroomId: id });
  },

  updateClassroomStatus: (id, status) => {
    get().updateClassroom(id, { status });
  },

  incrementSessions: (id) => {
    const classroom = get().classrooms.find((c) => c.id === id);
    if (classroom) {
      get().updateClassroom(id, { sessions_count: classroom.sessions_count + 1 });
    }
  },

  getClassroom: (id) => {
    return get().classrooms.find((c) => c.id === id);
  },
}));
