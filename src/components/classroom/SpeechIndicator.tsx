'use client';

import { motion } from 'framer-motion';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

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
  if (!isSpeaking && !speechText && phase === 'idle') return null;

  const getStatusText = () => {
    if (phase === 'loading') return 'শিক্ষক পড়াচ্ছেন... / Teacher is preparing...';
    if (isPaused) return 'বিরতি / Paused';
    if (isSpeaking) return 'শিক্ষক বলছেন / Teacher speaking...';
    if (phase === 'completed') return 'ক্লাস শেষ / Class completed';
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-20"
    >
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-3">
        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full mb-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${speechProgress * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Speech text */}
        <div className="min-h-[2.5rem] max-h-24 overflow-y-auto mb-2">
          <p className="text-xs sm:text-sm leading-relaxed" dir="auto">
            {speechText || getStatusText()}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onTogglePause}
              className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              disabled={phase === 'loading' || phase === 'idle'}
              title={isPaused ? 'চালু করুন / Resume' : 'বিরতি / Pause'}
            >
              {isPaused ? (
                <Play className="h-3.5 w-3.5" />
              ) : (
                <Pause className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={onToggleMute}
              className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              title={isMuted ? 'সাউন্ড চালু / Unmute' : 'মিউট / Mute'}
            >
              {isMuted ? (
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            {isSpeaking && !isMuted && (
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-amber-500 rounded-full"
                    animate={{
                      height: [4, 14, 4],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.12,
                    }}
                  />
                ))}
              </div>
            )}
            {totalIntents > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {currentIntentIndex + 1}/{totalIntents}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
