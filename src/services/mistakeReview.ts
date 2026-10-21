/**
 * Chooses which mistakes to review (specification sections 6.4 and 20.2).
 *
 * Each active (not yet mastered) pattern gets a priority. Patterns missed
 * often, missed recently, or with little successful review score higher.
 * The next pattern is drawn at random, weighted by priority, so important
 * mistakes come up most while patterns with similar priority take turns.
 */
import { DEFAULT_MASTERY_THRESHOLD } from '../constants/defaultSettings';
import { MATH_OPERATIONS, type MathOperation, type MistakePattern, type Question } from '../types';
import type { RandomSource } from '../utils/math';
import { generateSimilarQuestion } from './similarQuestions';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/** Repeated misses raise priority, up to this many. */
const MAX_COUNTED_MISSES = 5;

export function getActivePatterns(patterns: readonly MistakePattern[]): MistakePattern[] {
  return patterns.filter((pattern) => !pattern.mastered);
}

/** The operations that appear in the given patterns, in the usual order. */
export function getPatternOperations(patterns: readonly MistakePattern[]): MathOperation[] {
  return MATH_OPERATIONS.filter((operation) =>
    patterns.some((pattern) => pattern.operation === operation),
  );
}

interface PriorityOptions {
  /** Current time in milliseconds; defaults to now. */
  now?: number;
  masteryThreshold?: number;
}

/** A positive score; higher means the pattern should be reviewed sooner. */
export function getReviewPriority(
  pattern: MistakePattern,
  { now = Date.now(), masteryThreshold = DEFAULT_MASTERY_THRESHOLD }: PriorityOptions = {},
): number {
  const frequency = Math.min(pattern.incorrectCount, MAX_COUNTED_MISSES);

  const daysSinceMissed = (now - Date.parse(pattern.lastIncorrectAt)) / DAY_IN_MS;
  let recency = 0;
  if (daysSinceMissed < 1) {
    recency = 3;
  } else if (daysSinceMissed < 7) {
    recency = 2;
  } else if (daysSinceMissed < 30) {
    recency = 1;
  }

  const reviewStillNeeded = Math.max(0, masteryThreshold - pattern.similarCorrectCount);

  return 1 + frequency + recency + reviewStillNeeded;
}

interface PickOptions extends PriorityOptions {
  random?: RandomSource;
  /** Avoided when another active pattern is available. */
  previousPatternId?: string;
}

/** An active pattern chosen at random, weighted by review priority; null if none are active. */
export function pickPatternForReview(
  patterns: readonly MistakePattern[],
  { random = Math.random, previousPatternId, ...priorityOptions }: PickOptions = {},
): MistakePattern | null {
  const active = getActivePatterns(patterns);
  const candidates =
    active.length > 1 ? active.filter(({ id }) => id !== previousPatternId) : active;
  if (candidates.length === 0) {
    return null;
  }

  const weights = candidates.map((pattern) => getReviewPriority(pattern, priorityOptions));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let target = random() * total;
  for (let index = 0; index < candidates.length; index += 1) {
    target -= weights[index];
    if (target < 0) {
      return candidates[index];
    }
  }
  return candidates[candidates.length - 1];
}

interface ReviewQuestionOptions extends PickOptions {
  /** Display texts shown recently, avoided when possible. */
  recentDisplayTexts?: readonly string[];
}

/** The next mistake-review question, or null when no mistakes are left to review. */
export function generateReviewQuestion(
  patterns: readonly MistakePattern[],
  { recentDisplayTexts, ...pickOptions }: ReviewQuestionOptions = {},
): Question | null {
  const pattern = pickPatternForReview(patterns, pickOptions);
  if (pattern === null) {
    return null;
  }
  return generateSimilarQuestion(pattern, { random: pickOptions.random, recentDisplayTexts });
}
