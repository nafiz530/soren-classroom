import type { ClassNumber, Stream, SubjectOption } from '@/types';

// ============================================================
// Bangladesh Curriculum Configuration
// Class 6-10 with streams for 9-10
// ============================================================

export interface ClassConfig {
  label: string;
  order: number;
  hasStreams: boolean;
}

export const CLASS_CONFIG: Record<ClassNumber, ClassConfig> = {
  6: { label: 'Class 6', order: 1, hasStreams: false },
  7: { label: 'Class 7', order: 2, hasStreams: false },
  8: { label: 'Class 8', order: 3, hasStreams: false },
  9: { label: 'Class 9', order: 4, hasStreams: true },
  10: { label: 'Class 10', order: 5, hasStreams: true },
};

// Subjects for Class 6
const CLASS_6_SUBJECTS: SubjectOption[] = [
  { id: 'Anandopath', icon: '📖', label: 'Anandopath' },
  { id: 'Arbi', icon: '🕌', label: 'Arbi' },
  { id: 'Arts_and_Crafts', icon: '🎨', label: 'Arts & Crafts' },
  { id: 'Bangla 2nd', icon: '📝', label: 'Bangla 2nd' },
  { id: 'Bangladesh & Global Studies', icon: '🌏', label: 'Bangladesh & Global Studies' },
  { id: 'Charupath', icon: '📚', label: 'Charupath' },
  { id: 'English', icon: '🇬🇧', label: 'English' },
  { id: 'English_Grammar', icon: '✏️', label: 'English Grammar' },
  { id: 'Hindu', icon: '🪔', label: 'Hindu' },
  { id: 'Home_Science', icon: '🏠', label: 'Home Science' },
  { id: 'ICT', icon: '💻', label: 'ICT' },
  { id: 'Islam', icon: '☪️', label: 'Islam' },
  { id: 'Kormo_o_Jibon', icon: '💼', label: 'Kormo o Jibon' },
  { id: 'Krishi', icon: '🌾', label: 'Krishi' },
  { id: 'Math', icon: '🔢', label: 'Math' },
  { id: 'Science', icon: '🔬', label: 'Science' },
  { id: 'Sharirik_Sikha', icon: '🏃', label: 'Sharirik Sikha' },
  { id: 'Songskrito', icon: '📜', label: 'Songskrito' },
  { id: 'Curious', icon: '✨', label: 'Curious' },
];

// Subjects for Class 7
const CLASS_7_SUBJECTS: SubjectOption[] = [
  { id: 'Anandapatha', icon: '📖', label: 'Anandapatha' },
  { id: 'Arbi', icon: '🕌', label: 'Arbi' },
  { id: 'Arts_and_Crafts', icon: '🎨', label: 'Arts & Crafts' },
  { id: 'Bangla', icon: '🇧🇩', label: 'Bangla' },
  { id: 'Bangla_Bekoron', icon: '📝', label: 'Bangla Bekoron' },
  { id: 'BGS', icon: '🌐', label: 'BGS' },
  { id: 'English', icon: '🇬🇧', label: 'English' },
  { id: 'English_Grammar', icon: '✏️', label: 'English Grammar' },
  { id: 'Hindu', icon: '🪔', label: 'Hindu' },
  { id: 'Home_Science', icon: '🏠', label: 'Home Science' },
  { id: 'ICT', icon: '💻', label: 'ICT' },
  { id: 'Islam', icon: '☪️', label: 'Islam' },
  { id: 'Kormo_o_Jibon', icon: '💼', label: 'Kormo o Jibon' },
  { id: 'Krishi', icon: '🌾', label: 'Krishi' },
  { id: 'Math', icon: '🔢', label: 'Math' },
  { id: 'Science', icon: '🔬', label: 'Science' },
  { id: 'Sharirik_Sikha', icon: '🏃', label: 'Sharirik Sikha' },
  { id: 'Songskrito', icon: '📜', label: 'Songskrito' },
  { id: 'Curious', icon: '✨', label: 'Curious' },
];

