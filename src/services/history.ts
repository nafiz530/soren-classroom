import type { HistoryEntry, SessionLog, LessonTimeline } from '@/types';

// Demo history data for Bangladesh curriculum
const DEMO_HISTORY: HistoryEntry[] = [
  {
    id: 'hist-1',
    classroom_id: 'demo-science-9-1',
    classroom_name: 'Class 9 Science — Physics',
    subject: 'Physics',
    subjectLabel: 'Physics',
    subjectIcon: '⚛️',
    classNumber: 9,
    stream: 'Science',
    started_at: new Date(Date.now() - 3600000).toISOString(),
    duration: 2400,
    summary: 'Explored Newton\'s First Law with animated force diagrams, inertia demonstrations, and real-world examples on the interactive board.',
    events_count: 42,
  },
  {
    id: 'hist-2',
    classroom_id: 'demo-science-9-1',
    classroom_name: 'Class 9 Science — Physics',
    subject: 'Physics',
    subjectLabel: 'Physics',
    subjectIcon: '⚛️',
    classNumber: 9,
    stream: 'Science',
    started_at: new Date(Date.now() - 86400000).toISOString(),
    duration: 1800,
    summary: 'Covered Newton\'s Second Law: F = ma with interactive formula derivation and numerical problem solving.',
    events_count: 35,
  },
  {
    id: 'hist-3',
    classroom_id: 'demo-math-8-1',
    classroom_name: 'Class 8 — Math',
    subject: 'Math',
    subjectLabel: 'Math',
    subjectIcon: '🔢',
    classNumber: 8,
    started_at: new Date(Date.now() - 43200000).toISOString(),
    duration: 3000,
    summary: 'Factoring trinomials with visual step-by-step board demonstrations, completing the square techniques.',
    events_count: 56,
  },
  {
    id: 'hist-4',
    classroom_id: 'demo-english-7-1',
    classroom_name: 'Class 7 — English',
    subject: 'English',
    subjectLabel: 'English',
    subjectIcon: '🇬🇧',
    classNumber: 7,
    started_at: new Date(Date.now() - 259200000).toISOString(),
    duration: 3600,
    summary: 'Grammar rules and composition practice with visual examples on the board.',
    events_count: 68,
  },
  {
    id: 'hist-5',
    classroom_id: 'demo-accounting-10-1',
    classroom_name: 'Class 10 Commerce — Accounting',
    subject: 'Accounting',
    subjectLabel: 'Accounting',
    subjectIcon: '📊',
    classNumber: 10,
    stream: 'Commerce',
    started_at: new Date(Date.now() - 864000000).toISOString(),
    duration: 4200,
    summary: 'Journal entries and ledger accounts with step-by-step board demonstrations.',
    events_count: 82,
  },
];

let useDemo = true;

export async function fetchHistory(classroomId?: string): Promise<HistoryEntry[]> {
  if (useDemo) {
    if (classroomId) {
      return DEMO_HISTORY.filter((h) => h.classroom_id === classroomId);
    }
    return DEMO_HISTORY;
  }
  return DEMO_HISTORY;
}

export async function fetchSessionLogs(
  sessionId: string
): Promise<SessionLog | null> {
  const demoTimeline: LessonTimeline = {
    lesson_id: sessionId,
    mode: 'standard',
    classNumber: 9,
    stream: 'Science',
    subject: 'Physics',
    subjectLabel: 'Physics',
    title: 'Replay Session',
    events: [
      { t: 0, type: 'voice', voiceText: 'Welcome back to our physics lesson!' },
      { t: 0.5, type: 'board_write', content: "Newton's Laws of Motion", position: { x: 50, y: 30 }, color: '#1a1a1a', fontSize: 28 },
      { t: 3, type: 'board_write', content: '1st Law: An object at rest stays at rest', position: { x: 50, y: 80 }, color: '#333333', fontSize: 20 },
      { t: 7, type: 'board_write', content: 'F = ma', position: { x: 50, y: 140 }, color: '#dc2626', fontSize: 36 },
      { t: 10, type: 'highlight', target: 'formula', content: 'F = ma' },
      { t: 12, type: 'voice', voiceText: 'This is the fundamental equation of classical mechanics.' },
      { t: 14, type: 'diagram', diagramData: { type: 'arrow', points: [{ x: 200, y: 200 }, { x: 350, y: 200 }], color: '#2563eb', width: 3, label: 'Force (F)', labelPosition: { x: 275, y: 225 } } },
      { t: 18, type: 'voice', voiceText: 'Let\'s work through an example problem together.' },
    ],
    totalDuration: 20,
    created_at: new Date().toISOString(),
  };

  return {
    session_id: sessionId,
    classroom_id: DEMO_HISTORY[0].classroom_id,
    started_at: new Date(Date.now() - 3600000).toISOString(),
    ended_at: new Date(Date.now() - 3600000 + 20000).toISOString(),
    timeline: demoTimeline,
    summary: 'Replay of Physics session',
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hrs}h ${remainingMins}m`;
}

export function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString();
}
