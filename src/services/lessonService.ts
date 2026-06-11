import ZAI from 'z-ai-web-dev-sdk';
import type {
  LessonPlan,
  TeachingIntent,
  ClassNumber,
  TeacherPersona,
  TeachingMode,
} from '@/types';

// ---- Fallback lesson plans (when AI is unavailable) ----

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
        speech: `Hello! Today we are going to learn about ${safeQuery}. This is an important topic for Class ${classNumber} ${subjectLabel}. Let's begin!`,
        speechBn: `হ্যালো! আজ আমরা ${safeQuery} সম্পর্কে শিখবো। এটি ক্লাস ${classNumber} ${subjectLabel} এর জন্য একটি গুরুত্বপূর্ণ বিষয়। চলুন শুরু করি!`,
        board: {
          type: 'definition',
          text: `Topic: ${safeQuery}`,
          textBn: `বিষয়: ${safeQuery}`,
        },
      },
      priority: 'high',
      actions: ['speak', 'board_write'],
    },
    {
      intent: 'explain_concept',
      content: {
        speech: `Let me explain the core concept of ${safeQuery}. Understanding this is essential for your ${subjectLabel} studies.`,
        speechBn: `আসুন ${safeQuery} এর মূল ধারণাটি ব্যাখ্যা করি। এটি বোঝা আপনার ${subjectLabel} পড়াশোনার জন্য অপরিহার্য।`,
        board: {
          type: 'concept',
          text: `Core Concept of ${safeQuery}`,
          textBn: `${safeQuery} এর মূল ধারণা`,
        },
      },
      priority: 'high',
      actions: ['speak', 'board_write'],
    },
    {
      intent: 'provide_example',
      content: {
        speech: `Let me give you a practical example. In ${subjectLabel}, we see applications of ${safeQuery} everywhere.`,
        speechBn: `একটি ব্যবহারিক উদাহরণ দিই। ${subjectLabel} এ আমরা ${safeQuery} এর প্রয়োগ সর্বত্র দেখতে পাই।`,
        board: {
          type: 'example',
          text: `Example: ${safeQuery} in practice`,
          textBn: `উদাহরণ: ব্যবহারিক ${safeQuery}`,
        },
      },
      priority: 'medium',
      actions: ['speak', 'board_write'],
    },
    {
      intent: 'quiz_student',
      content: {
        speech: `Now let's test your understanding! I have a question for you about ${safeQuery}.`,
        speechBn: `এখন আসুন আপনার বোঝাপড়া পরীক্ষা করি! ${safeQuery} সম্পর্কে আমার একটি প্রশ্ন আছে।`,
        board: {
          type: 'definition',
          text: `Quiz Time!`,
          textBn: `কুইজ টাইম!`,
        },
      },
      priority: 'high',
      actions: ['speak', 'board_write', 'quiz'],
      quiz: {
        questionText: {
          en: `Which of the following best describes ${safeQuery}?`,
          bn: `নিচের কোনটি ${safeQuery} কে সবচেয়ে ভালোভাবে বর্ণনা করে?`,
        },
        choices: [
          { id: 'a', label: 'A', text: { en: 'A fundamental concept in this subject', bn: 'এই বিষয়ে একটি মৌলিক ধারণা' } },
          { id: 'b', label: 'B', text: { en: 'A type of calculation method', bn: 'এক ধরনের গণনা পদ্ধতি' } },
          { id: 'c', label: 'C', text: { en: 'A historical event', bn: 'একটি ঐতিহাসিক ঘটনা' } },
          { id: 'd', label: 'D', text: { en: 'A laboratory experiment', bn: 'একটি ল্যাবরেটরি পরীক্ষা' } },
        ],
        correctAnswer: 'a',
        explanation: {
          en: `${safeQuery} is a fundamental concept in ${subjectLabel}.`,
          bn: `${safeQuery} হলো ${subjectLabel} এর একটি মৌলিক ধারণা।`,
        },
      },
    },
    {
      intent: 'recap',
      content: {
        speech: `Excellent! Let's recap what we've learned about ${safeQuery}. We covered the definition, key concepts, and saw practical examples!`,
        speechBn: `চমৎকার! ${safeQuery} সম্পর্কে আমরা যা শিখেছি তার সারসংক্ষেপ করি। আমরা সংজ্ঞা, মূল ধারণাগুলো এবং উদাহরণ দেখেছি!`,
        board: {
          type: 'recap',
          text: `Recap: ${safeQuery}`,
          textBn: `সারসংক্ষেপ: ${safeQuery}`,
        },
      },
      priority: 'high',
      actions: ['speak', 'board_write'],
    },
  ];

  return {
    lesson_id: crypto.randomUUID(),
    title: `${safeQuery} - Class ${classNumber} ${subjectLabel}`,
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

// ---- System Prompt ----

const SYSTEM_PROMPT = `You are an AI Teacher Engine for the Bangladesh National Curriculum. You generate teaching INTENT blocks, NOT timestamps. The runtime engine (FlowController) will handle timing, pacing, and flow control.

Output a valid JSON object with this exact structure:
{
  "lesson_id": "unique-id",
  "title": "Lesson Title",
  "lang": "bn+en",
  "classNumber": 6,
  "subject": "math",
  "subjectLabel": "Mathematics",
  "teacher_persona": "friendly_teacher",
  "teaching_mode": "math",
  "intents": [...],
  "created_at": "ISO date"
}

Each intent must follow this format:
{
  "intent": "introduce|explain_concept|provide_example|quiz_student|recap|transition|interact",
  "content": {
    "speech": "English speech text",
    "speechBn": "Bengali speech text",
    "board": {
      "type": "definition|concept|example|diagram|recap|formula|table|graph",
      "text": "Short English text (max 60 chars)",
      "textBn": "Short Bengali text (max 60 chars)",
      "formulaText": "LaTeX formula (if applicable)"
    }
  },
  "priority": "critical|high|medium|low",
  "actions": ["speak", "board_write"],
  "quiz": null
}

For quiz_student intents, include a quiz object:
{
  "quiz": {
    "questionText": { "en": "Question in English", "bn": "প্রশ্ন বাংলায়" },
    "choices": [
      { "id": "a", "label": "A", "text": { "en": "Choice A", "bn": "বিকল্প ক" } },
      { "id": "b", "label": "B", "text": { "en": "Choice B", "bn": "বিকল্প খ" } },
      { "id": "c", "label": "C", "text": { "en": "Choice C", "bn": "বিকল্প গ" } },
      { "id": "d", "label": "D", "text": { "en": "Choice D", "bn": "বিকল্প ঘ" } }
    ],
    "correctAnswer": "a",
    "explanation": { "en": "Explanation", "bn": "ব্যাখ্যা" }
  }
}

RULES:
- NEVER include timestamps or timing information
- Generate 8-15 intents per lesson
- Follow flow: introduce → explain_concept → provide_example → quiz_student → recap
- Include bilingual content (en + bn) in ALL intents
- Board content must be SHORT (max 60 chars per line)
- For math subjects, include formulaText with LaTeX
- Make content appropriate for the specified class level (Bangladesh curriculum)
- Speech should be conversational and engaging
- Quiz questions should test understanding, not memorization
- The teacher_persona affects tone: friendly=encouraging, strict=formal, exam_coach=test-focused, slow_explainer=step-by-step, bilingual_first=more Bengali`;

function getTeachingMode(subject: string): TeachingMode {
  const modeMap: Record<string, TeachingMode> = {
    math: 'math',
    higher_math: 'math',
    science: 'science',
    physics: 'science',
    chemistry: 'science',
    biology: 'science',
    english: 'english',
    bangla: 'bangla',
    ict: 'ict',
  };
  return modeMap[subject] || 'general';
}

async function generateLessonWithAI(
  query: string,
  classNumber: ClassNumber,
  subject: string,
  subjectLabel: string,
  teacherPersona: TeacherPersona,
  context: string
): Promise<{ lesson: LessonPlan; tokens: { input: number; output: number; total: number } } | null> {
  try {
    const zai = await ZAI.create();
    const teachingMode = getTeachingMode(subject);

    const userMessage = context
      ? `Generate a lesson about "${query}" for Class ${classNumber} ${subjectLabel}.\n\nPrevious context: ${context}\n\nTeacher persona: ${teacherPersona}\nTeaching mode: ${teachingMode}`
      : `Generate a lesson about "${query}" for Class ${classNumber} ${subjectLabel}.\n\nTeacher persona: ${teacherPersona}\nTeaching mode: ${teachingMode}`;

    const result = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });

    const content = result.choices?.[0]?.message?.content;
    if (!content) return null;

    let parsed: LessonPlan;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('[LessonService] Failed to parse AI response as JSON');
      return null;
    }

    if (!parsed.intents || !Array.isArray(parsed.intents) || parsed.intents.length === 0) {
      return null;
    }

    const lesson: LessonPlan = {
      lesson_id: parsed.lesson_id || crypto.randomUUID(),
      title: parsed.title || `${query} - Class ${classNumber}`,
      lang: parsed.lang || 'bn+en',
      classNumber,
      subject,
      subjectLabel,
      teacher_persona: teacherPersona,
      teaching_mode: teachingMode,
      intents: parsed.intents,
      created_at: new Date().toISOString(),
    };

    const tokens = {
      input: result.usage?.prompt_tokens || 0,
      output: result.usage?.completion_tokens || 0,
      total: result.usage?.total_tokens || 0,
    };

    return { lesson, tokens };
  } catch (err) {
    console.error('[LessonService] AI generation failed:', err);
    return null;
  }
}

