'use client';

import { useState, useSyncExternalStore } from 'react';
import { HomeView } from '@/components/HomeView';
import { ClassroomView } from '@/components/ClassroomView';
import type { Classroom } from '@/types';

const emptySubscribe = () => () => {};

export default function Page() {
  const [activeClassroom, setActiveClassroom] = useState<Classroom | null>(null);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-white text-lg">🎓</span>
          </div>
          <p className="text-sm text-muted-foreground">সোরেন ক্লাসরুম লোড হচ্ছে...</p>
          <p className="text-xs text-muted-foreground/60">Loading Soren Classroom...</p>
        </div>
      </div>
    );
  }

  if (activeClassroom) {
    return (
      <ClassroomView
        classroom={activeClassroom}
        onBack={() => setActiveClassroom(null)}
      />
    );
  }

  return (
    <HomeView
      onOpenClassroom={(classroom) => setActiveClassroom(classroom)}
    />
  );
}
