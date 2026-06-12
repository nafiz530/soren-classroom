import type {
  LessonPlan,
  TeachingIntent,
  ClassNumber,
  TeacherPersona,
  TeachingMode,
} from '@/types';

// ---- Fallback lesson (only when API is completely unavailable) ----

function createFallbackLesson(
  query: string,
  classNumber: ClassNumber,
  subject: string,
  subjectLabel: string,
  teacherPersona: TeacherPersona,
  teachingMode: TeachingMode
): LessonPlan {
  const safeQuery = query || 'General Topic';

  const intents: TeachingIntent[] = [
    {
      intent: 'introduce',
      content: {
        speech: `Welcome everyone! Today we're going to learn about ${safeQuery}. This is a very important topic for your Class ${classNumber} ${subjectLabel} — you'll see this in your NCTB textbook and board exams! Let's begin.`,
        speechBn: `সবাইকে স্বাগতম! আজকে আমরা ${safeQuery} নিয়ে পড়বো। এটি তোমাদের ক্লাস ${classNumber} ${subjectLabel}-এর জন্য খুবই গুরুত্বপূর্ণ — NCTB টেক্সটবুকেও এটা আছে! চলো শুরু করি।`,
        board: { type: 'definition', text: `Topic: ${safeQuery}`, textBn: `বিষয়: ${safeQuery}` },
      },
      priority: 'high',
      actions: ['speak', 'board_write'],
    },
    {
      intent: 'explain_concept',
      content: {
        speech: `Now listen carefully. The core concept of ${safeQuery} is something you encounter every day in Bangladesh. Think about it — when you go to the bazar, or when you ride a rickshaw, this concept is working behind the scenes!`,
        speechBn: `এবার মনোযোগ দিয়ে শোনো। ${safeQuery}-এর মূল ধারণাটা তোমরা প্রতিদিন অনুভব করো। ভাবো তো — বাজারে যাওয়ার সময়, রিকশায় চড়ার সময়, এই concept কাজ করছে behind the scenes!`,
        board: { type: 'concept', text: `Core: ${safeQuery}`, textBn: `মূল ধারণা: ${safeQuery}` },
      },
      priority: 'high',
      actions: ['speak', 'board_write'],
    },
    {
      intent: 'provide_example',
      content: {
        speech: `Let me give you a practical example from our daily life. In ${subjectLabel}, we see ${safeQuery} applied in many places around us — from the tea stalls of Sylhet to the shipyards of Chittagong.`,
        speechBn: `একটা practical example দিই তোমাদের। ${subjectLabel}-এ আমরা ${safeQuery}-এর প্রয়োগ অনেক জায়গায় দেখতে পাই — সিলেটের চা বাগান থেকে চট্টগ্রামের শিপইয়ার্ড পর্যন্ত।`,
        board: { type: 'example', text: `Example: ${safeQuery}`, textBn: `উদাহরণ: ${safeQuery}` },
      },
      priority: 'medium',
      actions: ['speak', 'board_write'],
    },
    {
      intent: 'quiz_student',
      content: {
        speech: `Okay class, now let's check if you understood! I have a question for you about ${safeQuery}. Think carefully before answering — remember what we just discussed.`,
        speechBn: `ঠিক আছে class, এবার দেখি তোমরা বুঝেছো কিনা! ${safeQuery} সম্পর্কে একটা প্রশ্ন আছে। ভালো করে ভেবে answer দিও — মনে আছে তো আমরা এইমাত্র কী শিখলাম?`,
        board: { type: 'definition', text: `Quiz Time!`, textBn: `কুইজ টাইম!` },
      },
      priority: 'high',
      actions: ['speak', 'board_write', 'quiz'],
      quiz: {
        questionText: {
          en: `Which of the following best describes ${safeQuery}?`,
          bn: `নিচের কোনটি ${safeQuery}-কে সবচেয়ে ভালোভাবে বর্ণনা করে?`,
        },
        choices: [
          { id: 'a', label: 'A', text: { en: 'A fundamental concept in this subject', bn: 'এই বিষয়ের একটি মৌলিক ধারণা' } },
          { id: 'b', label: 'B', text: { en: 'A type of calculation method', bn: 'এক ধরনের গণনা পদ্ধতি' } },
          { id: 'c', label: 'C', text: { en: 'A historical event', bn: 'একটি ঐতিহাসিক ঘটনা' } },
          { id: 'd', label: 'D', text: { en: 'A laboratory experiment', bn: 'একটি ল্যাবরেটরি পরীক্ষা' } },
        ],
        correctAnswer: 'a',
        explanation: {
          en: `${safeQuery} is a fundamental concept in ${subjectLabel} that you'll find throughout your NCTB textbook.`,
          bn: `${safeQuery} হলো ${subjectLabel}-এর একটি মৌলিক ধারণা — তোমাদের NCTB টেক্সটবুকে এটা বারবার আসবে।`,
        },
      },
    },
    {
      intent: 'recap',
      content: {
        speech: `বাহ, খুব ভালো! Let's quickly recap what we learned about ${safeQuery}. We covered the definition, the core concept, and saw real-life examples from Bangladesh. Remember, this is important for your board exams!`,
        speechBn: `বাহ, চমৎকার! চলো দ্রুত recap করি — ${safeQuery} সম্পর্কে আমরা কী শিখলাম। Definition, মূল ধারণা, আর Bangladesh-এর real-life examples দেখলাম। মনে রাখবে, board exam-এ এটা important!`,
        board: { type: 'recap', text: `Recap: ${safeQuery}`, textBn: `সারসংক্ষেপ: ${safeQuery}` },
      },
      priority: 'high',
      actions: ['speak', 'board_write'],
    },
  ];

  return {
    lesson_id: crypto.randomUUID(),
    title: `${safeQuery} — Class ${classNumber} ${subjectLabel}`,
    lang: 'bn+en',
    classNumber,
    subject,
    subjectLabel,
    teacher_persona: teacherPersona,
    teaching_mode: teachingMode,
    intents,
    created_at: new Date().toISOString(),
  };
}