export interface LessonResult {
  lesson: LessonPlan;
  tokens: { input_tokens: number; output_tokens: number; total_tokens: number; session_id: string; timestamp: string };
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

  const aiResult = await generateLessonWithAI(
    query, classNumber, subject, subjectLabel,
    teacher_persona || 'friendly_teacher', context
  );

  let lesson: LessonPlan;
  let tokenUsage = { input: 0, output: 0, total: 0 };

  if (aiResult) {
    lesson = aiResult.lesson;
    tokenUsage = aiResult.tokens;
  } else {
    lesson = createFallbackLesson(
      query, classNumber, subject, subjectLabel,
      teacher_persona || 'friendly_teacher', teachingMode
    );
  }

  return {
    lesson,
    tokens: {
      input_tokens: tokenUsage.input,
      output_tokens: tokenUsage.output,
      total_tokens: tokenUsage.total,
      session_id: classroom_id,
      timestamp: new Date().toISOString(),
    },
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

  const aiResult = await generateLessonWithAI(
    query, classNumber, subject, subjectLabel,
    teacher_persona || 'friendly_teacher', context
  );

  let lesson: LessonPlan;
  let tokenUsage = { input: 0, output: 0, total: 0 };

  if (aiResult) {
    lesson = aiResult.lesson;
    tokenUsage = aiResult.tokens;
  } else {
    const fallback = createFallbackLesson(
      query, classNumber, subject, subjectLabel,
      teacher_persona || 'friendly_teacher', teachingMode
    );
    lesson = { ...fallback, intents: fallback.intents.slice(0, 3) };
  }

  return {
    lesson,
    tokens: {
      input_tokens: tokenUsage.input,
      output_tokens: tokenUsage.output,
      total_tokens: tokenUsage.total,
      session_id: classroom_id,
      timestamp: new Date().toISOString(),
    },
  };
}
