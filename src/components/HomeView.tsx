'use client';

import { useEffect, useState } from 'react';
import { useClassroomStore } from '@/stores/classroomStore';
import { useProgressStore } from '@/stores/progressStore';
import { useTokenStore } from '@/stores/tokenStore';
import { ClassroomCard } from './home/ClassroomCard';
import { CreateClassroomDialog } from './home/CreateClassroomDialog';
import type { CreateClassroomRequest, Classroom } from '@/types';
import { storage } from '@/services/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BookOpen, Clock, Trophy, GraduationCap, Plus, Sparkles, RotateCcw } from 'lucide-react';

interface HomeViewProps {
  onOpenClassroom: (classroom: Classroom) => void;
}

export function HomeView({ onOpenClassroom }: HomeViewProps) {
  const { classrooms, loadClassrooms, createClassroom, deleteClassroom } = useClassroomStore();
  const { progress, loadProgress } = useProgressStore();
  const { loadFromStorage } = useTokenStore();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadClassrooms();
    loadProgress();
    loadFromStorage();
  }, [loadClassrooms, loadProgress, loadFromStorage]);

  const handleCreate = (req: CreateClassroomRequest) => {
    createClassroom(req);
  };

  const handleDelete = (id: string) => {
    deleteClassroom(id);
    setDeleteTarget(null);
  };

  const handleOpenClassroom = (id: string) => {
    const classroom = classrooms.find((c) => c.id === id);
    if (classroom) onOpenClassroom(classroom);
  };

  const filteredClassrooms = classrooms.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const savedSession = typeof window !== 'undefined' ? storage.getSession() : null;
  const hasResumableSession = savedSession !== null;

  const quizTotal = progress?.subjects.reduce((acc, s) => acc + s.quizTotal, 0) || 0;
  const quizScore = progress?.subjects.reduce((acc, s) => acc + s.quizScore, 0) || 0;

  const FILTER_LABELS = { all: 'সব', active: 'চলমান', completed: 'শেষ' };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── HEADER ─── */}
      <header className="border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Logo mark — chalkboard green */}
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #1a3d2a 0%, #2d6a4f 100%)' }}
            >
              📚
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-tight">Soren Classroom</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Bangladesh NCTB · AI শিক্ষক
              </p>
            </div>
          </div>
          <CreateClassroomDialog onCreate={handleCreate} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-5 space-y-5">

        {/* ─── RESUME BANNER ─── */}
        {hasResumableSession && savedSession && (
          <div
            className="rounded-xl border p-3 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #1a3d2a15 0%, #2d6a4f10 100%)', borderColor: '#2d6a4f30' }}
          >
            <RotateCcw className="h-4 w-4 shrink-0" style={{ color: '#2d6a4f' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">আগের পাঠ চালিয়ে যাবে?</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {new Date(savedSession.saved_at).toLocaleDateString('bn-BD')} তারিখের পাঠ
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 text-xs"
              onClick={() => {
                const classroom = classrooms.find((c) => c.id === savedSession.classroom_id);
                if (classroom) onOpenClassroom(classroom);
              }}
            >
              চালিয়ে যাও
            </Button>
          </div>
        )}

        {/* ─── STATS ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {[
            {
              icon: <BookOpen className="h-3.5 w-3.5" />,
              label: 'বিষয় শিখেছি',
              value: progress?.totalTopicsLearned || 0,
            },
            {
              icon: <Clock className="h-3.5 w-3.5" />,
              label: 'পড়ার সময়',
              value: `${Math.floor((progress?.totalTimeSpentSeconds || 0) / 60)}মি`,
            },
            {
              icon: <Trophy className="h-3.5 w-3.5" />,
              label: 'কুইজ স্কোর',
              value: quizTotal > 0 ? `${quizScore}/${quizTotal}` : '—',
            },
            {
              icon: <GraduationCap className="h-3.5 w-3.5" />,
              label: 'ক্লাসরুম',
              value: classrooms.length,
            },
          ].map((stat) => (
            <Card key={stat.label} className="overflow-hidden">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                  {stat.icon}
                  <span className="text-[10px] sm:text-xs"
                    style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
                    {stat.label}
                  </span>
                </div>
                <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── CLASSROOMS ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2
              className="text-base font-semibold"
              style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
            >
              আমার ক্লাসরুম
            </h2>
            <div className="flex gap-1">
              {(['all', 'active', 'completed'] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? 'default' : 'ghost'}
                  onClick={() => setFilter(f)}
                  className="text-[10px] sm:text-xs h-7 px-2.5"
                  style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                >
                  {FILTER_LABELS[f]}
                </Button>
              ))}
            </div>
          </div>

          {filteredClassrooms.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <div className="text-4xl mb-3">📖</div>
                <h3
                  className="font-medium mb-1"
                  style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                >
                  কোনো ক্লাসরুম নেই
                </h3>
                <p
                  className="text-sm text-muted-foreground mb-4"
                  style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
                >
                  প্রথম ক্লাসরুম তৈরি করো এবং AI স্যারের কাছে পড়া শুরু করো!
                </p>
                <CreateClassroomDialog
                  onCreate={handleCreate}
                  trigger={
                    <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                      <Plus className="h-4 w-4" />
                      <span style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
                        ক্লাসরুম তৈরি করো
                      </span>
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredClassrooms.map((classroom) => (
                <ClassroomCard
                  key={classroom.id}
                  classroom={classroom}
                  onOpen={handleOpenClassroom}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </div>

        {/* ─── FOOTER INFO ─── */}
        <div className="pt-2 pb-4 text-center">
          <p className="text-[10px] text-muted-foreground"
            style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
            🇧🇩 Bangladesh NCTB পাঠ্যক্রম · Class 6-10 · বাংলা ও ইংরেজি
          </p>
        </div>
      </main>

      {/* ─── DELETE DIALOG ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
              ক্লাসরুম মুছে ফেলবে?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
              এই ক্লাসরুম এবং এর সব তথ্য স্থায়ীভাবে মুছে যাবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}>
              বাতিল
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
            >
              মুছে ফেলো
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
