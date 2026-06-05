// ============================================================
// Core Types for class.sorenchat.com
// AI-Powered Teaching Experience System
// Bangladesh Curriculum (Class 6-10)
// ============================================================

// ---- Bangladesh Curriculum ----
export type ClassNumber = 6 | 7 | 8 | 9 | 10;
export type Stream = 'Science' | 'Arts' | 'Commerce';
export type SubjectId = string;

export interface SubjectOption {
  id: string;
  icon: string;
  label: string;
}

export interface ClassConfig {
  label: string;
  order: number;
  hasStreams: boolean;
}

// ---- Performance Modes ----
export type PerformanceMode = 'auto' | 'low' | 'standard' | 'smooth' | 'ultra';

export type RenderIntensity = {
  animationSmoothing: boolean;
  handwritingStrokeSpeed: number;
  highlightEffects: boolean;
  zoomTransitions: boolean;
  particleEffects: boolean;
  shadowEffects: boolean;
  maxCanvasResolution: number;
  targetFPS: number;
};

// ---- Timeline System ----
export interface TimelineEvent {
  t: number;
  type: 'voice' | 'board_write' | 'board_erase' | 'board_clear' | 'highlight' | 'zoom' | 'pause' | 'input_prompt' | 'mode_switch' | 'emoji_react' | 'diagram';
  content?: string;
  target?: string;
  voiceText?: string;
  voiceUrl?: string;
  position?: { x: number; y: number };
  strokeData?: StrokeData[];
  diagramData?: DiagramData;
  color?: string;
  fontSize?: number;
  duration?: number;
  zoomLevel?: number;
  zoomTarget?: { x: number; y: number; w: number; h: number };
}

export interface StrokeData {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  pressure?: number;
}

export interface DiagramData {
  type: 'arrow' | 'circle' | 'rect' | 'line' | 'curve' | 'triangle';
  points: { x: number; y: number }[];
  color: string;
  width: number;
  fill?: string;
  label?: string;
  labelPosition?: { x: number; y: number };
}

export interface LessonTimeline {
  lesson_id: string;
  mode: PerformanceMode;
  classNumber: ClassNumber;
  stream?: Stream;
  subject: SubjectId;
  subjectLabel: string;
  title: string;
  events: TimelineEvent[];
  totalDuration: number;
  created_at: string;
}

// ---- Classroom ----
export type ClassroomStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface Classroom {
  id: string;
  name: string;
  classNumber: ClassNumber;
  stream?: Stream;
  subject: SubjectId;
  subjectLabel: string;
  subjectIcon: string;
  status: ClassroomStatus;
  created_at: string;
  updated_at: string;
  last_session_summary?: string;
  progress?: number;
  sessions_count: number;
  current_lesson_id?: string;
}

export interface CreateClassroomRequest {
  classNumber: ClassNumber;
  stream?: Stream;
  subject: SubjectId;
  subjectLabel: string;
  subjectIcon: string;
  name?: string;
  mode_preset?: PerformanceMode;
}

export interface CreateClassroomResponse {
  classroom_id: string;
  name: string;
}

// ---- Session / History ----
export interface SessionLog {
  session_id: string;
  classroom_id: string;
  started_at: string;
  ended_at: string;
  timeline: LessonTimeline;
  summary: string;
}

export interface HistoryEntry {
  id: string;
  classroom_id: string;
  classroom_name: string;
  subject: SubjectId;
  subjectLabel: string;
  subjectIcon: string;
  classNumber: ClassNumber;
  stream?: Stream;
  started_at: string;
  duration: number;
  summary: string;
  events_count: number;
}

// ---- Playback State ----
export interface PlaybackState {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';
  currentTime: number;
  totalDuration: number;
  currentEventIndex: number;
  isLoading: boolean;
  error?: string;
}

// ---- Device Profile ----
export interface DeviceProfile {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  gpuTier: 'low' | 'medium' | 'high';
  memoryTier: 'low' | 'medium' | 'high';
  detectedMode: PerformanceMode;
  screenResolution: { width: number; height: number };
  pixelRatio: number;
  supportsWebAudio: boolean;
  supportsOffscreenCanvas: boolean;
}
