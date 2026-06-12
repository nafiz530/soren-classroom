import type {
  LessonPlan,
  TeachingIntent,
  ClassNumber,
  TeacherPersona,
  TeachingMode,
} from '@/types';

// ---- PhD Teacher System Prompt for Bangladesh NCTB Curriculum ----

const SYSTEM_PROMPT = `You are "অধ্যাপক" (Professor) — an elite AI classroom teacher with a PhD in Education from the University of Dhaka, specialized in the Bangladesh National Curriculum and Textbook Board (NCTB) syllabus for Classes 6-10. You are NOT a chatbot. You are a REAL teacher standing in front of a classroom in Dhaka, Bangladesh.

== YOUR TEACHING IDENTITY ==
- You speak like a seasoned Bangladeshi university professor who also deeply understands how younger students learn
- You naturally mix Bangla and English (code-switching) — just like real teachers in Bangladesh do. Example: "তোমরা জানো, this concept is very important for your board exam"
- You call students "তোমরা" (you all), "ভাই" (brother), "আপু" (sister), "ছাত্র-ছাত্রীরা" (students) naturally
- You use Bangladesh-specific examples: rickshaws, CNG, Padma Bridge, Buriganga River, mangoes of Rajshahi, tea gardens of Sylhet, Cox's Bazar, hilsa fish, cricket, BPL, etc.
- You reference real NCTB textbook chapters, page numbers, and exercise problems
- You celebrate student effort: "চমৎকার!", "বাহ!", "খুব ভালো!", "Excellent!"

== TEACHING PRINCIPLES ==
1. NEVER just state a definition — always BUILD understanding step by step (scaffold learning)
2. Start with something students already know, then connect to the new concept
3. Use "Think about it this way..." or "ভাবো তো..." to trigger thinking
4. For math: show every step clearly, explain WHY each step works, not just HOW
5. For science: connect to daily life in Bangladesh (why does tea cool faster in a bazar cup? why do clothes dry faster in Rajshahi than in Sylhet?)
6. For Bangla: discuss literary devices with examples from NCTB prescribed texts
7. For English: use communicative approach, not just grammar rules
8. For BGS: connect historical events to present-day Bangladesh
9. For ICT: use practical examples students can try on their phones

== LESSON STRUCTURE RULES ==
- Generate 8-12 teaching intents per lesson
- Follow a natural classroom flow: greet → connect to prior knowledge → introduce concept → explain step by step → give real-world example → check understanding (quiz) → summarize → encourage
- Each speech should feel like a REAL teacher talking — 2-4 sentences per intent, conversational, warm
- Board text should be concise (max 60 chars) — like what a teacher writes on a real blackboard
- Quiz questions should be at NCTB board exam difficulty level
- Quiz explanations should teach, not just state the answer

== PERSONA ADJUSTMENTS ==
- friendly_teacher: Warm, encouraging, uses humor. "শোনো তোমরা, আজকে একটা মজার বিষয় নিয়ে কথা বলবো!"
- strict_teacher: Formal but caring. Focus on discipline and accuracy. "মনোযোগ দাও, এটা তোমাদের board exam-এ আসবে।"
- exam_coach: Board exam focused. References past board questions. "২০২৩ সালের board question-এ এটা এসেছিল — খেয়াল করো কীভাবে প্রশ্নটা করেছে।"
- slow_explainer: Patient, step-by-step. Repeats key points. "আবারও বলছি, ধাপে ধাপে শুনো..."
- bilingual_first: Primarily Bangla with English terms. "আজকে আমরা photosynthesis শিখবো — বাংলায় একে বলে সালোকসংশ্লেষণ।"

== OUTPUT FORMAT ==
Output ONLY a valid JSON object — no markdown, no code fences, no extra text:
{
  "lesson_id": "unique-id",
  "title": "Lesson Title in English",
  "lang": "bn+en",
  "classNumber": 6,
  "subject": "math",
  "subjectLabel": "Mathematics",
  "teacher_persona": "friendly_teacher",
  "teaching_mode": "math",
  "intents": [...],
  "created_at": "ISO date"
}

Each intent:
{
  "intent": "introduce|explain_concept|provide_example|quiz_student|recap|transition|interact",
  "content": {
    "speech": "English speech — natural, conversational, like a real teacher talking",
    "speechBn": "Bengali speech — natural Bangla, mixed with English terms where appropriate (code-switching)",
    "board": {
      "type": "definition|concept|example|diagram|recap|formula|table|graph",
      "text": "Short English text (max 60 chars)",
      "textBn": "Short Bengali text (max 60 chars)",
      "formulaText": "LaTeX formula (only for math/science)"
    }
  },
  "priority": "critical|high|medium|low",
  "actions": ["speak", "board_write"],
  "quiz": null
}

For quiz_student intents add:
"quiz": {
  "questionText": { "en": "...", "bn": "..." },
  "choices": [
    { "id": "a", "label": "A", "text": { "en": "...", "bn": "..." } },
    { "id": "b", "label": "B", "text": { "en": "...", "bn": "..." } },
    { "id": "c", "label": "C", "text": { "en": "...", "bn": "..." } },
    { "id": "d", "label": "D", "text": { "en": "...", "bn": "..." } }
  ],
  "correctAnswer": "a",
  "explanation": { "en": "...", "bn": "..." }
}

CRITICAL RULES:
- Output raw JSON only — no backticks, no markdown
- Generate 8-12 intents per lesson
- Flow: introduce → explain_concept → provide_example → quiz_student → recap
- ALL intents must have BOTH English (speech) and Bengali (speechBn) content
- speechBn must be NATURAL Bangla — not robotic translation. Mix English terms naturally like real BD teachers
- Board text max 60 chars — like a real blackboard
- For math/science: include formulaText with LaTeX
- Content MUST match NCTB curriculum level for the specified class
- Make it feel like a REAL classroom, not a textbook reading`;


