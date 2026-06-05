import type { Classroom, CreateClassroomRequest } from '@/types';
import { apiService } from './api';
import { CLASS_CONFIG, generateClassName } from '@/config/curriculum';

// Demo data for development - Bangladesh curriculum
const DEMO_CLASSROOMS: Classroom[] = [
  {
    id: 'demo-math-8-1',
    name: 'Class 8 — Math',
    classNumber: 8,
    subject: 'Math',
    subjectLabel: 'Math',
    subjectIcon: '🔢',
    status: 'active',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    last_session_summary: 'Covered algebra fundamentals with step-by-step visual walkthroughs on the board.',
    progress: 35,
    sessions_count: 3,
  },
  {
    id: 'demo-science-9-1',
    name: 'Class 9 Science — Physics',
    classNumber: 9,
    stream: 'Science',
    subject: 'Physics',
    subjectLabel: 'Physics',
    subjectIcon: '⚛️',
    status: 'active',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
    last_session_summary: 'Explored Newton\'s Laws with animated force diagrams and real-world examples on the interactive board.',
    progress: 60,
    sessions_count: 7,
  },
  {
    id: 'demo-english-7-1',
    name: 'Class 7 — English',
    classNumber: 7,
    subject: 'English',
    subjectLabel: 'English',
    subjectIcon: '🇬🇧',
    status: 'paused',
    created_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
    last_session_summary: 'Grammar rules and composition practice with visual examples on the board.',
    progress: 45,
    sessions_count: 5,
  },
  {
    id: 'demo-bgs-6-1',
    name: 'Class 6 — Bangladesh & Global Studies',
    classNumber: 6,
    subject: 'Bangladesh & Global Studies',
    subjectLabel: 'Bangladesh & Global Studies',
    subjectIcon: '🌏',
    status: 'completed',
    created_at: new Date(Date.now() - 1209600000).toISOString(),
    updated_at: new Date(Date.now() - 864000000).toISOString(),
    last_session_summary: 'Completed the geography of Bangladesh unit with interactive map diagrams.',
    progress: 100,
    sessions_count: 12,
  },
  {
    id: 'demo-accounting-10-1',
    name: 'Class 10 Commerce — Accounting',
    classNumber: 10,
    stream: 'Commerce',
    subject: 'Accounting',
    subjectLabel: 'Accounting',
    subjectIcon: '📊',
    status: 'active',
    created_at: new Date(Date.now() - 432000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    last_session_summary: 'Journal entries and ledger accounts with step-by-step board demonstrations.',
    progress: 55,
    sessions_count: 8,
  },
];

let useDemo = true;

export async function fetchClassrooms(): Promise<Classroom[]> {
  if (useDemo) return DEMO_CLASSROOMS;
  try {
    return await apiService.getClassrooms();
  } catch {
    useDemo = true;
    return DEMO_CLASSROOMS;
  }
}

export async function createClassroom(
  data: CreateClassroomRequest
): Promise<{ classroom_id: string; name: string }> {
  if (useDemo) {
    const id = `demo-${data.subject}-${Date.now()}`;
    const name = data.name || generateClassName(data.classNumber, data.stream, data.subjectLabel);
    return {
      classroom_id: id,
      name,
    };
  }
  return apiService.createClassroom(data);
}

export { CLASS_CONFIG, generateClassName };
