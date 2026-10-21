/**
 * Application-wide preferences (specification section 6.7).
 */
import type { DifficultyLevel, MathOperation } from './question';
import type { SessionLength } from './session';

export interface AppSettings {
  soundEffectsEnabled: boolean;
  /** When false, cards switch sides instantly instead of animating. */
  cardAnimationsEnabled: boolean;
  showExplanations: boolean;
  /** Show a short encouraging message after each answer. */
  feedbackMessagesEnabled: boolean;
  defaultSessionLength: SessionLength;
  defaultDifficulty: DifficultyLevel;
  defaultOperations: MathOperation[];
  /** Correct similar questions required before a mistake pattern is mastered (spec default: 3). */
  masteryThreshold: number;
}
