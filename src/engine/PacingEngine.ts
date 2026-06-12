import type { TeachingIntentType, PacingSpeed, PacingProfile } from '@/types';

const PACING_DELAYS: Record<PacingSpeed, number> = {
  slow: 2000,
  continuous: 800,
  medium: 1200,
  interactive_pause: 0, // wait for user
};

const INTENT_PACING_MAP: Record<TeachingIntentType, PacingSpeed> = {
  introduce: 'slow',
  explain_concept: 'continuous',
  provide_example: 'medium',
  quiz_student: 'interactive_pause',
  recap: 'slow',
  transition: 'continuous',
  interact: 'medium',
};

export class PacingEngine {
  private profile: PacingProfile = {
    concept: 'slow',
    explanation: 'continuous',
    example: 'medium',
    recap: 'slow',
    quiz: 'interactive_pause',
  };

  private speedMultiplier: number = 1;

  setProfile(profile: Partial<PacingProfile>): void {
    this.profile = { ...this.profile, ...profile };
  }

  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = Math.max(0.25, Math.min(3, multiplier));
  }

  getPacingDelay(intentType: TeachingIntentType): number {
    const speed = INTENT_PACING_MAP[intentType] || 'medium';
    const baseDelay = PACING_DELAYS[speed];
    if (baseDelay === 0) return 0;
    return Math.round(baseDelay * this.speedMultiplier);
  }

  getSpeedForIntent(intentType: TeachingIntentType): PacingSpeed {
    return INTENT_PACING_MAP[intentType] || 'medium';
  }

  requiresUserInput(intentType: TeachingIntentType): boolean {
    return INTENT_PACING_MAP[intentType] === 'interactive_pause';
  }

  getProfile(): PacingProfile {
    return { ...this.profile };
  }
}