// Subjects for Class 8
const CLASS_8_SUBJECTS: SubjectOption[] = [
  { id: 'Agriculture', icon: '🌾', label: 'Agriculture' },
  { id: 'Anondopath', icon: '📖', label: 'Anondopath' },
  { id: 'Arbi', icon: '🕌', label: 'Arbi' },
  { id: 'Arts_and_Crafts', icon: '🎨', label: 'Arts & Crafts' },
  { id: 'Bangla_Bekoron', icon: '📝', label: 'Bangla Bekoron' },
  { id: 'BGS', icon: '🌐', label: 'BGS' },
  { id: 'English', icon: '🇬🇧', label: 'English' },
  { id: 'English_Grammar', icon: '✏️', label: 'English Grammar' },
  { id: 'Hindu', icon: '🪔', label: 'Hindu' },
  { id: 'Home_Science', icon: '🏠', label: 'Home Science' },
  { id: 'ICT', icon: '💻', label: 'ICT' },
  { id: 'Islam', icon: '☪️', label: 'Islam' },
  { id: 'Kormo_o_Jibon', icon: '💼', label: 'Kormo o Jibon' },
  { id: 'Math', icon: '🔢', label: 'Math' },
  { id: 'Physical_Education', icon: '🏃', label: 'Physical Education' },
  { id: 'Sahitto_Konika', icon: '📚', label: 'Sahitto Konika' },
  { id: 'Science', icon: '🔬', label: 'Science' },
  { id: 'Songskrito', icon: '📜', label: 'Songskrito' },
  { id: 'Curious', icon: '✨', label: 'Curious' },
];

// Stream-based subjects for Class 9-10
const STREAM_SUBJECTS: Record<Stream, SubjectOption[]> = {
  Science: [
    { id: 'Bangla Literature', icon: '📚', label: 'Bangla Literature' },
    { id: 'Bangla Grammar', icon: '📝', label: 'Bangla Grammar' },
    { id: 'Bangla Supplementary', icon: '📗', label: 'Bangla Supplementary' },
    { id: 'English For Today', icon: '🇬🇧', label: 'English For Today' },
    { id: 'English Grammar and Composition', icon: '✏️', label: 'English Grammar and Composition' },
    { id: 'Mathematics', icon: '📐', label: 'Mathematics' },
    { id: 'Physics', icon: '⚛️', label: 'Physics' },
    { id: 'Chemistry', icon: '🧪', label: 'Chemistry' },
    { id: 'Biology', icon: '🧬', label: 'Biology' },
    { id: 'Higher Mathematics', icon: '📐', label: 'Higher Mathematics' },
    { id: 'Bangladesh & Global Studies', icon: '🌏', label: 'Bangladesh & Global Studies' },
    { id: 'ICT', icon: '💻', label: 'ICT' },
    { id: 'Physical Education', icon: '🏃', label: 'Physical Education' },
    { id: 'Career Education', icon: '🎯', label: 'Career Education' },
    { id: 'Art and Craft', icon: '🎨', label: 'Arts & Crafts' },
    { id: 'Agriculture', icon: '🌾', label: 'Agriculture' },
    { id: 'Home Science', icon: '🏠', label: 'Home Science' },
    { id: 'Curious', icon: '✨', label: 'Curious' },
  ],
  Arts: [
    { id: 'Bangla Literature', icon: '📚', label: 'Bangla Literature' },
    { id: 'Bangla Grammar', icon: '📝', label: 'Bangla Grammar' },
    { id: 'Bangla Supplementary', icon: '📗', label: 'Bangla Supplementary' },
    { id: 'English For Today', icon: '🇬🇧', label: 'English For Today' },
    { id: 'English Grammar and Composition', icon: '✏️', label: 'English Grammar and Composition' },
    { id: 'Mathematics', icon: '📐', label: 'Mathematics' },
    { id: 'Bangladesh & Global Studies', icon: '🌏', label: 'Bangladesh & Global Studies' },
    { id: 'History', icon: '🏛️', label: 'History' },
    { id: 'Geography', icon: '🗺️', label: 'Geography' },
    { id: 'Civics', icon: '⚖️', label: 'Civics' },
    { id: 'Economics', icon: '💹', label: 'Economics' },
    { id: 'Science', icon: '🔬', label: 'Science' },
    { id: 'ICT', icon: '💻', label: 'ICT' },
    { id: 'Physical Education', icon: '🏃', label: 'Physical Education' },
    { id: 'Career Education', icon: '🎯', label: 'Career Education' },
    { id: 'Art and Craft', icon: '🎨', label: 'Arts & Crafts' },
    { id: 'Agriculture', icon: '🌾', label: 'Agriculture' },
    { id: 'Home Science', icon: '🏠', label: 'Home Science' },
    { id: 'Curious', icon: '✨', label: 'Curious' },
  ],
  Commerce: [
    { id: 'Bangla Literature', icon: '📚', label: 'Bangla Literature' },
    { id: 'Bangla Grammar', icon: '📝', label: 'Bangla Grammar' },
    { id: 'Bangla Supplementary', icon: '📗', label: 'Bangla Supplementary' },
    { id: 'English For Today', icon: '🇬🇧', label: 'English For Today' },
    { id: 'English Grammar and Composition', icon: '✏️', label: 'English Grammar and Composition' },
    { id: 'Mathematics', icon: '📐', label: 'Mathematics' },
    { id: 'Accounting', icon: '📊', label: 'Accounting' },
    { id: 'Finance and Banking', icon: '🏦', label: 'Finance and Banking' },
    { id: 'Business Entrepreneurship', icon: '💡', label: 'Business Entrepreneurship' },
    { id: 'Science', icon: '🔬', label: 'Science' },
    { id: 'Bangladesh & Global Studies', icon: '🌏', label: 'Bangladesh & Global Studies' },
    { id: 'ICT', icon: '💻', label: 'ICT' },
    { id: 'Physical Education', icon: '🏃', label: 'Physical Education' },
    { id: 'Career Education', icon: '🎯', label: 'Career Education' },
    { id: 'Art and Craft', icon: '🎨', label: 'Arts & Crafts' },
    { id: 'Agriculture', icon: '🌾', label: 'Agriculture' },
    { id: 'Home Science', icon: '🏠', label: 'Home Science' },
    { id: 'Curious', icon: '✨', label: 'Curious' },
  ],
};

