import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// ---- Follow-up System Prompt (Conversational Classroom) ----

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
    { "id": "c", "label": "C", "text": { "en": "...", "bn": "..." } },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, classNumber, subject, subjectLabel, teacher_persona, teaching_mode, context } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Missing required field: query' },
        { status: 400 }
      );
    }

    // Build user message with context
    const userMessage = context
      ? `A student in Class ${classNumber} ${subjectLabel} just asked: "${query}"

What we were just teaching: ${context}

Teacher persona: ${teacher_persona || 'friendly_teacher'}
Teaching mode: ${teaching_mode || 'general'}

Respond like a REAL Bangladeshi teacher would. Acknowledge the question, connect it to what was just taught, and explain clearly. Use natural Bangla-English mixing.`
      : `A student in Class ${classNumber} ${subjectLabel} just asked: "${query}"

Teacher persona: ${teacher_persona || 'friendly_teacher'}
Teaching mode: ${teaching_mode || 'general'}

Respond like a REAL Bangladeshi teacher would. Acknowledge the question and explain clearly. Use natural Bangla-English mixing.`;

    // Call AI using z-ai-web-dev-sdk
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: FOLLOWUP_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.75,
      max_tokens: 3000,
    });

    const content = completion.choices?.[0]?.message?.content || '';

    // Parse the response
    let parsed;
    try {
      const clean = content.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error('[API /followup] Failed to parse AI response as JSON');
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: content.substring(0, 500) },
        { status: 500 }
      );
    }

    if (!parsed.intents || !Array.isArray(parsed.intents) || parsed.intents.length === 0) {
      console.error('[API /followup] AI response has no valid intents');
      return NextResponse.json(
        { error: 'AI response has no valid intents' },
        { status: 500 }
      );
    }

    // Return the lesson with token usage
    const lesson = {
      lesson_id: parsed.lesson_id || crypto.randomUUID(),
      title: parsed.title || `Follow-up: ${query}`,
      lang: parsed.lang || 'bn+en',
      classNumber,
      subject,
      subjectLabel,
      teacher_persona: teacher_persona || 'friendly_teacher',
      teaching_mode: teaching_mode || 'general',
      intents: parsed.intents,
      created_at: new Date().toISOString(),
    };

    const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return NextResponse.json({
      lesson,
      tokens: {
        input_tokens: usage.prompt_tokens || 0,
        output_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /followup] Error:', message);
    return NextResponse.json(
      { error: 'Failed to generate follow-up', details: message },
      { status: 500 }
    );
  }
}