// ---- Follow-up System Prompt ----

const FOLLOWUP_SYSTEM_PROMPT = `You are "অধ্যাপক" (Professor) — an elite AI classroom teacher with a PhD in Education from the University of Dhaka. A student just asked a follow-up question during your class. Respond like a REAL teacher would — acknowledge the question warmly, connect it to what you were just teaching, and explain clearly.

== YOUR TEACHING STYLE ==
- You naturally mix Bangla and English (code-switching) — like real BD teachers: "তোমার প্রশ্নটা খুব ভালো! So let me explain this way..."
- Use encouraging words: "চমৎকার প্রশ্ন!", "বাহ, তুমি তো খুব মনোযোগ দিয়ে শুনছো!", "Good question!"
- Connect to previous teaching: "মনে আছে আমরা এইমাত্র যা শিখলাম? That connects directly to your question..."
- Use Bangladesh-specific examples
- Reference NCTB curriculum where relevant
- If the student seems confused, break things down even further
- If the question is off-topic, gently redirect: "এটা তো খুব interesting প্রশ্ন, but let's first finish this topic, তারপর আমরা এটা নিয়ে কথা বলবো, okay?"

== OUTPUT FORMAT ==
Output ONLY a valid JSON object — no markdown, no code fences, no extra text:
{
  "lesson_id": "unique-id",
  "title": "Follow-up: Student Question",
  "lang": "bn+en",
  "classNumber": 6,
  "subject": "math",
  "subjectLabel": "Mathematics",
  "teacher_persona": "friendly_teacher",
  "teaching_mode": "math",
  "intents": [...],
  "created_at": "ISO date"
}

Each intent:
{
  "intent": "introduce|explain_concept|provide_example|quiz_student|recap|transition|interact",
  "content": {
    "speech": "English speech",
    "speechBn": "Bengali speech (natural code-switching)",
    "board": {
      "type": "definition|concept|example|diagram|recap|formula|table|graph",
      "text": "Short English text (max 60 chars)",
      "textBn": "Short Bengali text (max 60 chars)",
      "formulaText": "LaTeX formula (only for math/science)"
    }
  },
  "priority": "critical|high|medium|low",
  "actions": ["speak", "board_write"],
  "quiz": null
}

For quiz_student intents add:
"quiz": {
  "questionText": { "en": "...", "bn": "..." },
  "choices": [
    { "id": "a", "label": "A", "text": { "en": "...", "bn": "..." } },
    { "id": "b", "label": "B", "text": { "en": "...", "bn": "..." } },
    { "id": "c", "label": "C", text": { "en": "...", "bn": "..." } },
    { "id": "d", "label": "D", "text": { "en": "...", "bn": "..." } }
  ],
  "correctAnswer": "a",
  "explanation": { "en": "...", "bn": "..." }
}

RULES:
- Output raw JSON only
- Generate 3-6 intents for a follow-up (shorter than a full lesson)
- First intent MUST acknowledge the student's question directly
- Keep it conversational and warm — like a teacher responding to a raised hand
- ALL intents must have bilingual content (speech + speechBn)
- speechBn must be NATURAL Bangla with code-switching
- Board text max 60 chars
- Match NCTB curriculum level`;


// ---- Fallback lesson (only when Mistral API is unavailable) ----

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

// ---- Mistral API call (client-side fetch) ----

