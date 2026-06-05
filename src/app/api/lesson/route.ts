import { NextResponse } from 'next/server';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MODEL = 'mistral-small-2506';

interface LessonRequestBody {
  classroom_id: string;
  query: string;
  classNumber?: number;
  stream?: string;
  subject?: string;
  subjectLabel?: string;
  history?: string;
}

// System prompt to generate structured lesson content for our teaching engine
const TEACHING_SYSTEM_PROMPT = `You are an expert teacher for Bangladesh National Curriculum students. You create clear, step-by-step lessons that will be rendered on an interactive teaching board.

When teaching, you MUST:
1. Start with a warm, encouraging greeting
2. Break the topic into clear, numbered sections
3. Use simple language appropriate for the student's level
4. Include real-world examples and analogies
5. Use formulas or equations where relevant
6. End with a summary and encourage questions

IMPORTANT FORMAT RULES:
- Use **bold** for key terms and important concepts
- Use line breaks between sections
- For math/formulas, write them clearly like: F = ma, a² + b² = c²
- Use bullet points with "-" for lists
- Keep each section concise (2-4 sentences)
- Number your sections as: 1., 2., 3., etc.
- Write the lesson in English
- Do NOT use markdown headers (##, ###) — use numbered sections instead
- Do NOT use code blocks`;

function buildUserPrompt(query: string, classNumber?: number, stream?: string, subjectLabel?: string): string {
  let context = '';
  if (classNumber) context += `Class: ${classNumber}. `;
  if (stream) context += `Stream: ${stream}. `;
  if (subjectLabel) context += `Subject: ${subjectLabel}. `;

  return `${context || ''}Teach this topic thoroughly: ${query}

Structure your lesson as a complete teaching session that can be presented on a board. Include:
- An introduction explaining why this topic matters
- Clear step-by-step explanation of concepts
- Examples and formulas where relevant
- A brief summary at the end

Make it engaging and easy to understand for the student.`;
}

// Parse the AI response into board-friendly text segments
function parseLessonToSegments(text: string): Array<{ type: string; content: string }> {
  const segments: Array<{ type: string; content: string }> = [];

  // Split by numbered sections
  const lines = text.split('\n').filter(l => l.trim());
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Check if this starts a new numbered section
    if (/^\d+[\.\)]\s/.test(trimmed)) {
      if (currentSection) {
        segments.push({ type: 'content', content: currentSection.trim() });
      }
      currentSection = trimmed;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Bullet point - add to current section
      currentSection += '\n' + trimmed;
    } else if (/^\*\*.*\*\*$/.test(trimmed) && trimmed.length < 100) {
      // Standalone bold line - could be a heading, add as separate segment
      if (currentSection) {
        segments.push({ type: 'content', content: currentSection.trim() });
        currentSection = '';
      }
      segments.push({ type: 'heading', content: trimmed.replace(/\*\*/g, '') });
    } else {
      currentSection += '\n' + trimmed;
    }
  }

  // Don't forget the last section
  if (currentSection) {
    segments.push({ type: 'content', content: currentSection.trim() });
  }

  return segments;
}

// Convert segments to timeline events
function segmentsToTimelineEvents(segments: Array<{ type: string; content: string }>): Array<any> {
  const events: Array<any> = [];
  let time = 0;
  let yPos = 30;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.type === 'heading' && i === 0) {
      // First heading is the topic title
      events.push({
        t: time,
        type: 'board_write',
        content: seg.content,
        position: { x: 40, y: yPos },
        color: '#1a1a1a',
        fontSize: 26,
      });
      yPos += 50;
      time += 2;
      continue;
    }

    if (seg.type === 'heading') {
      // Section headings
      events.push({
        t: time,
        type: 'board_write',
        content: seg.content,
        position: { x: 40, y: yPos },
        color: '#2563eb',
        fontSize: 20,
      });
      yPos += 35;
      time += 1.5;
    } else {
      // Content - write on board in chunks
      const contentLines = seg.content.split('\n').filter(l => l.trim());
      for (const line of contentLines) {
        const cleanLine = line.replace(/\*\*/g, '').replace(/^\d+[\.\)]\s*/, '').trim();
        if (!cleanLine) continue;

        // Check if it's a formula (short line with = sign or mathematical notation)
        const isFormula = cleanLine.length < 60 && /[=+\-×÷^²³]/.test(cleanLine);

        events.push({
          t: time,
          type: 'board_write',
          content: cleanLine,
          position: { x: 40, y: yPos },
          color: isFormula ? '#dc2626' : '#374151',
          fontSize: isFormula ? 22 : 15,
        });
        yPos += isFormula ? 35 : 25;
        time += 1.5;

        // Don't go too far down - reset position if needed
        if (yPos > 500) {
          events.push({ t: time, type: 'board_clear' });
          yPos = 30;
          time += 0.5;
        }
      }
    }

    // Add voice narration periodically
    if (i % 2 === 0 && seg.content) {
      const voiceText = seg.content.replace(/\*\*/g, '').replace(/\n/g, '. ').substring(0, 200);
      events.push({
        t: time,
        type: 'voice',
        voiceText: voiceText,
      });
      time += 2;
    }
  }

  // Add input prompt at the end
  events.push({
    t: time,
    type: 'voice',
    voiceText: "That's the lesson! Feel free to ask any questions about what we covered.",
  });
  time += 2;

  events.push({
    t: time,
    type: 'input_prompt',
  });

  return events;
}

