'use client';

import { Classroom } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Play, Clock, BookOpen } from 'lucide-react';

interface ClassroomCardProps {
  classroom: Classroom;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  paused: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400',
};

export function ClassroomCard({ classroom, onOpen, onDelete }: ClassroomCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-border/60">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="text-2xl sm:text-3xl shrink-0 mt-0.5">{classroom.subjectIcon}</div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm sm:text-base truncate">{classroom.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Class {classroom.classNumber}
                {classroom.stream ? ` • ${classroom.stream}` : ''}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className={statusColors[classroom.status] || ''}>
                  {classroom.status}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {classroom.sessions_count} sessions
                </span>
              </div>
            </div>
          </div>
        </div>

        {classroom.last_session_summary && (
          <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
            {classroom.last_session_summary}
          </p>
        )}

        <div className="flex items-center gap-2 mt-4">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onOpen(classroom.id)}
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            {classroom.status === 'active' ? 'Continue' : 'Start'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(classroom.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute top-3 right-3">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {new Date(classroom.updated_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
