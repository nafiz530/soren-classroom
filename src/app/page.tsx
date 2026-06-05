'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HomeView } from '@/components/HomeView';
import { ClassroomView } from '@/components/ClassroomView';

type View = { type: 'home' } | { type: 'classroom'; classroomId: string };

export default function App() {
  const [view, setView] = useState<View>({ type: 'home' });

  const handleEnterClassroom = useCallback((classroomId: string) => {
    setView({ type: 'classroom', classroomId });
  }, []);

  const handleBackToHome = useCallback(() => {
    setView({ type: 'home' });
  }, []);

  return (
    <AnimatePresence mode="wait">
      {view.type === 'home' ? (
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <HomeView onEnterClassroom={handleEnterClassroom} />
        </motion.div>
      ) : (
        <motion.div
          key={`classroom-${view.classroomId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="h-screen"
        >
          <ClassroomView
            classroomId={view.classroomId}
            onBack={handleBackToHome}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