// Map: Class number -> Subjects (for 6, 7, 8)
const SUBJECTS_BY_CLASS: Record<6 | 7 | 8, SubjectOption[]> = {
  6: CLASS_6_SUBJECTS,
  7: CLASS_7_SUBJECTS,
  8: CLASS_8_SUBJECTS,
};

// Stream options for class 9-10
export const STREAM_OPTIONS: { value: Stream; icon: string; label: string; color: string }[] = [
  { value: 'Science', icon: '⚛️', label: 'Science', color: 'bg-blue-500' },
  { value: 'Arts', icon: '🎨', label: 'Arts', color: 'bg-purple-500' },
  { value: 'Commerce', icon: '📊', label: 'Commerce', color: 'bg-green-500' },
];

/**
 * Get subjects for a given class and optional stream
 */
export function getSubjectsForClass(classNumber: ClassNumber, stream?: Stream): SubjectOption[] {
  if (classNumber === 9 || classNumber === 10) {
    if (stream && STREAM_SUBJECTS[stream]) {
      return STREAM_SUBJECTS[stream];
    }
    // Default to Science if no stream selected
    return STREAM_SUBJECTS.Science;
  }
  return SUBJECTS_BY_CLASS[classNumber];
}

/**
 * Get subject option by ID for a specific class/stream
 */
export function getSubjectOption(
  subjectId: string,
  classNumber: ClassNumber,
  stream?: Stream
): SubjectOption | undefined {
  const subjects = getSubjectsForClass(classNumber, stream);
  return subjects.find((s) => s.id === subjectId);
}

/**
 * Generate a classroom name from class, stream, and subject
 */
export function generateClassName(
  classNumber: ClassNumber,
  stream: Stream | undefined,
  subjectLabel: string
): string {
  const classLabel = CLASS_CONFIG[classNumber].label;
  if (stream) {
    return `${classLabel} ${stream} — ${subjectLabel}`;
  }
  return `${classLabel} — ${subjectLabel}`;
}
