/**
 * Mistake statistics for the statistics page (specification section 6.6).
 * Everything here is pure.
 */
import {
  MATH_OPERATIONS,
  type AppStatistics,
  type MathOperation,
  type MistakePattern,
  type PracticeAttempt,
} from '../types';
import { formatProblemText } from '../utils/format';

export interface MistakeSummary {
  activeCount: number;
  masteredCount: number;
  /** Mistake-review questions answered, from the saved attempt history. */
  reviewAttempted: number;
  /** Mistake-review questions the student got right. */
  reviewCorrect: number;
}

export function summarizeMistakes(
  patterns: readonly MistakePattern[],
  attempts: readonly Pick<PracticeAttempt, 'source' | 'selfReportedCorrect'>[],
): MistakeSummary {
  const reviewAttempts = attempts.filter(({ source }) => source === 'mistake-review');
  const masteredCount = patterns.filter(({ mastered }) => mastered).length;
  return {
    activeCount: patterns.length - masteredCount,
    masteredCount,
    reviewAttempted: reviewAttempts.length,
    reviewCorrect: reviewAttempts.filter(({ selfReportedCorrect }) => selfReportedCorrect).length,
  };
}

/**
 * The operation answered incorrectly most often, across all practice.
 * Every operation tied for the most is returned; none when nothing has been
 * missed.
 */
export function getMostMissedOperations(statistics: AppStatistics): MathOperation[] {
  const missed = MATH_OPERATIONS.map((operation) => statistics.byOperation[operation].incorrect);
  const most = Math.max(...missed);
  if (most === 0) {
    return [];
  }
  return MATH_OPERATIONS.filter((_operation, index) => missed[index] === most);
}

/** The fact as shown in lists, e.g. "8 × 7 = 56". */
export function formatMistakeFact({
  operation,
  firstOperand,
  secondOperand,
  correctAnswer,
}: MistakePattern): string {
  return `${formatProblemText(operation, firstOperand, secondOperand)} = ${correctAnswer}`;
}

/**
 * Patterns from most to least missed. Ties go to the most recently missed,
 * then to the fact's text, so the order is always the same.
 */
export function sortByMostMissed(patterns: readonly MistakePattern[]): MistakePattern[] {
  return [...patterns].sort(
    (a, b) =>
      b.incorrectCount - a.incorrectCount ||
      b.lastIncorrectAt.localeCompare(a.lastIncorrectAt) ||
      formatMistakeFact(a).localeCompare(formatMistakeFact(b)),
  );
}

/** The most frequently missed facts, most missed first. */
export function getMostMissedFacts(
  patterns: readonly MistakePattern[],
  limit = 5,
): MistakePattern[] {
  return sortByMostMissed(patterns).slice(0, limit);
}
