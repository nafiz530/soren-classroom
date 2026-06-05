'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import BoardCanvas, { type BoardCanvasHandle } from '@/components/classroom/BoardCanvas';
import { ModeController } from '@/components/classroom/ModeController';
import { InputBar } from '@/components/classroom/InputBar';
import { ClassroomTransition } from '@/components/classroom/ClassroomTransition';
import { PlaybackControls } from '@/components/classroom/PlaybackControls';
import { useClassroomStore } from '@/stores/classroomStore';
import { useTimelineStore } from '@/stores/timelineStore';
import { useModeStore } from '@/stores/modeStore';
import { SyncEngine } from '@/utils/syncEngine';
import { detectDevice } from '@/utils/deviceDetect';
import type { TimelineEvent, LessonTimeline } from '@/types';
import {
  ArrowLeft,
  GraduationCap,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
} from 'lucide-react';
interface ClassroomViewProps {
  classroomId: string;
  onBack: () => void;
}

export function ClassroomView({ classroomId, onBack }: ClassroomViewProps) {
  const [transitionState, setTransitionState] = useState<'loading' | 'ready' | 'hidden'>('loading');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const boardRef = useRef<BoardCanvasHandle>(null);
  const syncEngineRef = useRef<SyncEngine | null>(null);
  const queryInputRef = useRef('');
  const classroomIdRef = useRef(classroomId);

  const currentClassroom = useClassroomStore((s) => s.classrooms.find((c) => c.id === classroomId));
  const playback = useTimelineStore((s) => s.playback);
  const { renderSettings, currentMode, deviceProfile, setDeviceProfile, startTransition, endTransition } = useModeStore();

  // Initialize device profile
  useEffect(() => {
    const profile = detectDevice();
    setDeviceProfile(profile);
  }, [setDeviceProfile]);

  // Initialize sync engine
  useEffect(() => {
    const sync = new SyncEngine(renderSettings);
    sync.setCanvasEventHandler(async (event: TimelineEvent) => {
      if (boardRef.current) {
        await boardRef.current.processEvent(event);
      }
    });
    syncEngineRef.current = sync;

    return () => {
      sync.destroy();
    };
  }, []);

  // Update render settings when mode changes
  useEffect(() => {
    if (syncEngineRef.current) {
      syncEngineRef.current.updateRenderSettings(renderSettings);
    }
  }, [renderSettings]);

  // Handle transition animation
  useEffect(() => {
    startTransition();
    const timer = setTimeout(() => {
      setTransitionState('ready');
      endTransition();
      setTimeout(() => setTransitionState('hidden'), 800);
    }, 2500);

    return () => clearTimeout(timer);
  }, [startTransition, endTransition]);

  // Generate lesson via API
  const generateLesson = useCallback(
    async (message: string): Promise<LessonTimeline> => {
      const response = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroom_id: classroomIdRef.current,
          query: message,
          classNumber: currentClassroom?.classNumber,
          stream: currentClassroom?.stream,
          subject: currentClassroom?.subject,
          subjectLabel: currentClassroom?.subjectLabel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson');
      }

      return response.json();
    },
    [currentClassroom]
  );

  // Start a lesson with a query
  const handleSendMessage = useCallback(
    async (message: string) => {
      queryInputRef.current = message;
      setIsGenerating(true);
      setError(null);

      try {
        const timeline = await generateLesson(message);

        // Load timeline into sync engine
        if (syncEngineRef.current && boardRef.current) {
          boardRef.current.clear();
          syncEngineRef.current.loadTimeline(timeline);
          syncEngineRef.current.play();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to generate lesson');
      } finally {
        setIsGenerating(false);
      }
    },
    [generateLesson]
  );

  // Playback controls
  const handlePlay = useCallback(() => {
    syncEngineRef.current?.play();
  }, []);

  const handlePause = useCallback(() => {
    syncEngineRef.current?.pause();
  }, []);

  const handleSeek = useCallback((time: number) => {
    syncEngineRef.current?.seek(time);
  }, []);

  const handleRestart = useCallback(() => {
    syncEngineRef.current?.stop();
    boardRef.current?.clear();
    if (queryInputRef.current) {
      handleSendMessage(queryInputRef.current);
    }
  }, [handleSendMessage]);

  // Subject-specific suggestions
  const suggestions = getSuggestions(currentClassroom?.subject);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Transition Overlay */}
      <ClassroomTransition
        isVisible={transitionState !== 'hidden'}
        status={transitionState === 'loading' ? 'loading' : 'ready'}
        classroomName={currentClassroom?.name}
        subject={`${currentClassroom?.subjectIcon || ''} ${currentClassroom?.subjectLabel || ''}`}
      />

      {/* Top Bar */}
      <header className="relative z-20 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between px-3 sm:px-4 h-12">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
              <span className="text-base">{currentClassroom?.subjectIcon}</span>
              <div className="min-w-0">
                <h1 className="text-xs font-semibold truncate max-w-[200px] sm:max-w-none">
                  {currentClassroom?.name || 'Classroom'}
                </h1>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 hidden sm:flex">
              {currentClassroom?.subjectLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            <ModeController />
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
            <Badge
              variant="secondary"
              className={`text-[9px] px-1.5 py-0 gap-1 ${
                playback.status === 'playing'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-muted'
              }`}
            >
              {playback.status === 'playing' && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
              {playback.status === 'idle' && 'Ready'}
              {playback.status === 'loading' && 'Loading...'}
              {playback.status === 'playing' && 'Teaching'}
              {playback.status === 'paused' && 'Paused'}
              {playback.status === 'completed' && 'Complete'}
              {playback.status === 'error' && 'Error'}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Canvas */}
        <div className="flex-1 min-h-0 p-2 sm:p-3">
          <div className="w-full h-full bg-muted/30 rounded-lg overflow-hidden shadow-inner">
            {playback.status === 'idle' && !isGenerating ? (
              /* Welcome state */
              <div className="w-full h-full flex flex-col items-center justify-center text-center px-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                    <span className="text-3xl">{currentClassroom?.subjectIcon || '📚'}</span>
                  </div>
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    {currentClassroom?.subjectLabel || 'Ready to Learn'}
                  </h2>
                  <p className="text-xs text-muted-foreground mb-1">
                    {currentClassroom?.name}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md mb-4">
                    Type a topic, question, or concept below and the AI teacher will
                    create an interactive lesson on the board.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleSendMessage(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : error ? (
              /* Error state */
              <div className="w-full h-full flex flex-col items-center justify-center">
                <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                <p className="text-sm font-medium text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-8"
                  onClick={() => setError(null)}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              /* Canvas renderer */
              <BoardCanvas
                ref={boardRef}
                renderSettings={renderSettings}
                onReady={() => setCanvasReady(true)}
              />
            )}
          </div>
        </div>

        {/* Playback Controls */}
        {playback.status !== 'idle' && (
          <div className="border-t border-border/40 bg-muted/30 px-2 sm:px-3 py-2">
            <PlaybackControls
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              onRestart={handleRestart}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(!isMuted)}
            />
          </div>
        )}

        {/* Input Bar */}
        <div className="border-t border-border/60 bg-background px-3 sm:px-4 py-3">
          <InputBar
            onSend={handleSendMessage}
            isLoading={isGenerating}
            disabled={isGenerating}
            placeholder={
              isGenerating
                ? 'Teacher is preparing...'
                : playback.status === 'playing'
                ? 'Ask a follow-up question...'
                : 'What would you like to learn?'
            }
          />
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">/</kbd> to focus input &middot;{' '}
            Mode: <span className="font-medium capitalize">{currentMode}</span>
            {deviceProfile && (
              <> &middot; GPU: {deviceProfile.gpuTier} tier</>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

function getSuggestions(subject?: string): string[] {
  if (!subject) return ["What is photosynthesis?", "Explain the solar system", "How do plants grow?"];

  const suggestionsBySubject: Record<string, string[]> = {
    'Math': ['Solve algebraic equations', 'Explain geometry basics', 'Fractions and decimals'],
    'Mathematics': ['Solve quadratic equations', 'Explain trigonometry', 'Algebra practice'],
    'Science': ['What is photosynthesis?', 'Explain the water cycle', 'States of matter'],
    'Physics': ['Explain Newton\'s Laws', 'What is gravity?', 'How does light travel?'],
    'Chemistry': ['What is an atom?', 'Explain chemical reactions', 'The periodic table'],
    'Biology': ['How cells work', 'Explain DNA', 'Human body systems'],
    'English': ['Grammar rules', 'How to write an essay', 'Vocabulary building'],
    'English For Today': ['Reading comprehension', 'Grammar practice', 'Writing skills'],
    'ICT': ['What is the internet?', 'How computers work', 'Introduction to programming'],
    'Bangla': ['বাংলা ব্যাকরণ', 'রচনা লেখা', 'কবিতা ব্যাখ্যা'],
    'BGS': ['History of Bangladesh', 'Geography of Bangladesh', 'Culture and heritage'],
    'Bangladesh & Global Studies': ['Geography of Bangladesh', 'Bangladesh independence', 'World geography'],
    'History': ['Ancient civilizations', 'World War II', 'Medieval period'],
    'Geography': ['Climate zones', 'Continents and oceans', 'Map reading'],
    'Accounting': ['Journal entries', 'Balance sheet', 'Financial statements'],
    'Economics': ['Supply and demand', 'Market structures', 'GDP explained'],
    'Islam': ['পাঁচ ওয়াক্ত নামাজ', 'ইসলামের ইতিহাস', 'কুরআনের পরিচয়'],
  };

  return suggestionsBySubject[subject] || [`Explain ${subject} basics`, `What is ${subject}?`, `${subject} important topics`];
}
