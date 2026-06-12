import type {
  TeachingIntent,
  LessonPlan,
  FlowPhase,
  BoardBlock,
  BoardContentType,
  TeachingPriority,
} from '@/types';
import { SpeechStreamEngine } from './SpeechStreamEngine';
import { BoardManager } from './BoardManager';
import { PacingEngine } from './PacingEngine';
import { EventBus, globalEventBus } from './EventBus';

const INTENT_PHASE_MAP: Record<string, FlowPhase> = {
  introduce: 'introducing',
  explain_concept: 'explaining',
  provide_example: 'exampling',
  quiz_student: 'quizzing',
  recap: 'recapping',
  transition: 'explaining',
  interact: 'explaining',
};

export class FlowController {
  private intents: TeachingIntent[] = [];
  private currentIndex = 0;
  private phase: FlowPhase = 'idle';
  private speechEngine: SpeechStreamEngine;
  private boardManager: BoardManager;
  private pacingEngine: PacingEngine;
  private eventBus: EventBus;
  private isRunning = false;
  private isPaused = false;
  private elapsedTime = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private pendingQuizResolve: ((answer: string) => void) | null = null;
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;

  // Callbacks for UI
  private onPhaseChangeCallback: ((phase: FlowPhase) => void) | null = null;
  private onBoardUpdateCallback: ((blocks: BoardBlock[]) => void) | null = null;
  private onQuizCallback: ((quiz: TeachingIntent['quiz']) => void) | null = null;
  private onSpeechProgressCallback: ((progress: number, text: string) => void) | null = null;
  private onIntentChangeCallback: ((index: number, intent: TeachingIntent) => void) | null = null;
  private onAutoSaveCallback: (() => void) | null = null;

  constructor() {
    this.speechEngine = new SpeechStreamEngine();
    this.boardManager = new BoardManager();
    this.pacingEngine = new PacingEngine();
    this.eventBus = globalEventBus;

    // Wire speech progress
    this.speechEngine.onProgress((progress, text) => {
      if (this.onSpeechProgressCallback) {
        this.onSpeechProgressCallback(progress, text);
      }
    });
  }

  loadLessonPlan(plan: LessonPlan): void {
    this.stop();
    this.intents = plan.intents;
    this.currentIndex = 0;
    this.phase = 'idle';
    this.boardManager.clearAll();
    this.elapsedTime = 0;

    this.emitPhase('idle');
    this.emitBoardUpdate();
  }

