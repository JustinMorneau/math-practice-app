/**
 * Mistake patterns: the facts a student has answered incorrectly, kept so
 * that similar questions can be reviewed later (specification sections 6.4
 * and 10.3). Everything here is pure; mistakeStorage saves the results.
 */
import type { MathOperation, MistakePattern, PracticeAttempt } from '../types';
import { calculateAnswer } from '../utils/math';
import { isDifficultyLevel, isMathOperation } from '../utils/validation';

/** Most patterns kept in storage; mastered and oldest patterns go first. */
export const MAX_STORED_MISTAKE_PATTERNS = 500;

const COMMUTATIVE: ReadonlySet<MathOperation> = new Set(['addition', 'multiplication']);

/**
 * Whether two problems are the same fact. Addition and multiplication
 * match in either order (7 × 8 and 8 × 7), since they are the same fact;
 * subtraction and division must match exactly.
 */
export function isSameFact(
  a: Pick<MistakePattern, 'operation' | 'firstOperand' | 'secondOperand'>,
  b: Pick<MistakePattern, 'operation' | 'firstOperand' | 'secondOperand'>,
): boolean {
  if (a.operation !== b.operation) {
    return false;
  }
  const sameOrder = a.firstOperand === b.firstOperand && a.secondOperand === b.secondOperand;
  const swapped = a.firstOperand === b.secondOperand && a.secondOperand === b.firstOperand;
  return sameOrder || (COMMUTATIVE.has(a.operation) && swapped);
}

type MissedAttempt = Pick<
  PracticeAttempt,
  'operation' | 'firstOperand' | 'secondOperand' | 'correctAnswer' | 'difficulty' | 'attemptedAt'
>;

/**
 * Records an incorrect answer. A new fact gets a new pattern; a fact that
 * already has one has its incorrect count and date updated instead, and its
 * mastery progress starts over, since missing the fact again shows it is
 * not mastered yet.
 */
export function recordIncorrectAnswer(
  patterns: readonly MistakePattern[],
  attempt: MissedAttempt,
  newId: string,
): MistakePattern[] {
  const existing = patterns.find((pattern) => isSameFact(pattern, attempt));

  if (existing) {
    const updated: MistakePattern = {
      ...existing,
      incorrectCount: existing.incorrectCount + 1,
      lastIncorrectAt: attempt.attemptedAt,
      similarCorrectCount: 0,
      mastered: false,
    };
    return patterns.map((pattern) => (pattern === existing ? updated : pattern));
  }

  const created: MistakePattern = {
    id: newId,
    operation: attempt.operation,
    firstOperand: attempt.firstOperand,
    secondOperand: attempt.secondOperand,
    correctAnswer: attempt.correctAnswer,
    difficulty: attempt.difficulty,
    incorrectCount: 1,
    similarCorrectCount: 0,
    lastIncorrectAt: attempt.attemptedAt,
    mastered: false,
  };
  return [...patterns, created];
}

/**
 * Records the result of a review question for the pattern it came from
 * (specification section 6.4). A correct answer is one step toward mastery,
 * and reaching `masteryThreshold` marks the pattern mastered. An incorrect
 * answer takes one step back, without going below zero.
 */
export function recordReviewAnswer(
  patterns: readonly MistakePattern[],
  patternId: string,
  correct: boolean,
  masteryThreshold: number,
): MistakePattern[] {
  return patterns.map((pattern) => {
    if (pattern.id !== patternId) {
      return pattern;
    }
    const similarCorrectCount = correct
      ? pattern.similarCorrectCount + 1
      : Math.max(0, pattern.similarCorrectCount - 1);
    return {
      ...pattern,
      similarCorrectCount,
      mastered: similarCorrectCount >= masteryThreshold,
    };
  });
}

/**
 * At most `max` patterns, removing mastered patterns before active ones and
 * older mistakes before newer ones.
 */
export function limitMistakePatterns(
  patterns: readonly MistakePattern[],
  max = MAX_STORED_MISTAKE_PATTERNS,
): MistakePattern[] {
  if (patterns.length <= max) {
    return [...patterns];
  }
  const removalOrder = [...patterns].sort(
    (a, b) =>
      Number(b.mastered) - Number(a.mastered) || a.lastIncorrectAt.localeCompare(b.lastIncorrectAt),
  );
  const removed = new Set(removalOrder.slice(0, patterns.length - max));
  return patterns.filter((pattern) => !removed.has(pattern));
}

function isCount(value: unknown, minimum: number): boolean {
  return Number.isInteger(value) && (value as number) >= minimum;
}

/** A complete, internally consistent stored mistake pattern. */
export function isMistakePattern(value: unknown): value is MistakePattern {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const pattern = value as Record<string, unknown>;
  if (
    typeof pattern.id !== 'string' ||
    !isMathOperation(pattern.operation) ||
    !isDifficultyLevel(pattern.difficulty) ||
    !isCount(pattern.firstOperand, 0) ||
    !isCount(pattern.secondOperand, 0) ||
    !isCount(pattern.incorrectCount, 1) ||
    !isCount(pattern.similarCorrectCount, 0) ||
    typeof pattern.mastered !== 'boolean' ||
    typeof pattern.lastIncorrectAt !== 'string' ||
    Number.isNaN(Date.parse(pattern.lastIncorrectAt))
  ) {
    return false;
  }
  if (pattern.operation === 'division' && pattern.secondOperand === 0) {
    return false;
  }
  const expected = calculateAnswer(
    pattern.operation,
    pattern.firstOperand as number,
    pattern.secondOperand as number,
  );
  return pattern.correctAnswer === expected;
}

export interface ParsedMistakePatterns {
  patterns: MistakePattern[];
  /** How many stored records were invalid and left out. */
  droppedCount: number;
}

/** The valid patterns in stored data, or null when it is not a list at all. */
export function parseMistakePatterns(value: unknown): ParsedMistakePatterns | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const patterns = value.filter(isMistakePattern);
  return { patterns, droppedCount: value.length - patterns.length };
}
