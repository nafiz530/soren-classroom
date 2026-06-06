export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
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
        speech: `Let me explain the core concept of ${safeQuery}. Understanding this is essential for your ${subjectLabel} studies. The key idea is that ${safeQuery} involves fundamental principles that build upon each other.`,
        speechBn: `আসুন ${safeQuery} এর মূল ধারণাটি ব্যাখ্যা করি। এটি বোঝা আপনার ${subjectLabel} পড়াশোনার জন্য অপরিহার্য। মূল ধারণাটি হলো ${safeQuery} এমন মৌলিক নীতিগুলো জড়িত যা একে অপরের উপর নির্মিত।`,
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
      intent: 'explain_concept',
      content: {
        speech: `Now let's dive deeper. The first important aspect is the definition. ${safeQuery} can be defined as a systematic approach to understanding this field of study. Remember, definitions form the foundation.`,
        speechBn: `এখন আমরা গভীরভাবে দেখি। প্রথম গুরুত্বপূর্ণ দিকটি হলো সংজ্ঞা। ${safeQuery} কে এই অধ্যয়ন ক্ষেত্র বোঝার একটি পদ্ধতিগত পদ্ধতি হিসাবে সংজ্ঞায়িত করা যেতে পারে। মনে রাখবেন, সংজ্ঞাগুলো ভিত্তি তৈরি করে।`,
        board: {
          type: 'definition',
          text: `Definition: ${safeQuery} is a key concept`,
          textBn: `সংজ্ঞা: ${safeQuery} একটি মূল ধারণা`,
        },
      },
      priority: 'medium',
      actions: ['speak', 'board_write'],
    },
    {
      intent: 'provide_example',
      content: {
        speech: `Let me give you a practical example to make this clearer. Imagine you encounter ${safeQuery} in your daily life. For instance, in ${subjectLabel}, we see applications of this everywhere.`,
        speechBn: `এটি আরও পরিষ্কার করতে আমি আপনাকে একটি ব্যবহারিক উদাহরণ দিই। কল্পনা করুন আপনি দৈনন্দিন জীবনে ${safeQuery} এর সম্মুখীন হন। উদাহরণস্বরূপ, ${subjectLabel} এ আমরা এর প্রয়োগ সর্বত্র দেখতে পাই।`,
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
      intent: 'explain_concept',
      content: {
        speech: `Now let's look at some important properties and characteristics. These are the things you need to remember for your exams. Pay close attention to each point.`,
        speechBn: `এখন আসুন কিছু গুরুত্বপূর্ণ বৈশিষ্ট্য ও বৈশেষ্ট্য দেখি। এগুলো আপনাকে পরীক্ষার জন্য মনে রাখতে হবে। প্রতিটি পয়েন্টে মনোযোগ দিন।`,
        board: {
          type: 'concept',
          text: `Key Properties & Characteristics`,
          textBn: `মূল বৈশিষ্ট্য ও বৈশেষ্ট্য`,
        },
      },
      priority: 'high',
      actions: ['speak', 'board_write'],
    },
    {
      intent: 'provide_example',
      content: {
        speech: `Here's another example that shows how this works in a different context. This will help you understand the versatility of ${safeQuery}.`,
        speechBn: `এখানে আরেকটি উদাহরণ যা দেখায় এটি কীভাবে ভিন্ন প্রসঙ্গে কাজ করে। এটি আপনাকে ${safeQuery} এর বহুমুখিতা বুঝতে সাহায্য করবে।`,
        board: {
          type: 'example',
          text: `Another Example of ${safeQuery}`,
          textBn: `${safeQuery} এর আরেকটি উদাহরণ`,
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
          en: `${safeQuery} is a fundamental concept that forms the basis of understanding in this area of ${subjectLabel}.`,
          bn: `${safeQuery} হলো একটি মৌলিক ধারণা যা ${subjectLabel} এর এই ক্ষেত্রে বোঝার ভিত্তি তৈরি করে।`,
        },
      },
    },
    {
      intent: 'recap',
      content: {
        speech: `Excellent! Let's recap what we've learned about ${safeQuery}. We covered the definition, key concepts, and saw practical examples. Remember these points for your studies!`,
        speechBn: `চমৎকার! আসুন ${safeQuery} সম্পর্কে আমরা যা শিখেছি তার সারসংক্ষেপ করি। আমরা সংজ্ঞা, মূল ধারণাগুলো আলোচনা করেছি এবং ব্যবহারিক উদাহরণ দেখেছি। আপনার পড়াশোনার জন্য এই পয়েন্টগুলো মনে রাখবেন!`,
        board: {
          type: 'recap',
          text: `Recap: ${safeQuery} - Definition, Concepts, Examples`,
          textBn: `সারসংক্ষেপ: ${safeQuery} - সংজ্ঞা, ধারণা, উদাহরণ`,
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

// ---- AI Lesson Generation ----

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

    const modelName = process.env.MODEL_NAME || undefined;

    const result = await zai.chat.completions.create({
      ...(modelName && { model: modelName }),
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
      console.error('[API] Failed to parse AI response as JSON');
      return null;
    }

    // Validate and fill defaults
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
    console.error('[API] AI generation failed:', err);
    return null;
  }
}

// ---- POST: Generate new lesson ----

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      classroom_id,
      query,
      classNumber,
      subject,
      subjectLabel,
      teacher_persona,
      context,
    } = body as {
      classroom_id: string;
      query: string;
      classNumber: ClassNumber;
      subject: string;
      subjectLabel: string;
      teacher_persona: TeacherPersona;
      context?: string;
    };

    if (!query || !classNumber || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: query, classNumber, subject' },
        { status: 400 }
      );
    }

    const teachingMode = getTeachingMode(subject);

    // Try AI generation first
    const aiResult = await generateLessonWithAI(
      query,
      classNumber,
      subject,
      subjectLabel,
      teacher_persona || 'friendly_teacher',
      context || ''
    );

    let lesson: LessonPlan;
    let tokenUsage = { input: 0, output: 0, total: 0 };

    if (aiResult) {
      lesson = aiResult.lesson;
      tokenUsage = aiResult.tokens;
    } else {
      // Fallback to static lesson
      lesson = createFallbackLesson(
        query,
        classNumber,
        subject,
        subjectLabel,
        teacher_persona || 'friendly_teacher',
        teachingMode
      );
    }

    const response = NextResponse.json(lesson);

    // Add token usage header
    response.headers.set(
      'X-Token-Usage',
      JSON.stringify({
        input_tokens: tokenUsage.input,
        output_tokens: tokenUsage.output,
        total_tokens: tokenUsage.total,
        session_id: classroom_id,
        timestamp: new Date().toISOString(),
      })
    );

    return response;
  } catch (err) {
    console.error('[API] Lesson generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate lesson' },
      { status: 500 }
    );
  }
}

