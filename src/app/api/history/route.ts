import { NextResponse } from 'next/server';

// GET /api/history - Fetch session history
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classroomId = searchParams.get('classroom_id');

  // In production, this would fetch from R2 JSONL logs
  return NextResponse.json({
    message: 'History endpoint - connect to your R2 backend',
    classroom_id: classroomId,
    entries: [],
  });
}
