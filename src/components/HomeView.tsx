'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClassroomCard } from '@/components/home/ClassroomCard';
import { CreateClassroomDialog } from '@/components/home/CreateClassroomDialog';
import { HistoryViewer } from '@/components/home/HistoryViewer';
import { useClassroomStore } from '@/stores/classroomStore';
import { fetchClassrooms, createClassroom, CLASS_CONFIG } from '@/services/classroom';
import { getSubjectsForClass } from '@/config/curriculum';
import { GraduationCap, LayoutGrid, List } from 'lucide-react';
import type { ClassNumber, SubjectId, ClassroomStatus, Stream } from '@/types';

interface HomeViewProps {
  onEnterClassroom: (classroomId: string) => void;
}

const CLASS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Classes' },
  { value: '6', label: 'Class 6' },
  { value: '7', label: 'Class 7' },
  { value: '8', label: 'Class 8' },
  { value: '9', label: 'Class 9' },
  { value: '10', label: 'Class 10' },
];

export function HomeView({ onEnterClassroom }: HomeViewProps) {
  const {
    classrooms,
    filter,
    isLoading,
    setClassrooms,
    addClassroom,
    setLoading,
    setFilter,
  } = useClassroomStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load classrooms on mount
  useEffect(() => {
    setLoading(true);
    fetchClassrooms().then((data) => {
      setClassrooms(data);
      setLoading(false);
    });
  }, [setClassrooms, setLoading]);

  // Filter classrooms
  const filteredClassrooms = classrooms.filter((c) => {
    if (filter.classNumber !== 'all' && c.classNumber !== filter.classNumber) return false;
    if (filter.subject !== 'all' && c.subject !== filter.subject) return false;
    if (filter.status !== 'all' && c.status !== filter.status) return false;
    return true;
  });

  // Get unique subjects from current filter for subject dropdown
  const availableSubjects = useMemo(() => {
    const source = filter.classNumber !== 'all' ? classrooms.filter(c => c.classNumber === filter.classNumber) : classrooms;
    const subjectMap = new Map<string, { id: SubjectId; label: string; icon: string }>();
    source.forEach((c) => {
      if (!subjectMap.has(c.subject)) {
        subjectMap.set(c.subject, { id: c.subject, label: c.subjectLabel, icon: c.subjectIcon });
      }
    });
    return Array.from(subjectMap.values());
  }, [classrooms, filter.classNumber]);

  // Create classroom handler
  const handleCreate = useCallback(
    async (data: {
      classNumber: ClassNumber;
      stream?: Stream;
      subject: SubjectId;
      subjectLabel: string;
      subjectIcon: string;
      name?: string;
      mode_preset?: string;
    }) => {
      setLoading(true);
      try {
        const result = await createClassroom(data as any);
        const newClassroom: Classroom = {
          id: result.classroom_id,
          name: result.name,
          classNumber: data.classNumber,
          stream: data.stream,
          subject: data.subject,
          subjectLabel: data.subjectLabel,
          subjectIcon: data.subjectIcon,
          status: 'active' as ClassroomStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sessions_count: 0,
          progress: 0,
        };
        addClassroom(newClassroom);
        onEnterClassroom(result.classroom_id);
      } finally {
        setLoading(false);
      }
    },
    [addClassroom, setLoading, onEnterClassroom]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">SorenClass</h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">AI Teaching Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {classrooms.filter((c) => c.status === 'active').length} Active
            </Badge>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Hero Section */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Your Classrooms
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time AI-powered teaching experiences
              </p>
            </div>
            <CreateClassroomDialog onCreate={handleCreate} />
          </div>
        </motion.section>

        {/* Filters */}
        <motion.section
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={String(filter.classNumber)}
              onValueChange={(v) => setFilter({ classNumber: v === 'all' ? 'all' : (parseInt(v) as ClassNumber) })}
            >
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                {CLASS_FILTER_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.subject}
              onValueChange={(v) => setFilter({ subject: v as SubjectId | 'all' })}
            >
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {availableSubjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filter.status}
              onValueChange={(v) =>
                setFilter({ status: v as ClassroomStatus | 'all' })
              }
            >
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode('list')}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Classroom Grid */}
        <motion.section
          className="mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {filteredClassrooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <GraduationCap className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No Classrooms Yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Create your first AI-powered classroom to start an interactive teaching session.
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'flex flex-col gap-3'
              }
            >
              <AnimatePresence mode="popLayout">
                {filteredClassrooms.map((classroom, index) => (
                  <motion.div
                    key={classroom.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ClassroomCard
                      classroom={classroom}
                      onEnter={onEnterClassroom}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.section>

        <Separator className="mb-8" />

        {/* History Section */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <HistoryViewer />
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            class.sorenchat.com — AI Teaching Engine
          </p>
          <p className="text-[11px] text-muted-foreground">
            v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}
