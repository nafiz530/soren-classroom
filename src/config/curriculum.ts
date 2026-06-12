import type { ClassNumber, Stream, TeacherPersona, TeachingMode } from '@/types';

export interface SubjectOption {
  value: string;
  label: string;
  labelBn: string;
  icon: string;
  mode: TeachingMode;
}

export interface ClassConfig {
  classNumber: ClassNumber;
  streams?: Stream[];
  subjects: SubjectOption[];
}

const COMMON_SUBJECTS: SubjectOption[] = [
  { value: 'math', label: 'Mathematics', labelBn: 'গণিত', icon: '📐', mode: 'math' },
  { value: 'science', label: 'Science', labelBn: 'বিজ্ঞান', icon: '🔬', mode: 'science' },
  { value: 'english', label: 'English For Today', labelBn: 'ইংরেজি', icon: '📖', mode: 'english' },
  { value: 'bangla', label: 'Bangla', labelBn: 'বাংলা', icon: '📝', mode: 'bangla' },
  { value: 'ict', label: 'ICT', labelBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', icon: '💻', mode: 'ict' },
  { value: 'bgs', label: 'BGS', labelBn: 'বাংলাদেশ ও বিশ্বপরিচয়', icon: '🌍', mode: 'general' },
  { value: 'islam', label: 'Islam', labelBn: 'ইসলাম ও নৈতিক শিক্ষা', icon: '☪️', mode: 'general' },
];

const SCIENCE_SUBJECTS: SubjectOption[] = [
  { value: 'physics', label: 'Physics', labelBn: 'পদার্থবিজ্ঞান', icon: '⚛️', mode: 'science' },
  { value: 'chemistry', label: 'Chemistry', labelBn: 'রসায়ন', icon: '🧪', mode: 'science' },
  { value: 'biology', label: 'Biology', labelBn: 'জীববিজ্ঞান', icon: '🧬', mode: 'science' },
  { value: 'higher_math', label: 'Higher Math', labelBn: 'উচ্চতর গণিত', icon: '📊', mode: 'math' },
  { value: 'english', label: 'English', labelBn: 'ইংরেজি', icon: '📖', mode: 'english' },
  { value: 'bangla', label: 'Bangla', labelBn: 'বাংলা', icon: '📝', mode: 'bangla' },
  { value: 'ict', label: 'ICT', labelBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', icon: '💻', mode: 'ict' },
];

const ARTS_SUBJECTS: SubjectOption[] = [
  { value: 'history', label: 'History', labelBn: 'ইতিহাস', icon: '📜', mode: 'general' },
  { value: 'geography', label: 'Geography', labelBn: 'ভূগোল', icon: '🗺️', mode: 'general' },
  { value: 'economics', label: 'Economics', labelBn: 'অর্থনীতি', icon: '💰', mode: 'general' },
  { value: 'political_science', label: 'Political Science', labelBn: 'পৌরনীতি', icon: '🏛️', mode: 'general' },
  { value: 'english', label: 'English', labelBn: 'ইংরেজি', icon: '📖', mode: 'english' },
  { value: 'bangla', label: 'Bangla', labelBn: 'বাংলা', icon: '📝', mode: 'bangla' },
  { value: 'ict', label: 'ICT', labelBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', icon: '💻', mode: 'ict' },
];

const COMMERCE_SUBJECTS: SubjectOption[] = [
  { value: 'accounting', label: 'Accounting', labelBn: 'হিসাববিজ্ঞান', icon: '📒', mode: 'general' },
  { value: 'business_org', label: 'Business Organization', labelBn: 'ব্যবসায় সংগঠন', icon: '🏢', mode: 'general' },
  { value: 'economics', label: 'Economics', labelBn: 'অর্থনীতি', icon: '💰', mode: 'general' },
  { value: 'english', label: 'English', labelBn: 'ইংরেজি', icon: '📖', mode: 'english' },
  { value: 'bangla', label: 'Bangla', labelBn: 'বাংলা', icon: '📝', mode: 'bangla' },
  { value: 'ict', label: 'ICT', labelBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', icon: '💻', mode: 'ict' },
];

export const CURRICULUM: ClassConfig[] = [
  { classNumber: 6, subjects: COMMON_SUBJECTS },
  { classNumber: 7, subjects: COMMON_SUBJECTS },
  { classNumber: 8, subjects: COMMON_SUBJECTS },
  {
    classNumber: 9,
    streams: ['Science', 'Arts', 'Commerce'],
    subjects: SCIENCE_SUBJECTS, // Default, overridden by stream
  },
  {
    classNumber: 10,
    streams: ['Science', 'Arts', 'Commerce'],
    subjects: SCIENCE_SUBJECTS,
  },
];

export function getSubjectsForClass(classNumber: ClassNumber, stream?: Stream): SubjectOption[] {
  if ((classNumber === 9 || classNumber === 10) && stream) {
    switch (stream) {
      case 'Science':
        return SCIENCE_SUBJECTS;
      case 'Arts':
        return ARTS_SUBJECTS;
      case 'Commerce':
        return COMMERCE_SUBJECTS;
    }
  }

  const config = CURRICULUM.find((c) => c.classNumber === classNumber);
  return config?.subjects || COMMON_SUBJECTS;
}

export function getSubjectOption(classNumber: ClassNumber, subject: string, stream?: Stream): SubjectOption | undefined {
  const subjects = getSubjectsForClass(classNumber, stream);
  return subjects.find((s) => s.value === subject);
}

export const TEACHER_PERSONAS: { value: TeacherPersona; label: string; labelBn: string; icon: string }[] = [
  { value: 'friendly_teacher', label: 'Friendly Teacher', labelBn: 'বন্ধুত্বপূর্ণ শিক্ষক', icon: '😊' },
  { value: 'strict_teacher', label: 'Strict Teacher', labelBn: 'কঠোর শিক্ষক', icon: '👨‍🏫' },
  { value: 'exam_coach', label: 'Exam Coach', labelBn: 'পরীক্ষা কোচ', icon: '🎯' },
  { value: 'slow_explainer', label: 'Slow Explainer', labelBn: 'ধীর ব্যাখ্যাকারী', icon: '🐢' },
  { value: 'bilingual_first', label: 'Bilingual First', labelBn: 'দ্বিভাষিক', icon: '🌐' },
];

export const CLASS_OPTIONS: ClassNumber[] = [6, 7, 8, 9, 10];
export const STREAM_OPTIONS: Stream[] = ['Science', 'Arts', 'Commerce'];