  play(): void {
    if (this.intents.length === 0) return;

    if (this.isPaused) {
      this.isPaused = false;
      this.speechEngine.resume();
      this.startTimer();
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.startTimer();
    this.startAutoSave();
    this.processCurrentIntent();
  }

  pause(): void {
    this.isPaused = true;
    this.isRunning = false;
    this.speechEngine.pause();
    this.stopTimer();
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.speechEngine.stop();
    this.stopTimer();
    this.stopAutoSave();
    this.phase = 'idle';
    this.emitPhase('idle');
  }

  submitQuizAnswer(answer: string): void {
    if (this.pendingQuizResolve) {
      this.pendingQuizResolve(answer);
      this.pendingQuizResolve = null;
    }
  }

  advanceToNextIntent(): void {
    if (this.currentIndex < this.intents.length - 1) {
      this.currentIndex++;
      this.processCurrentIntent();
    } else {
      this.complete();
    }
  }

  jumpToIntent(index: number): void {
    if (index >= 0 && index < this.intents.length) {
      this.speechEngine.stop();
      this.currentIndex = index;
      this.processCurrentIntent();
    }
  }

  private async processCurrentIntent(): Promise<void> {
    if (!this.isRunning || this.currentIndex >= this.intents.length) {
      if (this.currentIndex >= this.intents.length) {
        this.complete();
      }
      return;
    }

    const intent = this.intents[this.currentIndex];
    const newPhase = INTENT_PHASE_MAP[intent.intent] || 'explaining';
    this.emitPhase(newPhase);
    this.phase = newPhase;

    if (this.onIntentChangeCallback) {
      this.onIntentChangeCallback(this.currentIndex, intent);
    }

    // Clear section-level blocks on concept transitions
    if (intent.intent === 'introduce' || intent.intent === 'transition') {
      this.boardManager.clearSection();
    }

    // Process speech and board in PARALLEL
    const promises: Promise<void>[] = [];

    // Speech
    if (intent.actions.includes('speak')) {
      promises.push(this.processSpeech(intent));
    }

    // Board write (runs in parallel with speech)
    if (intent.actions.includes('board_write') && intent.content.board) {
      promises.push(this.processBoardWrite(intent));
    }

    // Board highlight
    if (intent.actions.includes('board_highlight') && intent.content.board) {
      this.highlightBoardContent(intent.content.board.text);
    }

    // Wait for parallel tasks
    await Promise.all(promises);

    // Quiz handling (pauses flow)
    if (intent.actions.includes('quiz') && intent.quiz) {
      await this.processQuiz(intent);
    }

    // Get pacing delay for next intent
    const delay = this.pacingEngine.getPacingDelay(intent.intent);

    if (this.isRunning && delay > 0) {
      await this.wait(delay);
    }

    // Advance to next intent
    if (this.isRunning) {
      this.advanceToNextIntent();
    }
  }

  private async processSpeech(intent: TeachingIntent): Promise<void> {
    try {
      await this.speechEngine.stream(intent.content.speech, intent.content.speechBn);
    } catch (err) {
      console.warn('[FlowController] Speech error:', err);
    }
  }

  private async processBoardWrite(intent: TeachingIntent): Promise<void> {
    const board = intent.content.board;
    if (!board) return;

    const priority = intent.priority as TeachingPriority;
    const lifespan = this.determineLifespan(board.type);

    this.boardManager.addBlock({
      type: board.type as BoardContentType,
      zone: this.boardManager.assignZone(board.type as BoardContentType),
      importance: priority,
      persist: priority === 'critical' || priority === 'high',
      lifespan,
      text: board.text,
      localizedText: board.textBn ? { en: board.text, bn: board.textBn } : undefined,
      formulaText: board.formulaText,
      tableData: board.tableData,
      graphData: board.graphData,
      diagramData: board.diagramData,
      chalkLines: (board as any).chalkLines,
      chalkColor: (board as any).chalkColor,
    });

    this.emitBoardUpdate();
  }

  private highlightBoardContent(text: string): void {
    const blocks = this.boardManager.getBlocks();
    const matchingBlock = blocks.find((b) => b.text === text);
    if (matchingBlock) {
      this.boardManager.updateBlock(matchingBlock.id, { color: '#f59e0b' });
      this.emitBoardUpdate();

      // Reset color after 2 seconds
      setTimeout(() => {
        this.boardManager.updateBlock(matchingBlock.id, { color: undefined });
        this.emitBoardUpdate();
      }, 2000);
    }
  }

  private async processQuiz(intent: TeachingIntent): Promise<void> {
    if (!intent.quiz) return;

    this.emitPhase('quizzing');
    if (this.onQuizCallback) {
      this.onQuizCallback(intent.quiz);
    }

    // Wait for user answer
    return new Promise((resolve) => {
      this.pendingQuizResolve = resolve;
    });
  }

  private determineLifespan(type: BoardContentType): BoardBlock['lifespan'] {
    switch (type) {
      case 'definition':
      case 'formula':
        return 'lesson';
      case 'concept':
      case 'table':
        return 'section';
      default:
        return 'temporary';
    }
  }

  private complete(): void {
    this.isRunning = false;
    this.stopTimer();
    this.stopAutoSave();
    this.emitPhase('completed');
    this.phase = 'completed';
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = 100;
      let elapsed = 0;
      const interval = setInterval(() => {
        if (!this.isRunning) {
          clearInterval(interval);
          resolve();
          return;
        }
        if (this.isPaused) {
          // Don't count time while paused
          return;
        }
        elapsed += checkInterval;
        if (elapsed >= ms) {
          clearInterval(interval);
          resolve();
        }
      }, checkInterval);
    });
  }

  private startTimer(): void {
    if (this.timerInterval) return;
    this.timerInterval = setInterval(() => {
      this.elapsedTime += 1;
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private startAutoSave(): void {
    if (this.autoSaveInterval) return;
    this.autoSaveInterval = setInterval(() => {
      if (this.onAutoSaveCallback) {
        this.onAutoSaveCallback();
      }
    }, 10000);
  }

  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  private emitPhase(phase: FlowPhase): void {
    this.phase = phase;
    if (this.onPhaseChangeCallback) {
      this.onPhaseChangeCallback(phase);
    }
    this.eventBus.emit('flow:phaseChange', phase);
  }

  private emitBoardUpdate(): void {
    if (this.onBoardUpdateCallback) {
      this.onBoardUpdateCallback(this.boardManager.getBlocks());
    }
    this.eventBus.emit('flow:boardUpdate', this.boardManager.getBlocks());
  }

  // --- Public setters for callbacks ---
  onPhaseChange(cb: (phase: FlowPhase) => void): void {
    this.onPhaseChangeCallback = cb;
  }

  onBoardUpdate(cb: (blocks: BoardBlock[]) => void): void {
    this.onBoardUpdateCallback = cb;
  }

  onQuiz(cb: (quiz: TeachingIntent['quiz']) => void): void {
    this.onQuizCallback = cb;
  }

  onSpeechProgress(cb: (progress: number, text: string) => void): void {
    this.onSpeechProgressCallback = cb;
  }

  onIntentChange(cb: (index: number, intent: TeachingIntent) => void): void {
    this.onIntentChangeCallback = cb;
  }

  onAutoSave(cb: () => void): void {
    this.onAutoSaveCallback = cb;
  }

  // --- Public getters ---
  getPhase(): FlowPhase {
    return this.phase;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getIntents(): TeachingIntent[] {
    return [...this.intents];
  }

  getElapsedTime(): number {
    return this.elapsedTime;
  }

  getBoardBlocks(): BoardBlock[] {
    return this.boardManager.getBlocks();
  }

  getSpeechEngine(): SpeechStreamEngine {
    return this.speechEngine;
  }

  getBoardManager(): BoardManager {
    return this.boardManager;
  }

  getPacingEngine(): PacingEngine {
    return this.pacingEngine;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }

  getLessonPlan(): LessonPlan | null {
    if (this.intents.length === 0) return null;
    return {
      lesson_id: '',
      title: '',
      lang: 'bn+en',
      classNumber: 6,
      subject: '',
      subjectLabel: '',
      teacher_persona: 'friendly_teacher',
      teaching_mode: 'general',
      intents: this.intents,
      created_at: new Date().toISOString(),
    };
  }
}
