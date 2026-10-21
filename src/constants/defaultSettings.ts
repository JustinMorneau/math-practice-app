import type { AppSettings } from '../types';

/** Correct similar answers needed before a mistake counts as mastered (specification 6.4). */
export const DEFAULT_MASTERY_THRESHOLD = 3;

/** Smallest and largest mastery thresholds a saved setting may use. */
export const MASTERY_THRESHOLD_RANGE = { min: 1, max: 10 } as const;

/** Settings used on first launch and for any stored setting that is invalid. */
export const DEFAULT_SETTINGS: AppSettings = {
  soundEffectsEnabled: false,
  cardAnimationsEnabled: true,
  showExplanations: true,
  feedbackMessagesEnabled: true,
  defaultSessionLength: 10,
  defaultDifficulty: 1,
  defaultOperations: ['addition'],
  masteryThreshold: DEFAULT_MASTERY_THRESHOLD,
};
