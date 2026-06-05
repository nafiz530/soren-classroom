import { NextResponse } from 'next/server';

// GET /api/classroom - List all classrooms
export async function GET() {
  return NextResponse.json({
    message: 'Classroom list endpoint - connect to your backend',
    classrooms: [],
  });
}

// POST /api/classroom - Create a new classroom
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classNumber, stream, subject, subjectLabel, subjectIcon, name, mode_preset } = body;

    if (!classNumber || !subject) {
      return NextResponse.json(
        { message: 'Class number and subject are required' },
        { status: 400 }
      );
    }

    const classroomId = `class-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const classroomName = name || `Class ${classNumber}${stream ? ` ${stream}` : ''} — ${subjectLabel || subject}`;

    return NextResponse.json({
      classroom_id: classroomId,
      name: classroomName,
    });
  } catch {
    return NextResponse.json(
      { message: 'Invalid request body' },
      { status: 400 }
    );
  }
}
