'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Settings, Volume2, VolumeX, Maximize2, Minimize2, BookOpen, GraduationCap } from 'lucide-react';
import { ChalkBoard } from './classroom/ChalkBoard';
import { SpeechIndicator } from './classroom/SpeechIndicator';
import { InputBar } from './classroom/InputBar';
import { QuizOverlay } from './classroom/QuizOverlay';
import { TokenDisplay } from './classroom/TokenDisplay';
import { useFlowStore } from '@/stores/flowStore';
import { useClassroomStore } from '@/stores/classroomStore';
import { useTokenStore } from '@/stores/tokenStore';
import { useProgressStore } from '@/stores/progressStore';
import { FlowController } from '@/engine/FlowController';
import { storage } from '@/services/storage';
import { classroomMemory } from '@/services/classroomMemory';
import { generateLesson, generateFollowUp } from '@/services/lessonService';
import { TEACHER_PERSONAS } from '@/config/curriculum';
import type {
  Classroom,
  LessonPlan,
  TeachingIntent,
  TokenUsage,
  LanguageMode,
  TeacherPersona,
  SavedSession,
  FlowPhase,
  BoardBlock,
  QuizAnswer,
} from '@/types';

interface ClassroomViewProps {
  classroom: Classroom;
  onBack: () => void;
}

