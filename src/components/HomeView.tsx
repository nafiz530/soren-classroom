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
import { BookOpen, Clock, Trophy, GraduationCap, Plus, Sparkles } from 'lucide-react';

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
    const classroom = createClassroom(req);
    void classroom;
  };

  const handleDelete = (id: string) => {
    deleteClassroom(id);
    setDeleteTarget(null);
  };

  const handleOpenClassroom = (id: string) => {
    const classroom = classrooms.find((c) => c.id === id);
    if (classroom) {
      onOpenClassroom(classroom);
    }
  };

  const filteredClassrooms = classrooms.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  // Check for saved session
  const savedSession = typeof window !== 'undefined' ? storage.getSession() : null;
  const hasResumableSession = savedSession !== null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Soren Classroom</h1>
              <p className="text-xs text-muted-foreground">AI শিক্ষক · NCTB Curriculum · বাংলাদেশ</p>
            </div>
          </div>
          <CreateClassroomDialog onCreate={handleCreate} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Resume Session Banner */}
        {hasResumableSession && savedSession && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium">আগের ক্লাস চালু করবে? / Resume your last lesson?</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(savedSession.saved_at).toLocaleString('bn-BD')}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const classroom = classrooms.find((c) => c.id === savedSession.classroom_id);
                  if (classroom) onOpenClassroom(classroom);
                }}
              >
                চালু করুন / Resume
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Progress Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs">বিষয় / Topics</span>
              </div>
              <p className="text-xl font-bold">{progress?.totalTopicsLearned || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">সময় / Time</span>
              </div>
              <p className="text-xl font-bold">
                {Math.floor((progress?.totalTimeSpentSeconds || 0) / 60)}m
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Trophy className="h-4 w-4" />
                <span className="text-xs">কুইজ / Quiz</span>
              </div>
              <p className="text-xl font-bold">
                {progress?.subjects.reduce((acc, s) => acc + s.quizScore, 0) || 0}/
                {progress?.subjects.reduce((acc, s) => acc + s.quizTotal, 0) || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <GraduationCap className="h-4 w-4" />
                <span className="text-xs">ক্লাসরুম / Classrooms</span>
              </div>
              <p className="text-xl font-bold">{classrooms.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Classrooms Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">আমার ক্লাসরুম / My Classrooms</h2>
            <div className="flex gap-1">
              {(['all', 'active', 'completed'] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? 'default' : 'ghost'}
                  onClick={() => setFilter(f)}
                  className="text-xs capitalize"
                >
                  {f === 'all' ? 'সব' : f === 'active' ? 'চলমান' : 'সম্পন্ন'}
                </Button>
              ))}
            </div>
          </div>

          {filteredClassrooms.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-medium mb-1">কোনো ক্লাসরুম নেই / No classrooms yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  AI শিক্ষকের সাথে পড়াশোনা শুরু করতে ক্লাসরুম তৈরি করো
                </p>
                <CreateClassroomDialog
                  onCreate={handleCreate}
                  trigger={
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      ক্লাসরুম তৈরি করুন / Create Classroom
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ক্লাসরুম মুছে ফেলবে? / Delete Classroom?</AlertDialogTitle>
            <AlertDialogDescription>
              এটি ক্লাসরুম এবং এর সমস্ত ডেটা স্থায়ীভাবে মুছে ফেলবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
              <br />
              This will permanently delete this classroom and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল / Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              মুছুন / Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
