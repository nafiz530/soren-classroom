'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Sparkles, Loader2 } from 'lucide-react';

interface ClassroomTransitionProps {
  isVisible: boolean;
  status: 'loading' | 'ready';
  classroomName?: string;
  subject?: string;
}

const LOADING_MESSAGES = [
  'Initializing teacher...',
  'Preparing classroom...',
  'Loading lesson materials...',
  'Setting up the board...',
  'Almost ready...',
];

export function ClassroomTransition({
  isVisible,
  status,
  classroomName,
  subject,
}: ClassroomTransitionProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (status === 'loading' && isVisible) {
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [status, isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Animated logo */}
            <motion.div
              className="relative"
              animate={
                status === 'loading'
                  ? { scale: [1, 1.05, 1] }
                  : { scale: 1 }
              }
              transition={
                status === 'loading'
                  ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
            >
              <div className="relative h-20 w-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-lg shadow-orange-500/25">
                <GraduationCap className="h-10 w-10 text-white" />
                {status === 'loading' && (
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-5 w-5 text-amber-300" />
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Classroom name */}
            {classroomName && (
              <motion.h2
                className="text-lg font-semibold text-foreground text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {classroomName}
              </motion.h2>
            )}

            {subject && (
              <motion.p
                className="text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {subject}
              </motion.p>
            )}

            {/* Status message */}
            <motion.div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <motion.span
                    key={messageIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    {LOADING_MESSAGES[messageIndex]}
                  </motion.span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">Classroom ready!</span>
                </>
              )}
            </motion.div>

            {/* Progress dots */}
            {status === 'loading' && (
              <motion.div
                className="flex gap-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-orange-400"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
