import type {
  CreateClassroomRequest,
  CreateClassroomResponse,
  Classroom,
  LessonTimeline,
  HistoryEntry,
  SessionLog,
} from '@/types';

const API_BASE = '/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  async createClassroom(data: CreateClassroomRequest): Promise<CreateClassroomResponse> {
    return this.request<CreateClassroomResponse>('/classroom', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getClassrooms(): Promise<Classroom[]> {
    return this.request<Classroom[]>('/classroom');
  }

  async getClassroom(id: string): Promise<Classroom> {
    return this.request<Classroom>(`/classroom/${id}`);
  }

  async deleteClassroom(id: string): Promise<void> {
    return this.request(`/classroom/${id}`, { method: 'DELETE' });
  }

  async startLesson(classroomId: string, query: string, extra?: { classNumber?: number; stream?: string; subject?: string; subjectLabel?: string }): Promise<LessonTimeline> {
    return this.request<LessonTimeline>('/lesson', {
      method: 'POST',
      body: JSON.stringify({ classroom_id: classroomId, query, ...extra }),
    });
  }

  async followUp(classroomId: string, lessonId: string, query: string): Promise<LessonTimeline> {
    return this.request<LessonTimeline>('/lesson/follow-up', {
      method: 'POST',
      body: JSON.stringify({ classroom_id: classroomId, lesson_id: lessonId, query }),
    });
  }

  async getHistory(classroomId?: string): Promise<HistoryEntry[]> {
    const params = classroomId ? `?classroom_id=${classroomId}` : '';
    return this.request<HistoryEntry[]>(`/history${params}`);
  }

  async getSessionLogs(sessionId: string): Promise<SessionLog> {
    return this.request<SessionLog>(`/history/${sessionId}/logs`);
  }

  async generateVoice(text: string): Promise<{ url: string }> {
    return this.request<{ url: string }>('/voice', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // SSE connection for streaming timeline events
  createTimelineStream(classroomId: string, query: string): EventSource {
    const url = `${API_BASE}/lesson/stream?classroom_id=${encodeURIComponent(classroomId)}&query=${encodeURIComponent(query)}`;
    return new EventSource(url);
  }
}

export const apiService = new ApiService();