function getTeachingMode(subject: string): TeachingMode {
  const modeMap: Record<string, TeachingMode> = {
    math: 'math', higher_math: 'math',
    science: 'science', physics: 'science', chemistry: 'science', biology: 'science',
    english: 'english', bangla: 'bangla', ict: 'ict',
  };
  return modeMap[subject] || 'general';
}

// ---- Call our server-side API route for lesson generation ----

async function callLessonAPI(
  endpoint: string,
  payload: {
    query: string;
    classNumber: ClassNumber;
    subject: string;
    subjectLabel: string;
    teacher_persona: TeacherPersona;
    teaching_mode: TeachingMode;
    context?: string;
  }
): Promise<{
  lesson: LessonPlan;
  tokens: { input_tokens: number; output_tokens: number; total_tokens: number };
} | null> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[LessonService] API ${endpoint} error:`, response.status, err);
      return null;
    }

    const data = await response.json();

    if (!data.lesson || !data.lesson.intents || data.lesson.intents.length === 0) {
      console.error(`[LessonService] API ${endpoint} returned invalid lesson`);
      return null;
    }

    return {
      lesson: data.lesson,
      tokens: data.tokens || { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    };
  } catch (err) {
    console.error(`[LessonService] API ${endpoint} fetch failed:`, err);
    return null;
  }
}

// ---- Public API ----

export interface LessonResult {
  lesson: LessonPlan;
  tokens: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    session_id: string;
    timestamp: string;
  };
}

export async function generateLesson(params: {
  classroom_id: string;
  query: string;
  classNumber: ClassNumber;
  subject: string;
  subjectLabel: string;
  teacher_persona: TeacherPersona;
  context?: string;
}): Promise<LessonResult> {
  const { classroom_id, query, classNumber, subject, subjectLabel, teacher_persona, context = '' } = params;
  const teachingMode = getTeachingMode(subject);

  // Call our server-side API
  const apiResult = await callLessonAPI('/api/lesson', {
    query,
    classNumber,
    subject,
    subjectLabel,
    teacher_persona: teacher_persona || 'friendly_teacher',
    teaching_mode: teachingMode,
    context,
  });

  // Use API result or fallback
  const lesson = apiResult?.lesson ?? createFallbackLesson(query, classNumber, subject, subjectLabel, teacher_persona || 'friendly_teacher', teachingMode);
  const tokenUsage = apiResult?.tokens ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 };

  return {
    lesson,
    tokens: { ...tokenUsage, session_id: classroom_id, timestamp: new Date().toISOString() },
  };
}

export async function generateFollowUp(params: {
  classroom_id: string;
  query: string;
  classNumber: ClassNumber;
  subject: string;
  subjectLabel: string;
  teacher_persona: TeacherPersona;
  context?: string;
}): Promise<LessonResult> {
  const { classroom_id, query, classNumber, subject, subjectLabel, teacher_persona, context = '' } = params;
  const teachingMode = getTeachingMode(subject);

  // Call our server-side follow-up API
  const apiResult = await callLessonAPI('/api/followup', {
    query,
    classNumber,
    subject,
    subjectLabel,
    teacher_persona: teacher_persona || 'friendly_teacher',
    teaching_mode: teachingMode,
    context,
  });

  let lesson: LessonPlan;
  const tokenUsage = apiResult?.tokens ?? { input_tokens: 0, output_tokens: 0, total_tokens: 0 };

  if (apiResult) {
    lesson = apiResult.lesson;
  } else {
    // Shorter fallback for follow-up
    const fallback = createFallbackLesson(query, classNumber, subject, subjectLabel, teacher_persona || 'friendly_teacher', teachingMode);
    lesson = { ...fallback, intents: fallback.intents.slice(0, 3) };
  }

  return {
    lesson,
    tokens: { ...tokenUsage, session_id: classroom_id, timestamp: new Date().toISOString() },
  };
}