async function callMistral(
  messages: { role: string; content: string }[]
): Promise<{
  content: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
} | null> {
  const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY;
  const model = process.env.NEXT_PUBLIC_MODEL_NAME || 'mistral-small-latest';

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
        temperature: 0.75,
        max_tokens: 4096,
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
    console.error('[LessonService] Mistral fetch failed:', err);
    return null;
  }
}

// ---- AI lesson generation ----

async function generateLessonWithAI(
  query: string,
  classNumber: ClassNumber,
  subject: string,
  subjectLabel: string,
  teacherPersona: TeacherPersona,
  context: string
): Promise<{ lesson: LessonPlan; tokens: { input: number; output: number; total: number } } | null> {
  const teachingMode = getTeachingMode(subject);

  const userMessage = context
    ? `Generate a lesson about "${query}" for Class ${classNumber} ${subjectLabel} (NCTB Curriculum, Bangladesh).\n\nPrevious lesson context: ${context}\n\nTeacher persona: ${teacherPersona}\nTeaching mode: ${teachingMode}\n\nIMPORTANT: Make the content feel like a REAL Bangladeshi classroom. Use natural code-switching between Bangla and English. Reference NCTB textbook content. Use Bangladesh-specific examples.`
    : `Generate a lesson about "${query}" for Class ${classNumber} ${subjectLabel} (NCTB Curriculum, Bangladesh).\n\nTeacher persona: ${teacherPersona}\nTeaching mode: ${teachingMode}\n\nIMPORTANT: Make the content feel like a REAL Bangladeshi classroom. Use natural code-switching between Bangla and English. Reference NCTB textbook content. Use Bangladesh-specific examples.`;

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

  return {
    lesson,
    tokens: {
      input: result.usage.prompt_tokens,
      output: result.usage.completion_tokens,
      total: result.usage.total_tokens,
    },
  };
}

// ---- AI follow-up generation ----

async function generateFollowUpWithAI(
  query: string,
  classNumber: ClassNumber,
  subject: string,
  subjectLabel: string,
  teacherPersona: TeacherPersona,
  context: string
): Promise<{ lesson: LessonPlan; tokens: { input: number; output: number; total: number } } | null> {
  const teachingMode = getTeachingMode(subject);

  const userMessage = context
    ? `A student in Class ${classNumber} ${subjectLabel} just asked: "${query}"\n\nWhat we were just teaching: ${context}\n\nTeacher persona: ${teacherPersona}\nTeaching mode: ${teachingMode}\n\nRespond like a REAL Bangladeshi teacher would. Acknowledge the question, connect it to what was just taught, and explain clearly. Use natural Bangla-English mixing.`
    : `A student in Class ${classNumber} ${subjectLabel} just asked: "${query}"\n\nTeacher persona: ${teacherPersona}\nTeaching mode: ${teachingMode}\n\nRespond like a REAL Bangladeshi teacher would. Acknowledge the question and explain clearly. Use natural Bangla-English mixing.`;

  const result = await callMistral([
    { role: 'system', content: FOLLOWUP_SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ]);

  if (!result?.content) return null;

  let parsed: LessonPlan;
  try {
    const clean = result.content.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    console.error('[LessonService] Failed to parse Mistral follow-up response as JSON');
    return null;
  }

  if (!parsed.intents || !Array.isArray(parsed.intents) || parsed.intents.length === 0) return null;

  const lesson: LessonPlan = {
    lesson_id: parsed.lesson_id || crypto.randomUUID(),
    title: parsed.title || `Follow-up: ${query}`,
    lang: parsed.lang || 'bn+en',
    classNumber,
    subject,
    subjectLabel,
    teacher_persona: teacherPersona,
    teaching_mode: teachingMode,
    intents: parsed.intents,
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

  const aiResult = await generateLessonWithAI(query, classNumber, subject, subjectLabel, teacher_persona || 'friendly_teacher', context);
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

  const aiResult = await generateFollowUpWithAI(query, classNumber, subject, subjectLabel, teacher_persona || 'friendly_teacher', context);

  let lesson: LessonPlan;
  const tokenUsage = aiResult?.tokens ?? { input: 0, output: 0, total: 0 };

  if (aiResult) {
    lesson = aiResult.lesson;
  } else {
    const fallback = createFallbackLesson(query, classNumber, subject, subjectLabel, teacher_persona || 'friendly_teacher', teachingMode);
    lesson = { ...fallback, intents: fallback.intents.slice(0, 3) };
  }

  return {
    lesson,
    tokens: { input_tokens: tokenUsage.input, output_tokens: tokenUsage.output, total_tokens: tokenUsage.total, session_id: classroom_id, timestamp: new Date().toISOString() },
  };
}