// ---- PUT: Generate follow-up ----

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      classroom_id,
      query,
      classNumber,
      subject,
      subjectLabel,
      teacher_persona,
      context,
    } = body as {
      classroom_id: string;
      query: string;
      classNumber: ClassNumber;
      subject: string;
      subjectLabel: string;
      teacher_persona: TeacherPersona;
      context?: string;
    };

    if (!query || !classNumber || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: query, classNumber, subject' },
        { status: 400 }
      );
    }

    const teachingMode = getTeachingMode(subject);

    // Try AI generation for follow-up (shorter)
    const aiResult = await generateLessonWithAI(
      query,
      classNumber,
      subject,
      subjectLabel,
      teacher_persona || 'friendly_teacher',
      context || ''
    );

    let lesson: LessonPlan;
    let tokenUsage = { input: 0, output: 0, total: 0 };

    if (aiResult) {
      lesson = aiResult.lesson;
      tokenUsage = aiResult.tokens;
    } else {
      // Fallback: create a shorter follow-up (2-4 intents)
      const fallback = createFallbackLesson(
        query,
        classNumber,
        subject,
        subjectLabel,
        teacher_persona || 'friendly_teacher',
        teachingMode
      );
      lesson = {
        ...fallback,
        intents: fallback.intents.slice(0, 3),
      };
    }

    const response = NextResponse.json(lesson);

    response.headers.set(
      'X-Token-Usage',
      JSON.stringify({
        input_tokens: tokenUsage.input,
        output_tokens: tokenUsage.output,
        total_tokens: tokenUsage.total,
        session_id: classroom_id,
        timestamp: new Date().toISOString(),
      })
    );

    return response;
  } catch (err) {
    console.error('[API] Follow-up generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate follow-up' },
      { status: 500 }
    );
  }
}
