'use client';

import { Classroom } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Play, BookOpen, Clock } from 'lucide-react';

interface ClassroomCardProps {
  classroom: Classroom;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_BN: Record<string, string> = {
  active: 'চলমান',
  paused: 'বিরতি',
  completed: 'শেষ',
  archived: 'আর্কাইভ',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  paused: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400',
};

export function ClassroomCard({ classroom, onOpen, onDelete }: ClassroomCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-border/60">
      {/* Top accent bar — chalkboard green */}
      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, #1a3d2a, #2d6a4f, #1a3d2a)' }}
      />
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2.5">
          {/* Subject icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: 'linear-gradient(135deg, #1a3d2a15, #2d6a4f20)' }}
          >
            {classroom.subjectIcon}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{classroom.name}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5" style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
              ক্লাস {classroom.classNumber}
              {classroom.stream ? ` · ${classroom.stream === 'Science' ? 'বিজ্ঞান' : classroom.stream === 'Arts' ? 'মানবিক' : 'বাণিজ্য'}` : ''}
            </p>
          </div>

          {/* Status badge */}
          <Badge
            variant="secondary"
            className={`text-[9px] shrink-0 px-1.5 py-0 ${statusColors[classroom.status] || ''}`}
            style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
          >
            {STATUS_BN[classroom.status] || classroom.status}
          </Badge>
        </div>

        {/* Last session summary */}
        {classroom.last_session_summary && (
          <p
            className="text-[10px] text-muted-foreground mt-2.5 line-clamp-2 leading-relaxed"
            style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
          >
            {classroom.last_session_summary}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-2.5 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <BookOpen className="h-2.5 w-2.5" />
            <span style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
              {classroom.sessions_count} সেশন
            </span>
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {new Date(classroom.updated_at).toLocaleDateString('bn-BD')}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            style={{
              background: 'linear-gradient(135deg, #059669, #0d9488)',
              fontFamily: '"Noto Sans Bengali", sans-serif',
            }}
            onClick={() => onOpen(classroom.id)}
          >
            <Play className="h-3 w-3" />
            {classroom.status === 'active' ? 'চালিয়ে যাও' : 'শুরু করো'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(classroom.id);
            }}
            title="মুছে ফেলো"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
