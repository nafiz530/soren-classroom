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
import { ArrowLeft, Settings, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { SpatialBoard } from './classroom/SpatialBoard';
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

const PHASE_LABELS: Record<FlowPhase, { label: string; color: string }> = {
  idle: { label: 'Ready', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  loading: { label: 'Generating...', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  introducing: { label: 'Introducing', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300' },
  explaining: { label: 'Explaining', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  exampling: { label: 'Example', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  quizzing: { label: 'Quiz', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
  recapping: { label: 'Recap', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  error: { label: 'Error', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

export function ClassroomView({ classroom, onBack }: ClassroomViewProps) {
  const flowControllerRef = useRef<FlowController | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);

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

    // Wire callbacks
    fc.onPhaseChange((p: FlowPhase) => setPhase(p));
    fc.onBoardUpdate((blocks: BoardBlock[]) => setBoardBlocks(blocks));
    fc.onQuiz((quiz: TeachingIntent['quiz']) => setActiveQuiz(quiz));
    fc.onSpeechProgress((progress: number, text: string) => {
      setSpeechProgress(progress, text);
      setIsSpeaking(progress < 1);
    });
    fc.onIntentChange((index: number, intent: TeachingIntent) => {
      setCurrentIntentIndex(index);
      setCurrentIntent(intent);
    });
    fc.onAutoSave(() => {
      autoSaveSession();
    });

    // Restore teacher settings
    fc.getSpeechEngine().setLanguageMode(languageMode);
    fc.getSpeechEngine().setTeacherSpeed(teacherSpeed);
    if (isMuted) {
      fc.getSpeechEngine().setMuted(true);
    }

    // Try to restore session
    const savedSession = storage.getSession();
    if (savedSession && savedSession.classroom_id === classroom.id) {
      fc.loadLessonPlan(savedSession.lessonPlan);
      fc.jumpToIntent(savedSession.currentIntentIndex);
      setLessonPlan(savedSession.lessonPlan);
      setElapsedTime(savedSession.elapsedTime);
      // Restore board blocks
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

  // Update speech engine when settings change
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

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const fc = flowControllerRef.current;
      if (fc && fc.getIsRunning()) {
        setElapsedTime(fc.getElapsedTime());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [setElapsedTime]);

  // Auto-save session
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

  // Generate lesson
  const handleGenerateLesson = async (query: string) => {
    const fc = flowControllerRef.current;
    if (!fc) return;

    setPhase('loading');
    setIsSpeaking(false);
    setActiveQuiz(null);

    try {
      // Build context from memory
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

      // Track tokens
      try {
        const tokenData: TokenUsage = result.tokens;
        recordUsage(tokenData);
      } catch {
        // Ignore token parsing errors
      }

      // Save to memory
      classroomMemory.addEntry(classroom.id, query, lesson);

      // Update classroom
      incrementSessions(classroom.id);
      updateClassroom(classroom.id, {
        last_session_summary: lesson.title,
        current_lesson_id: lesson.lesson_id,
      });

      // Load lesson into FlowController and play
      fc.loadLessonPlan(lesson);
      fc.play();
    } catch (err) {
      console.error('Lesson generation failed:', err);
      setPhase('error');
    }
  };

  // Generate follow-up
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

      // Track tokens
      try {
        const tokenData: TokenUsage = result.tokens;
        recordUsage(tokenData);
      } catch {
        // Ignore
      }

      classroomMemory.addEntry(classroom.id, query, lesson);
      updateClassroom(classroom.id, { last_session_summary: lesson.title });

      fc.loadLessonPlan(lesson);
      fc.play();
    } catch (err) {
      console.error('Follow-up generation failed:', err);
      setPhase('error');
    }
  };

  // Handle user input
  const handleInput = (query: string) => {
    if (phase === 'idle' || phase === 'completed' || phase === 'error') {
      handleGenerateLesson(query);
    } else {
      // During lesson, treat as follow-up
      handleFollowUp(query);
    }
  };

  // Handle quiz answer
  const handleQuizAnswer = (answer: string) => {
    const fc = flowControllerRef.current;
    if (!fc || !activeQuiz) return;

    const isCorrect = answer === activeQuiz.correctAnswer;

    // Record progress
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

  // Toggle pause/play
  const handleTogglePause = () => {
    const fc = flowControllerRef.current;
    if (!fc) return;

    if (fc.getIsPaused()) {
      fc.play();
    } else {
      fc.pause();
    }
  };

  // Toggle mute
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalIntents = lessonPlan?.intents.length || 0;
  const phaseInfo = PHASE_LABELS[phase] || PHASE_LABELS.idle;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="shrink-0 border-b border-border bg-card/80 backdrop-blur-sm px-3 py-2 flex items-center gap-2 z-30">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-lg">{classroom.subjectIcon}</span>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">{classroom.name}</h1>
            <p className="text-[10px] text-muted-foreground">
              Class {classroom.classNumber}
              {classroom.stream ? ` • ${classroom.stream}` : ''} • {formatTime(elapsedTime)}
            </p>
          </div>
        </div>

        <Badge variant="secondary" className={`text-[10px] shrink-0 ${phaseInfo.color}`}>
          {phaseInfo.label}
        </Badge>

        {/* Language Mode Toggle */}
        <Select value={languageMode} onValueChange={(v) => setLanguageMode(v as LanguageMode)}>
          <SelectTrigger className="h-7 w-16 text-[10px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">EN</SelectItem>
            <SelectItem value="bn">বাং</SelectItem>
            <SelectItem value="both">Both</SelectItem>
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
                {p.icon} {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mute */}
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleToggleMute}>
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </Button>

        {/* Fullscreen */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 hidden sm:flex"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </Button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Spatial Board */}
        <SpatialBoard
          blocks={boardBlocks}
          languageMode={languageMode}
          className="absolute inset-0"
        />

        {/* Speech Indicator */}
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

        {/* Quiz Overlay */}
        {activeQuiz && (
          <QuizOverlay
            quiz={activeQuiz}
            languageMode={languageMode}
            onSubmit={handleQuizAnswer}
          />
        )}

        {/* Token Display */}
        <div className="absolute top-2 right-2 z-20">
          <TokenDisplay />
        </div>

        {/* Progress indicator */}
        {totalIntents > 0 && (
          <div className="absolute top-2 left-2 z-20">
            <div className="bg-card/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-border/50">
              <div className="flex gap-0.5">
                {lessonPlan?.intents.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-3 rounded-full transition-colors ${
                      i < currentIntentIndex
                        ? 'bg-emerald-500'
                        : i === currentIntentIndex
                        ? 'bg-amber-500'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <InputBar
        onSubmit={handleInput}
        isLoading={phase === 'loading'}
        placeholder={
          phase === 'idle'
            ? 'Enter a topic to start learning...'
            : phase === 'completed'
            ? 'Ask another question or enter a new topic...'
            : 'Ask a follow-up question...'
        }
      />
    </div>
  );
}
