'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Pause, Play, ChevronUp, ChevronDown } from 'lucide-react';

interface SpeechIndicatorProps {
  isSpeaking: boolean;
  isPaused: boolean;
  isMuted: boolean;
  speechText: string;
  speechProgress: number;
  phase: string;
  currentIntentIndex: number;
  totalIntents: number;
  onToggleMute: () => void;
  onTogglePause: () => void;
}

const PHASE_BN: Record<string, string> = {
  idle: 'প্রস্তুত',
  loading: 'পাঠ তৈরি হচ্ছে...',
  introducing: 'পরিচয় দিচ্ছি',
  explaining: 'বুঝাচ্ছি',
  exampling: 'উদাহরণ দিচ্ছি',
  quizzing: 'প্রশ্ন করছি',
  recapping: 'সারসংক্ষেপ',
  completed: '✓ পাঠ শেষ!',
  error: 'সমস্যা হয়েছে',
};

export function SpeechIndicator({
  isSpeaking,
  isPaused,
  isMuted,
  speechText,
  speechProgress,
  phase,
  currentIntentIndex,
  totalIntents,
  onToggleMute,
  onTogglePause,
}: SpeechIndicatorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [displayText, setDisplayText] = useState('');

  // Smooth text transition
  useEffect(() => {
    if (speechText) {
      setDisplayText(speechText);
    }
  }, [speechText]);

  const isActive = isSpeaking || phase === 'loading' || (phase !== 'idle' && phase !== 'completed' && phase !== 'error');

  if (!isActive && !speechText) return null;

  const phaseLabelBn = PHASE_BN[phase] || phase;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="speech-indicator mx-2 sm:mx-3 mb-2"
      >
        <div
          className="rounded-xl border overflow-hidden shadow-md"
          style={{
            background: 'rgba(var(--card), 0.97)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(var(--border), 0.8)',
          }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-muted/50 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: phase === 'quizzing'
                  ? 'linear-gradient(90deg, #f43f5e, #ec4899)'
                  : phase === 'completed'
                  ? '#10b981'
                  : 'linear-gradient(90deg, #f59e0b, #ef4444)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${speechProgress * 100}%` }}
              transition={{ duration: 0.3, ease: 'linear' }}
            />
          </div>

          <div className="px-3 py-2">
            {/* Top row: phase label + controls + collapse */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {/* Wave animation */}
                {isSpeaking && !isMuted && !isPaused && (
                  <div className="flex items-center gap-0.5 h-4">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 rounded-full"
                        style={{ background: '#f59e0b' }}
                        animate={{ height: ['3px', '10px', '3px'] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Phase label */}
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: phase === 'loading' ? '#f59e0b' : phase === 'completed' ? '#10b981' : undefined,
                  }}
                >
                  {phaseLabelBn}
                </span>

                {totalIntents > 0 && (
                  <span className="text-[9px] text-muted-foreground">
                    {currentIntentIndex + 1}/{totalIntents}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5">
                {/* Pause/Play */}
                <button
                  onClick={onTogglePause}
                  className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                  disabled={phase === 'loading' || phase === 'idle'}
                  title={isPaused ? 'চালু করো' : 'থামাও'}
                >
                  {isPaused ? (
                    <Play className="h-3 w-3" />
                  ) : (
                    <Pause className="h-3 w-3" />
                  )}
                </button>

                {/* Mute */}
                <button
                  onClick={onToggleMute}
                  className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                  title={isMuted ? 'আনমিউট' : 'মিউট'}
                >
                  {isMuted ? (
                    <VolumeX className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Volume2 className="h-3 w-3" />
                  )}
                </button>

                {/* Collapse toggle */}
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted transition-colors ml-0.5"
                  title={collapsed ? 'বিস্তার করো' : 'ছোট করো'}
                >
                  {collapsed ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Speech text */}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="text-xs sm:text-sm leading-relaxed text-foreground/90"
                    style={{
                      maxHeight: '80px',
                      overflowY: 'auto',
                      scrollbarWidth: 'none',
                      fontFamily: displayText && /[\u0980-\u09FF]/.test(displayText)
                        ? '"Noto Sans Bengali", "SolaimanLipi", sans-serif'
                        : undefined,
                    }}
                  >
                    {phase === 'loading' ? (
                      <span className="text-muted-foreground italic">
                        স্যার পাঠ তৈরি করছেন...
                      </span>
                    ) : (
                      displayText || (
                        <span className="text-muted-foreground italic">
                          একটি বিষয় জিজ্ঞেস করো স্যারকে...
                        </span>
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