// POST /api/lesson - Start a new lesson
export async function POST(request: Request) {
  try {
    const body: LessonRequestBody = await request.json();
    const { classroom_id, query, classNumber, stream, subject, subjectLabel } = body;

    if (!classroom_id || !query) {
      return NextResponse.json(
        { message: 'Classroom ID and query are required' },
        { status: 400 }
      );
    }

    // Call Mistral API
    let lessonText: string;

    if (!MISTRAL_API_KEY) {
      // Fallback demo response when no API key is configured
      lessonText = generateFallbackLesson(query, subjectLabel);
    } else {
      try {
        const userPrompt = buildUserPrompt(query, classNumber, stream, subjectLabel);

        const response = await fetch(MISTRAL_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: 'system', content: TEACHING_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 2048,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Mistral API error:', response.status, errorData);
          // Fallback to demo lesson on API error
          lessonText = generateFallbackLesson(query, subjectLabel);
        } else {
          const data = await response.json();
          lessonText = data.choices?.[0]?.message?.content || generateFallbackLesson(query, subjectLabel);
        }
      } catch (apiError) {
        console.error('Mistral API call failed:', apiError);
        lessonText = generateFallbackLesson(query, subjectLabel);
      }
    }

    // Parse lesson text into timeline events
    const segments = parseLessonToSegments(lessonText);
    const events = segmentsToTimelineEvents(segments);

    const totalDuration = events.length > 0 ? (events[events.length - 1]?.t || 10) + 2 : 10;

    const timeline = {
      lesson_id: `lesson-${Date.now()}`,
      mode: 'standard',
      classNumber: classNumber || 6,
      stream: stream || undefined,
      subject: subject || 'general',
      subjectLabel: subjectLabel || 'General',
      title: `${subjectLabel || 'Lesson'}: ${query.substring(0, 50)}`,
      events,
      totalDuration,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(timeline);
  } catch {
    return NextResponse.json(
      { message: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// Fallback lesson generator when no API key is configured
function generateFallbackLesson(query: string, subjectLabel?: string): string {
  return `**Welcome to ${subjectLabel || 'your lesson'}!**

1. Let's explore: ${query}

Today we'll learn about ${query}. This is an important topic that builds your understanding step by step. Pay attention to each concept as we go.

2. Key Concepts

The main idea behind ${query} involves understanding the fundamental principles. Let's break it down:

- First, identify the core elements
- Then, understand how they relate to each other
- Finally, apply them to solve problems

3. Important Formulas and Rules

Here are the key formulas to remember:

- The basic relationship: Input = Output
- When values change, the relationship stays consistent
- Practice with different numbers to build confidence

4. Real-World Example

Let's look at a practical example to make this clearer. Imagine you're solving a problem step by step:

Step 1: Read the question carefully
Step 2: Identify what's given and what's asked
Step 3: Apply the appropriate formula or method
Step 4: Calculate and verify your answer

5. Summary

We covered the main concepts of ${query}. Remember to practice regularly and don't hesitate to ask questions if anything is unclear. Keep up the great work!`;
}

// POST /api/lesson/follow-up - Follow-up question in existing lesson
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { classroom_id, lesson_id, query } = body;

    if (!classroom_id || !query) {
      return NextResponse.json(
        { message: 'Classroom ID and query are required' },
        { status: 400 }
      );
    }

    let responseText: string;

    if (!MISTRAL_API_KEY) {
      responseText = `That's a great question about "${query}"! Let me explain this further. The key thing to understand is that this concept builds on what we covered earlier. Think about how each part connects to the whole. Try to relate it to the examples we discussed, and you'll see the pattern clearly.`;
    } else {
      try {
        const userPrompt = `A student asked a follow-up question during a lesson. Answer clearly and concisely in 2-3 sentences. The question: ${query}`;

        const response = await fetch(MISTRAL_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: 'system', content: 'You are a helpful teacher. Answer follow-up questions briefly and clearly. Keep responses to 2-3 sentences max.' },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 256,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          responseText = `Good question! Let me explain: ${query} is an important concept. Think about it step by step and try to connect it with what we've already learned.`;
        } else {
          const data = await response.json();
          responseText = data.choices?.[0]?.message?.content || 'Let me think about that...';
        }
      } catch {
        responseText = `Good question! The answer relates to what we discussed. Try to apply the same principles we covered in the main lesson.`;
      }
    }

    const events = [
      { t: 0, type: 'voice', voiceText: responseText.substring(0, 300) },
      { t: 1, type: 'board_write', content: responseText.substring(0, 200), position: { x: 40, y: 40 }, color: '#374151', fontSize: 15 },
      { t: 4, type: 'input_prompt' },
    ];

    const timeline = {
      lesson_id: lesson_id || `lesson-${Date.now()}`,
      mode: 'standard',
      classNumber: 6,
      subject: 'general',
      subjectLabel: 'Follow-up',
      title: `Follow-up: ${query.substring(0, 50)}`,
      events,
      totalDuration: 6,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(timeline);
  } catch {
    return NextResponse.json(
      { message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
