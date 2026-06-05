'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Clock,
} from 'lucide-react';
import type { Classroom } from '@/types';
import { CLASS_CONFIG } from '@/config/curriculum';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  paused: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
  completed: 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/25',
  archived: 'bg-stone-500/15 text-stone-700 dark:text-stone-400 border-stone-500/25',
};

// Color mapping for subject accent bars
const SUBJECT_COLORS: Record<string, string> = {
  'Math': 'bg-rose-500',
  'Mathematics': 'bg-rose-500',
  'Science': 'bg-emerald-500',
  'Physics': 'bg-sky-500',
  'Chemistry': 'bg-amber-500',
  'Biology': 'bg-green-500',
  'Higher Mathematics': 'bg-red-500',
  'English': 'bg-blue-500',
  'English For Today': 'bg-blue-500',
  'English Grammar': 'bg-indigo-500',
  'English_Grammar': 'bg-indigo-500',
  'English Grammar and Composition': 'bg-indigo-500',
  'Bangla': 'bg-orange-500',
  'Bangla 2nd': 'bg-orange-600',
  'Bangla_Bekoron': 'bg-orange-500',
  'Bangla Bekoron': 'bg-orange-500',
  'Bangla Literature': 'bg-orange-500',
  'Bangla Grammar': 'bg-yellow-600',
  'Bangla Supplementary': 'bg-yellow-500',
  'BGS': 'bg-teal-500',
  'Bangladesh & Global Studies': 'bg-teal-500',
  'ICT': 'bg-violet-500',
  'Islam': 'bg-emerald-600',
  'Hindu': 'bg-orange-400',
  'Arbi': 'bg-cyan-500',
  'History': 'bg-stone-500',
  'Geography': 'bg-lime-500',
  'Civics': 'bg-fuchsia-500',
  'Economics': 'bg-green-600',
  'Accounting': 'bg-sky-600',
  'Finance and Banking': 'bg-blue-600',
  'Business Entrepreneurship': 'bg-amber-600',
  'Kormo_o_Jibon': 'bg-pink-500',
  'Krishi': 'bg-lime-600',
  'Agriculture': 'bg-lime-600',
  'Home_Science': 'bg-pink-400',
  'Home Science': 'bg-pink-400',
  'Arts_and_Crafts': 'bg-purple-500',
  'Art and Craft': 'bg-purple-500',
  'Sharirik_Sikha': 'bg-red-500',
  'Physical_Education': 'bg-red-500',
  'Physical Education': 'bg-red-500',
  'Songskrito': 'bg-amber-700',
  'Curious': 'bg-yellow-400',
  'Anandopath': 'bg-orange-500',
  'Anandapatha': 'bg-orange-500',
  'Anondopath': 'bg-orange-500',
  'Charupath': 'bg-amber-500',
  'Sahitto_Konika': 'bg-amber-600',
  'Career Education': 'bg-cyan-500',
};

function getSubjectColor(subjectId: string): string {
  return SUBJECT_COLORS[subjectId] || 'bg-slate-500';
}

function getStreamBadgeColor(stream?: string): string {
  switch (stream) {
    case 'Science': return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25';
    case 'Arts': return 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/25';
    case 'Commerce': return 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/25';
    default: return '';
  }
}

interface ClassroomCardProps {
  classroom: Classroom;
  onEnter: (id: string) => void;
  onReplay?: (id: string) => void;
}

export function ClassroomCard({ classroom, onEnter, onReplay }: ClassroomCardProps) {
  const classConfig = CLASS_CONFIG[classroom.classNumber];
  const colorBar = getSubjectColor(classroom.subject);

  return (
    <Card className="group relative overflow-hidden border border-border/60 bg-card hover:border-border hover:shadow-lg transition-all duration-300 cursor-pointer">
      {/* Subject color accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${colorBar}`} />

      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-lg">
              {classroom.subjectIcon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-foreground leading-tight">
                {classroom.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {classConfig.label}
                {classroom.stream ? ` ${classroom.stream}` : ''}
                {' · '}
                {classroom.subjectLabel}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] font-medium px-2 py-0.5 ${STATUS_STYLES[classroom.status] || ''}`}
          >
            {classroom.status}
          </Badge>
        </div>

        {/* Stream badge */}
        {classroom.stream && (
          <div className="mt-2">
            <Badge
              variant="outline"
              className={`text-[10px] font-medium px-2 py-0 ${getStreamBadgeColor(classroom.stream)}`}
            >
              {classroom.stream}
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {classroom.last_session_summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {classroom.last_session_summary}
          </p>
        )}

        {typeof classroom.progress === 'number' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Progress
              </span>
              <span className="text-[10px] font-semibold text-foreground">
                {classroom.progress}%
              </span>
            </div>
            <Progress value={classroom.progress} className="h-1.5" />
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {classroom.sessions_count} session{classroom.sessions_count !== 1 ? 's' : ''}
          </span>
          <span>{formatRelativeTime(classroom.updated_at)}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-4">
        <div className="flex w-full gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEnter(classroom.id);
            }}
            className="flex-1 h-9 text-xs font-medium"
            size="sm"
          >
            <Play className="h-3.5 w-3.5 mr-1.5" />
            {classroom.status === 'completed' ? 'Replay' : 'Enter Class'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString();
}
