import type {
  LessonPlan,
  TeachingIntent,
  ClassNumber,
  TeacherPersona,
  TeachingMode,
} from '@/types';

// ---- Fallback lesson (when AI is unavailable) ----

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
        speech: `আচ্ছা বলো তো, ${safeQuery} নিয়ে কি কখনো ভেবেছো? আজকে আমরা এটা একসাথে বুঝবো। Class ${classNumber} ${subjectLabel} এর জন্য এটা খুব জরুরি।`,
        speechBn: `আচ্ছা বলো তো, ${safeQuery} নিয়ে কি কখনো ভেবেছো? আজকে আমরা এটা একসাথে বুঝবো। Class ${classNumber} ${subjectLabel} এর জন্য এটা খুব জরুরি।`,
        board: {
          type: 'definition',
          text: `Topic: ${safeQuery}`,
          textBn: `আজকের বিষয়: ${safeQuery}`,
          chalkLines: [`📌 ${safeQuery}`, `Class ${classNumber} — ${subjectLabel}`],
          chalkColor: 'yellow',
        },
      },
      priority: 'high',
      actions: ['speak', 'board_write'],
    },
    {
      intent: 'explain_concept',
      content: {
        speech: `দেখো, ${safeQuery} বুঝতে হলে আমাদের একটু গভীরে যেতে হবে। কিন্তু ভয় নেই — আমি ধাপে ধাপে বলবো।`,
        speechBn: `দেখো, ${safeQuery} বুঝতে হলে আমাদের একটু গভীরে যেতে হবে। কিন্তু ভয় নেই — আমি ধাপে ধাপে বলবো।`,
        board: {
          type: 'concept',
          text: `Core: ${safeQuery}`,
          textBn: `মূল ধারণা: ${safeQuery}`,
          chalkLines: [`মূল বিষয়:`, `→ ${safeQuery} হলো ${subjectLabel} এর একটি গুরুত্বপূর্ণ অধ্যায়`],
          chalkColor: 'white',
        },
      },
      priority: 'high',
      actions: ['speak', 'board_write'],
    },
    {
      intent: 'provide_example',
      content: {
        speech: `এবার একটা সহজ উদাহরণ দিই। তোমাদের দৈনন্দিন জীবনেই ${safeQuery} এর ব্যবহার আছে।`,
        speechBn: `এবার একটা সহজ উদাহরণ দিই। তোমাদের দৈনন্দিন জীবনেই ${safeQuery} এর ব্যবহার আছে।`,
        board: {
          type: 'example',
          text: `Example: ${safeQuery}`,
          textBn: `উদাহরণ:`,
          chalkLines: [`✎ উদাহরণ:`, `   ${safeQuery} → আমাদের জীবনে প্রতিদিন`],
          chalkColor: 'cyan',
        },
      },
      priority: 'medium',
      actions: ['speak', 'board_write'],
    },
    {
      intent: 'quiz_student',
      content: {
        speech: `চলো এবার একটু দেখি তোমরা কতটুকু বুঝেছো! একটা ছোট প্রশ্ন করি।`,
        speechBn: `চলো এবার একটু দেখি তোমরা কতটুকু বুঝেছো! একটা ছোট প্রশ্ন করি।`,
        board: {
          type: 'definition',
          text: `Quiz Time!`,
          textBn: `📝 প্রশ্ন করি!`,
          chalkLines: [`❓ প্রশ্ন:`, `${safeQuery} সম্পর্কে নিচের কোনটি সঠিক?`],
          chalkColor: 'yellow',
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
          en: `${safeQuery} is indeed a fundamental concept in ${subjectLabel}. Well done if you got it right!`,
          bn: `হ্যাঁ, ${safeQuery} হলো ${subjectLabel} এর একটি মৌলিক ধারণা। ঠিক উত্তর দিলে শাবাশ!`,
        },
      },
    },
    {
      intent: 'recap',
      content: {
        speech: `বেশ ভালো! আজকে আমরা ${safeQuery} সম্পর্কে অনেক কিছু শিখলাম। মনে রেখো — এটা পরীক্ষায় আসতে পারে!`,
        speechBn: `বেশ ভালো! আজকে আমরা ${safeQuery} সম্পর্কে অনেক কিছু শিখলাম। মনে রেখো — এটা পরীক্ষায় আসতে পারে!`,
        board: {
          type: 'recap',
          text: `Today we learned:`,
          textBn: `আজকের সারসংক্ষেপ:`,
          chalkLines: [`📋 সারসংক্ষেপ:`, `✓ ${safeQuery} এর সংজ্ঞা`, `✓ মূল ধারণা`, `✓ উদাহরণ`],
          chalkColor: 'green',
        },
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

// ---- Enhanced System Prompt ----

const SYSTEM_PROMPT = `You are "Soren Sir", an extraordinary PhD-level AI teacher for Bangladeshi students (Class 6-10, NCTB curriculum). You are warm, encouraging, brilliant, and deeply human — NOT robotic.

Your personality:
- You speak like a real beloved teacher: conversational, uses Bangla naturally, makes jokes sometimes
- You connect topics to real Bangladeshi daily life (rickshaw, rice, Padma river, cricket, shutki, bazaar, bKash, dhaka traffic)
- You use analogies students actually understand
- You never just define — you EXPLAIN WHY it matters
- You celebrate correct answers: "শাবাশ! এইটা বুঝেছো মানে তুমি আসলেই বুঝেছো!"
- For wrong answers: "ভুল হয়েছে, কিন্তু এটাই বেশিরভাগ ছাত্র ভুল করে — চলো একসাথে ঠিক করি"

Output ONLY valid JSON — no markdown, no code fences, no extra text:
{
  "lesson_id": "unique-id",
  "title": "Lesson Title in Bangla",
  "lang": "bn+en",
  "classNumber": 8,
  "subject": "math",
  "subjectLabel": "Mathematics",
  "teacher_persona": "friendly_teacher",
  "teaching_mode": "math",
  "intents": [...],
  "created_at": "ISO date"
}

Each intent object:
{
  "intent": "introduce|explain_concept|provide_example|quiz_student|recap|transition|interact|encourage|analogy|common_mistake",
  "content": {
    "speech": "What teacher SAYS in English (warm, human, conversational)",
    "speechBn": "What teacher SAYS in Bangla (primary — must be natural, not translated robot-speak)",
    "board": {
      "type": "definition|concept|example|diagram|recap|formula|table|graph|steps|key_points",
      "text": "Short English board heading",
      "textBn": "বাংলা বোর্ড শিরোনাম",
      "chalkLines": ["Line 1 on board", "Line 2 on board (can use → ✓ ✗ ★ ❓ symbols)"],
      "chalkColor": "white|yellow|cyan|green|pink",
      "formulaText": "LaTeX formula string (only for math/science)",
      "tableData": null,
      "graphData": null
    }
  },
  "priority": "critical|high|medium|low",
  "actions": ["speak", "board_write"],
  "quiz": null
}

RULES FOR BANGLA SPEECH:
- Use আপনি/তুমি/তোমরা naturally based on persona
- Friendly teacher uses তুমি/তোমরা
- Strict teacher uses তুমি but firm
- Include encouragements: "বেশ ভালো!", "চমৎকার!", "একদম ঠিক!", "ভাবো একটু..."
- Mix Bangla and English naturally like real teachers do: "এটাকে বলে photosynthesis — মানে আলোর সাহায্যে খাবার তৈরি"

RULES FOR BOARD (chalkLines):
- Write like a REAL TEACHER writes on a board — short punchy lines
- Use indentation with spaces for hierarchy
- Use symbols: → (arrow/point), ✓ (correct), ✗ (wrong), ★ (important), ❓(question), ∴ (therefore), ∵ (because)
- For math: write equations step by step on separate lines
- For science: write key terms with definitions
- For language: write examples with underlines noted as "___"
- MAX 6 lines per board block, each line max 50 chars
- chalkColor: yellow=definition/important, white=explanation, cyan=example, green=correct/recap, pink=warning/note

INTENT FLOW (generate 10-16 intents):
introduce → explain_concept (x2-3) → analogy → provide_example (x1-2) → common_mistake → interact → quiz_student → encourage → recap

For quiz_student intents add:
"quiz": {
  "questionText": { "en": "English question", "bn": "বাংলা প্রশ্ন" },
  "choices": [
    { "id": "a", "label": "A", "text": { "en": "...", "bn": "..." } },
    { "id": "b", "label": "B", "text": { "en": "...", "bn": "..." } },
    { "id": "c", "label": "C", "text": { "en": "...", "bn": "..." } },
    { "id": "d", "label": "D", "text": { "en": "...", "bn": "..." } }
  ],
  "correctAnswer": "a",
  "explanation": { "en": "Warm explanation of why...", "bn": "উৎসাহব্যঞ্জক ব্যাখ্যা..." }
}

TEACHER PERSONAS:
- friendly_teacher: বন্ধুর মতো, হাসিখুশি, উৎসাহ দেয়, তুমি/তোমরা
- strict_teacher: কঠোর কিন্তু ন্যায়সঙ্গত, ফর্মাল, উচ্চ প্রত্যাশা
- exam_coach: পরীক্ষা-কেন্দ্রিক, কোন প্রশ্ন বেশি আসে বলে, tricks and tips
- slow_explainer: প্রতিটি পদক্ষেপ ধীরে ধীরে, নিশ্চিত করে সবাই বুঝেছে
- bilingual_first: প্রতিটি বিষয় আগে বাংলায় তারপর ইংরেজিতে

NCTB ALIGNMENT:
- Class 6-8: বাংলা মিডিয়াম স্টাইল, সহজ ভাষা
- Class 9-10 Science: English terms বাংলায় ব্যাখ্যা, formulas অবশ্যই
- Class 9-10 Arts/Commerce: social context, real-life application
- Always mention if a topic is SSC-important: "SSC তে এটা প্রায়ই আসে!"

OUTPUT ONLY RAW JSON. NO BACKTICKS. NO MARKDOWN. START WITH { END WITH }`;

function getTeachingMode(subject: string): TeachingMode {
  const modeMap: Record<string, TeachingMode> = {
    math: 'math', higher_math: 'math',
    science: 'science', physics: 'science', chemistry: 'science', biology: 'science',
    english: 'english', bangla: 'bangla', ict: 'ict',
  };
  return modeMap[subject] || 'general';
}

function getPersonaStyle(persona: TeacherPersona): string {
  const styles: Record<TeacherPersona, string> = {
    friendly_teacher: 'Warm, encouraging, uses humor, celebrates small wins, says তোমরা',
    strict_teacher: 'Firm but fair, high expectations, no nonsense, rewards hard work',
    exam_coach: 'SSC/JSC focused, points out exam tricks, says "এটা পরীক্ষায় আসবেই"',
    slow_explainer: 'Extremely patient, repeats key points, checks understanding at each step',
    bilingual_first: 'Always explains in Bangla first, then English equivalent, bridges both',
  };
  return styles[persona] || styles.friendly_teacher;
}

// ---- Mistral API call (browser-safe fetch) ----

async function callMistral(messages: { role: string; content: string }[]): Promise<{
  content: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
} | null> {
  const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY;
  const model = process.env.NEXT_PUBLIC_MODEL_NAME || 'mistral-medium-latest';

  if (!apiKey) {
    console.warn('[LessonService] NEXT_PUBLIC_MISTRAL_API_KEY not set — using fallback lesson');
    return null;
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 6000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[LessonService] Mistral API error:', response.status, err);
      return null;
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  } catch (err) {
    console.error('[LessonService] Fetch failed:', err);
    return null;
  }
}

async function generateLessonWithAI(
  query: string,
  classNumber: ClassNumber,
  subject: string,
  subjectLabel: string,
  teacherPersona: TeacherPersona,
  context: string,
  isFollowUp: boolean = false
): Promise<{ lesson: LessonPlan; tokens: { input: number; output: number; total: number } } | null> {
  const teachingMode = getTeachingMode(subject);
  const personaStyle = getPersonaStyle(teacherPersona);

  const contextSection = context ? `\n\nPrevious session context (what was already taught):\n${context}` : '';
  const followUpNote = isFollowUp
    ? `\nThis is a FOLLOW-UP question from a student during an ongoing lesson. Keep the same warm energy, reference what was just taught if relevant, and give a focused answer (6-10 intents).`
    : '';

  const userMessage = `Teach: "${query}"

Student info:
- Class: ${classNumber} (Bangladesh NCTB)
- Subject: ${subjectLabel} (${subject})
- Teacher style: ${teacherPersona} — ${personaStyle}
- Teaching mode: ${teachingMode}${contextSection}${followUpNote}

Generate a complete, engaging, bilingual (Bangla primary) lesson with real-life Bangladeshi examples, warm human tone, and rich board content. Make it feel like a real classroom — not a textbook.`;

  const result = await callMistral([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ]);

  if (!result?.content) return null;

  let parsed: LessonPlan;
  try {
    const clean = result.content.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    console.error('[LessonService] Failed to parse Mistral response as JSON');
    return null;
  }

  if (!parsed.intents || !Array.isArray(parsed.intents) || parsed.intents.length === 0) return null;

  // Ensure chalkLines exist on all board items
  const intents = parsed.intents.map((intent) => {
    if (intent.content?.board && !intent.content.board.chalkLines) {
      intent.content.board.chalkLines = [
        intent.content.board.textBn || intent.content.board.text,
      ];
    }
    return intent;
  });

  const lesson: LessonPlan = {
    lesson_id: parsed.lesson_id || crypto.randomUUID(),
    title: parsed.title || `${query} — Class ${classNumber}`,
    lang: parsed.lang || 'bn+en',
    classNumber,
    subject,
    subjectLabel,
    teacher_persona: teacherPersona,
    teaching_mode: teachingMode,
    intents,
    created_at: new Date().toISOString(),
  };

  return {
    lesson,
    tokens: {
      input: result.usage.prompt_tokens,
      output: result.usage.completion_tokens,
      total: result.usage.total_tokens,
    },
  };
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

  const aiResult = await generateLessonWithAI(query, classNumber, subject, subjectLabel, teacher_persona || 'friendly_teacher', context, false);
  const lesson = aiResult?.lesson ?? createFallbackLesson(query, classNumber, subject, subjectLabel, teacher_persona || 'friendly_teacher', teachingMode);
  const tokenUsage = aiResult?.tokens ?? { input: 0, output: 0, total: 0 };

  return {
    lesson,
    tokens: { input_tokens: tokenUsage.input, output_tokens: tokenUsage.output, total_tokens: tokenUsage.total, session_id: classroom_id, timestamp: new Date().toISOString() },
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

  const aiResult = await generateLessonWithAI(query, classNumber, subject, subjectLabel, teacher_persona || 'friendly_teacher', context, true);

  let lesson: LessonPlan;
  const tokenUsage = aiResult?.tokens ?? { input: 0, output: 0, total: 0 };

  if (aiResult) {
    lesson = aiResult.lesson;
  } else {
    const fallback = createFallbackLesson(query, classNumber, subject, subjectLabel, teacher_persona || 'friendly_teacher', teachingMode);
    lesson = { ...fallback, intents: fallback.intents.slice(0, 4) };
  }

  return {
    lesson,
    tokens: { input_tokens: tokenUsage.input, output_tokens: tokenUsage.output, total_tokens: tokenUsage.total, session_id: classroom_id, timestamp: new Date().toISOString() },
  };
}