const PHASE_LABELS: Record<FlowPhase, { label: string; labelBn: string; color: string }> = {
  idle: { label: 'Ready', labelBn: 'প্রস্তুত', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  loading: { label: 'Thinking...', labelBn: 'ভাবছি...', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  introducing: { label: 'Introducing', labelBn: 'পরিচয় দিচ্ছি', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300' },
  explaining: { label: 'Explaining', labelBn: 'বুঝাচ্ছি', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  exampling: { label: 'Example', labelBn: 'উদাহরণ', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  quizzing: { label: 'Quiz', labelBn: 'প্রশ্ন', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
  recapping: { label: 'Recap', labelBn: 'সারসংক্ষেপ', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  completed: { label: 'Done', labelBn: 'শেষ!', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  error: { label: 'Error', labelBn: 'সমস্যা', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

// Teacher avatar persona display
const PERSONA_DISPLAY: Record<TeacherPersona, { emoji: string; nameBn: string }> = {
  friendly_teacher: { emoji: '😊', nameBn: 'বন্ধুত্বপূর্ণ স্যার' },
  strict_teacher: { emoji: '👨‍🏫', nameBn: 'কঠোর স্যার' },
  exam_coach: { emoji: '🎯', nameBn: 'পরীক্ষার কোচ' },
  slow_explainer: { emoji: '🐢', nameBn: 'ধীর ব্যাখ্যাকারী' },
  bilingual_first: { emoji: '🌐', nameBn: 'দ্বিভাষিক স্যার' },
};

export function ClassroomView({ classroom, onBack }: ClassroomViewProps) {
  const flowControllerRef = useRef<FlowController | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [isWriting, setIsWriting] = useState(false);

  const {
    phase, setPhase,
    currentIntentIndex, setCurrentIntentIndex,
    isSpeaking, setIsSpeaking,
    speechProgress, speechText, setSpeechProgress,
    boardBlocks, setBoardBlocks,
    currentIntent, setCurrentIntent,
    languageMode, setLanguageMode,
    teacherPersona, setTeacherPersona,
    teacherSpeed, setTeacherSpeed,
    isMuted, setIsMuted,
    elapsedTime, setElapsedTime,
    activeQuiz, setActiveQuiz,
    reset,
  } = useFlowStore();

  const { updateClassroom, incrementSessions } = useClassroomStore();
  const { recordUsage } = useTokenStore();
  const { recordQuizAnswer, incrementTopics } = useProgressStore();

  // Initialize FlowController
  useEffect(() => {
    const fc = new FlowController();
    flowControllerRef.current = fc;

    fc.onPhaseChange((p: FlowPhase) => setPhase(p));
    fc.onBoardUpdate((blocks: BoardBlock[]) => {
      setBoardBlocks(blocks);
      setIsWriting(true);
      setTimeout(() => setIsWriting(false), 1500);
    });
    fc.onQuiz((quiz: TeachingIntent['quiz']) => setActiveQuiz(quiz));
    fc.onSpeechProgress((progress: number, text: string) => {
      setSpeechProgress(progress, text);
      setIsSpeaking(progress < 1);
    });
    fc.onIntentChange((index: number, intent: TeachingIntent) => {
      setCurrentIntentIndex(index);
      setCurrentIntent(intent);
    });
    fc.onAutoSave(() => autoSaveSession());

    fc.getSpeechEngine().setLanguageMode(languageMode);
    fc.getSpeechEngine().setTeacherSpeed(teacherSpeed);
    if (isMuted) fc.getSpeechEngine().setMuted(true);

    const savedSession = storage.getSession();
    if (savedSession && savedSession.classroom_id === classroom.id) {
      fc.loadLessonPlan(savedSession.lessonPlan);
      fc.jumpToIntent(savedSession.currentIntentIndex);
      setLessonPlan(savedSession.lessonPlan);
      setElapsedTime(savedSession.elapsedTime);
      for (const block of savedSession.boardBlocks) {
        fc.getBoardManager().addBlock({
          type: block.type,
          zone: block.zone,
          importance: block.importance,
          persist: block.persist,
          lifespan: block.lifespan,
          text: block.text,
          localizedText: block.localizedText,
          formulaText: block.formulaText,
          tableData: block.tableData,
          graphData: block.graphData,
        });
      }
      setBoardBlocks(fc.getBoardBlocks());
    }

    return () => {
      fc.stop();
      autoSaveSession();
    };
  }, []);

  useEffect(() => {
    const fc = flowControllerRef.current;
    if (!fc) return;
    fc.getSpeechEngine().setLanguageMode(languageMode);
  }, [languageMode]);

  useEffect(() => {
    const fc = flowControllerRef.current;
    if (!fc) return;
    fc.getSpeechEngine().setTeacherSpeed(teacherSpeed);
  }, [teacherSpeed]);

  useEffect(() => {
    const fc = flowControllerRef.current;
    if (!fc) return;
    fc.getSpeechEngine().setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    const interval = setInterval(() => {
      const fc = flowControllerRef.current;
      if (fc && fc.getIsRunning()) {
        setElapsedTime(fc.getElapsedTime());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [setElapsedTime]);

  const autoSaveSession = useCallback(() => {
    const fc = flowControllerRef.current;
    if (!fc || !lessonPlan) return;
    const session: SavedSession = {
      phase: fc.getPhase(),
      currentIntentIndex: fc.getCurrentIndex(),
      classroom_id: classroom.id,
      lessonPlan,
      boardBlocks: fc.getBoardBlocks(),
      saved_at: new Date().toISOString(),
      elapsedTime: fc.getElapsedTime(),
    };
    storage.saveSession(session);
  }, [lessonPlan, classroom.id]);

  const handleGenerateLesson = async (query: string) => {
    const fc = flowControllerRef.current;
    if (!fc) return;

    setPhase('loading');
    setIsSpeaking(false);
    setActiveQuiz(null);

    try {
      const context = classroomMemory.buildContextForPrompt(classroom.id);
      const result = await generateLesson({
        classroom_id: classroom.id,
        query,
        classNumber: classroom.classNumber,
        subject: classroom.subject,
        subjectLabel: classroom.subjectLabel,
        teacher_persona: teacherPersona,
        context,
      });

      const lesson: LessonPlan = result.lesson;
      setLessonPlan(lesson);

      try {
        const tokenData: TokenUsage = result.tokens;
        recordUsage(tokenData);
      } catch { /* ignore */ }

      classroomMemory.addEntry(classroom.id, query, lesson);
      incrementSessions(classroom.id);
      updateClassroom(classroom.id, {
        last_session_summary: lesson.title,
        current_lesson_id: lesson.lesson_id,
      });

      fc.loadLessonPlan(lesson);
      fc.play();
    } catch (err) {
      console.error('Lesson generation failed:', err);
      setPhase('error');
    }
  };

  const handleFollowUp = async (query: string) => {
    const fc = flowControllerRef.current;
    if (!fc) return;

    fc.stop();
    setPhase('loading');
    setActiveQuiz(null);

    try {
      const context = classroomMemory.buildContextForPrompt(classroom.id);
      const result = await generateFollowUp({
        classroom_id: classroom.id,
        query,
        classNumber: classroom.classNumber,
        subject: classroom.subject,
        subjectLabel: classroom.subjectLabel,
        teacher_persona: teacherPersona,
        context,
      });

      const lesson: LessonPlan = result.lesson;
      setLessonPlan(lesson);

      try {
        const tokenData: TokenUsage = result.tokens;
        recordUsage(tokenData);
      } catch { /* ignore */ }

      classroomMemory.addEntry(classroom.id, query, lesson);
      updateClassroom(classroom.id, { last_session_summary: lesson.title });

      fc.loadLessonPlan(lesson);
      fc.play();
    } catch (err) {
      console.error('Follow-up generation failed:', err);
      setPhase('error');
    }
  };

  const handleInput = (query: string) => {
    if (phase === 'idle' || phase === 'completed' || phase === 'error') {
      handleGenerateLesson(query);
    } else {
      handleFollowUp(query);
    }
  };

  const handleQuizAnswer = (answer: string) => {
    const fc = flowControllerRef.current;
    if (!fc || !activeQuiz) return;

    const isCorrect = answer === activeQuiz.correctAnswer;
    const quizAnswer: QuizAnswer = {
      question: activeQuiz.questionText.en,
      studentAnswer: answer,
      correctAnswer: activeQuiz.correctAnswer,
      isCorrect,
      timestamp: new Date().toISOString(),
      classroom_id: classroom.id,
      subject: classroom.subject,
    };
    recordQuizAnswer(quizAnswer);

    if (!isCorrect && activeQuiz.explanation) {
      useProgressStore.getState().addWeakArea(classroom.subject, activeQuiz.questionText.en.substring(0, 50));
    }

    setActiveQuiz(null);
    fc.submitQuizAnswer(answer);
  };

  const handleTogglePause = () => {
    const fc = flowControllerRef.current;
    if (!fc) return;
    if (fc.getIsPaused()) fc.play();
    else fc.pause();
  };

  const handleToggleMute = () => setIsMuted(!isMuted);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalIntents = lessonPlan?.intents.length || 0;
  const phaseInfo = PHASE_LABELS[phase] || PHASE_LABELS.idle;
  const personaInfo = PERSONA_DISPLAY[teacherPersona] || PERSONA_DISPLAY.friendly_teacher;

  const getPlaceholder = () => {
    if (phase === 'idle') return 'কী শিখতে চাও আজ? (যেকোনো বিষয় লেখো)';
    if (phase === 'completed') return 'আরেকটি প্রশ্ন করো অথবা নতুন বিষয় লেখো...';
    if (phase === 'loading') return 'একটু অপেক্ষা করো...';
    return 'প্রশ্ন করো অথবা "আরো বলো" লেখো...';
  };

  return (
    <div className={`classroom-root ${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'} flex flex-col bg-background overflow-hidden`}>

      {/* ─── TOP BAR ─── */}
      <header className="classroom-header shrink-0 border-b border-border bg-card/90 backdrop-blur-md px-2 sm:px-4 py-2 flex items-center gap-2 z-30 shadow-sm">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack} title="পেছনে যাও">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Subject info */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-xl leading-none">{classroom.subjectIcon}</span>
          <div className="min-w-0 hidden sm:block">
            <h1 className="text-sm font-semibold truncate">{classroom.name}</h1>
            <p className="text-[10px] text-muted-foreground">
              Class {classroom.classNumber}
              {classroom.stream ? ` • ${classroom.stream}` : ''} • {formatTime(elapsedTime)}
            </p>
          </div>
          <div className="sm:hidden min-w-0">
            <h1 className="text-xs font-semibold truncate">{classroom.subjectLabel}</h1>
          </div>
        </div>

        {/* Phase badge */}
        <Badge variant="secondary" className={`text-[10px] shrink-0 px-2 py-0.5 ${phaseInfo.color}`}>
          {phaseInfo.labelBn}
        </Badge>

        {/* Teacher persona indicator */}
        <div className="hidden md:flex items-center gap-1 shrink-0 text-[10px] text-muted-foreground">
          <span>{personaInfo.emoji}</span>
          <span className="hidden lg:inline">{personaInfo.nameBn}</span>
        </div>

        {/* Language Mode Toggle */}
        <Select value={languageMode} onValueChange={(v) => setLanguageMode(v as LanguageMode)}>
          <SelectTrigger className="h-7 w-14 sm:w-16 text-[10px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">EN</SelectItem>
            <SelectItem value="bn">বাং</SelectItem>
            <SelectItem value="both">দুটো</SelectItem>
          </SelectContent>
        </Select>

        {/* Persona Selector */}
        <Select value={teacherPersona} onValueChange={(v) => setTeacherPersona(v as TeacherPersona)}>
          <SelectTrigger className="h-7 w-7 p-0 shrink-0 flex items-center justify-center">
            <Settings className="h-3.5 w-3.5" />
          </SelectTrigger>
          <SelectContent>
            {TEACHER_PERSONAS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.icon} {p.labelBn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mute */}
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleToggleMute} title={isMuted ? 'আনমিউট' : 'মিউট'}>
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </Button>

        {/* Fullscreen */}
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 hidden sm:flex" onClick={() => setIsFullscreen(!isFullscreen)}>
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </Button>
      </header>

      {/* ─── MAIN CLASSROOM AREA ─── */}
      <div className="classroom-body flex-1 relative overflow-hidden flex flex-col md:flex-row">

        {/* ─── LEFT: TEACHER PANEL (hidden on mobile, sidebar on tablet+) ─── */}
        <aside className="hidden lg:flex classroom-teacher-panel w-[180px] xl:w-[200px] shrink-0 border-r border-border/50 bg-card/40 flex-col items-center py-4 gap-3">
          {/* Teacher avatar */}
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{
              background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
              border: '2px solid rgba(102,126,234,0.2)',
            }}
          >
            <span>{personaInfo.emoji}</span>
            {/* Speaking ring */}
            {isSpeaking && !isMuted && (
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  border: '2px solid rgba(102,126,234,0.5)',
                  animation: 'speakRing 1s ease-out infinite',
                }}
              />
            )}
          </div>

          <div className="text-center px-2">
            <p className="text-xs font-semibold">{personaInfo.nameBn}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{classroom.subjectLabel}</p>
          </div>

          {/* Progress dots */}
          {totalIntents > 0 && (
            <div className="w-full px-3 mt-2">
              <p className="text-[9px] text-muted-foreground mb-1.5 text-center">অগ্রগতি</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {lessonPlan?.intents.map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      background: i < currentIntentIndex
                        ? '#10b981'
                        : i === currentIntentIndex
                        ? '#f59e0b'
                        : 'rgba(255,255,255,0.1)',
                      transform: i === currentIntentIndex ? 'scale(1.3)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
                {currentIntentIndex + 1} / {totalIntents}
              </p>
            </div>
          )}

          {/* Subject info */}
          <div className="mt-auto w-full px-3 pb-2">
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <GraduationCap className="h-3 w-3 mx-auto mb-1 text-muted-foreground" />
              <p className="text-[9px] text-muted-foreground">Class {classroom.classNumber}</p>
              {classroom.stream && (
                <p className="text-[9px] text-muted-foreground">{classroom.stream}</p>
              )}
              <p className="text-[9px] font-medium mt-0.5">{formatTime(elapsedTime)}</p>
            </div>
          </div>
        </aside>

        {/* ─── CENTER: CHALKBOARD ─── */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {/* Chalkboard area — takes 60% on mobile stacked, full height on desktop */}
          <div className="classroom-board flex-1 p-2 sm:p-3 md:p-4 relative overflow-hidden" style={{ minHeight: 0 }}>
            <ChalkBoard
              blocks={boardBlocks}
              languageMode={languageMode}
              isWriting={isWriting}
              className="w-full h-full"
            />

            {/* Token display */}
            <div className="absolute top-3 right-3 z-20">
              <TokenDisplay />
            </div>

            {/* Mobile progress bar (top of board on mobile) */}
            {totalIntents > 0 && (
              <div className="absolute top-3 left-3 z-20 lg:hidden">
                <div className="bg-card/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-border/50">
                  <div className="flex gap-0.5">
                    {lessonPlan?.intents.map((_, i) => (
                      <div
                        key={i}
                        className="h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(3, 60 / totalIntents)}px`,
                          background: i < currentIntentIndex
                            ? '#10b981'
                            : i === currentIntentIndex
                            ? '#f59e0b'
                            : 'rgba(0,0,0,0.1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── SPEECH PANEL (below board on mobile, overlaid on desktop) ─── */}
          <div className="classroom-speech shrink-0">
            <SpeechIndicator
              isSpeaking={isSpeaking}
              isPaused={flowControllerRef.current?.getIsPaused() || false}
              isMuted={isMuted}
              speechText={speechText}
              speechProgress={speechProgress}
              phase={phase}
              currentIntentIndex={currentIntentIndex}
              totalIntents={totalIntents}
              onToggleMute={handleToggleMute}
              onTogglePause={handleTogglePause}
            />
          </div>
        </main>
      </div>

      {/* Quiz Overlay */}
      {activeQuiz && (
        <QuizOverlay
          quiz={activeQuiz}
          languageMode={languageMode}
          onSubmit={handleQuizAnswer}
        />
      )}

      {/* ─── INPUT BAR ─── */}
      <InputBar
        onSubmit={handleInput}
        isLoading={phase === 'loading'}
        placeholder={getPlaceholder()}
      />

      <style>{`
        @keyframes speakRing {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        /* Mobile: board takes 55vh, speech below */
        @media (max-width: 767px) {
          .classroom-board { min-height: 45vh; max-height: 55vh; flex: none; }
          .classroom-speech { padding: 8px; }
        }
        /* Tablet: board fills most, speech overlaid */
        @media (min-width: 768px) and (max-width: 1023px) {
          .classroom-board { flex: 1; }
        }
      `}</style>
    </div>
  );
}
