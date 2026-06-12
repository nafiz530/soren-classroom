// ---- Core New Types ----

export type ClassNumber = 6 | 7 | 8 | 9 | 10;
export type Stream = 'Science' | 'Arts' | 'Commerce';
export type LanguageMode = 'en' | 'bn' | 'both';
export type LocalizedText = { en: string; bn: string };

// Teaching Intent Graph (TIG) - AI outputs intent, NOT timestamps
export type TeachingIntentType =
  | 'introduce'
  | 'explain_concept'
  | 'provide_example'
  | 'quiz_student'
  | 'recap'
  | 'transition'
  | 'interact';

export type BoardZone = 'top-left' | 'center-left' | 'center' | 'right' | 'bottom' | 'center-large';

export type BoardContentType = 'definition' | 'concept' | 'example' | 'diagram' | 'recap' | 'formula' | 'table' | 'graph';

export type TeachingPriority = 'critical' | 'high' | 'medium' | 'low';

export interface BoardBlock {
  id: string;
  type: BoardContentType;
  zone: BoardZone;
  importance: TeachingPriority;
  persist: boolean;
  lifespan: 'lesson' | 'section' | 'temporary';
  text: string;
  localizedText?: LocalizedText;
  color?: string;
  fontSize?: number;
  formulaText?: string;
  chalkLines?: string[];
  chalkColor?: 'white' | 'yellow' | 'cyan' | 'green' | 'pink';
  tableData?: { headers: string[]; rows: string[][] };
  graphData?: { type: 'bar' | 'line'; title?: string; labels: string[]; datasets: { values: number[]; color?: string }[] };
  diagramData?: Record<string, unknown>;
  createdAt: number;
}

export interface TeachingIntent {
  intent: TeachingIntentType;
  content: {
    speech: string;
    speechBn?: string;
    board?: {
      type: BoardContentType;
      text: string;
      textBn?: string;
      chalkLines?: string[];
      chalkColor?: 'white' | 'yellow' | 'cyan' | 'green' | 'pink';
      formulaText?: string;
      tableData?: { headers: string[]; rows: string[][] };
      graphData?: { type: 'bar' | 'line'; title?: string; labels: string[]; datasets: { values: number[]; color?: string }[] };
      diagramData?: Record<string, unknown>;
    };
  };
  priority: TeachingPriority;
  actions: ('speak' | 'board_write' | 'board_highlight' | 'quiz')[];
  quiz?: {
    questionText: LocalizedText;
    choices: { id: string; label: string; text: LocalizedText }[];
    correctAnswer: string;
    explanation: LocalizedText;
  };
}

export interface LessonPlan {
  lesson_id: string;
  title: string;
  lang: 'en' | 'bn' | 'bn+en';
  classNumber: ClassNumber;
  stream?: Stream;
  subject: string;
  subjectLabel: string;
  teacher_persona: TeacherPersona;
  teaching_mode: TeachingMode;
  intents: TeachingIntent[];
  created_at: string;
}

// Flow State
export type FlowPhase = 'idle' | 'loading' | 'introducing' | 'explaining' | 'exampling' | 'quizzing' | 'recapping' | 'completed' | 'error';

export interface FlowState {
  phase: FlowPhase;
  currentIntentIndex: number;
  isSpeaking: boolean;
  isWriting: boolean;
  speechProgress: number;
  boardBlocks: BoardBlock[];
  elapsedTime: number;
}

// Pacing
export type PacingSpeed = 'slow' | 'continuous' | 'medium' | 'interactive_pause';

export interface PacingProfile {
  concept: PacingSpeed;
  explanation: PacingSpeed;
  example: PacingSpeed;
  recap: PacingSpeed;
  quiz: PacingSpeed;
}

// Token Tracking
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  session_id: string;
  timestamp: string;
}

export interface TokenSessionSummary {
  lessons: TokenUsage[];
  cumulative_input: number;
  cumulative_output: number;
  cumulative_total: number;
}

// Teacher Persona & Teaching Mode
export type TeacherPersona = 'strict_teacher' | 'friendly_teacher' | 'exam_coach' | 'slow_explainer' | 'bilingual_first';
export type TeachingMode = 'math' | 'science' | 'english' | 'bangla' | 'ict' | 'general';
export type PerformanceMode = 'auto' | 'low' | 'standard' | 'smooth' | 'ultra';

// Classroom
export type ClassroomStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface Classroom {
  id: string;
  name: string;
  classNumber: ClassNumber;
  stream?: Stream;
  subject: string;
  subjectLabel: string;
  subjectIcon: string;
  status: ClassroomStatus;
  created_at: string;
  updated_at: string;
  last_session_summary?: string;
  progress?: number;
  sessions_count: number;
  current_lesson_id?: string;
  teacher_persona?: TeacherPersona;
}

export interface CreateClassroomRequest {
  classNumber: ClassNumber;
  stream?: Stream;
  subject: string;
  subjectLabel: string;
  subjectIcon: string;
  name?: string;
  mode_preset?: PerformanceMode;
  teacher_persona?: TeacherPersona;
}

// Quiz Types
export interface QuizChoice {
  id: string;
  label: string;
  text: LocalizedText;
}

// Progress
export interface QuizAnswer {
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timestamp: string;
  classroom_id: string;
  subject: string;
}

export interface SubjectProgress {
  subject: string;
  subjectLabel: string;
  topicsLearned: number;
  timeSpentSeconds: number;
  quizScore: number;
  quizTotal: number;
  weakAreas: string[];
}

export interface StudentProgress {
  totalTopicsLearned: number;
  totalTimeSpentSeconds: number;
  subjects: SubjectProgress[];
  recentQuizAnswers: QuizAnswer[];
  lastUpdated: string;
}

// Session for persistence
export interface SavedSession {
  phase: FlowPhase;
  currentIntentIndex: number;
  classroom_id: string;
  lessonPlan: LessonPlan;
  boardBlocks: BoardBlock[];
  saved_at: string;
  elapsedTime: number;
}

// History
export interface HistoryEntry {
  id: string;
  classroom_id: string;
  classroom_name: string;
  subject: string;
  subjectLabel: string;
  subjectIcon: string;
  classNumber: ClassNumber;
  stream?: Stream;
  started_at: string;
  duration: number;
  summary: string;
  events_count: number;
}
