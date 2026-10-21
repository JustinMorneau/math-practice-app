/**
 * Aggregate statistics: overall totals plus totals by operation and by
 * difficulty level (specification sections 6.6, 10.4, and 20.3).
 * Everything here is pure; statisticsStorage saves and loads the results.
 */
import {
  DIFFICULTY_LEVELS,
  MATH_OPERATIONS,
  type AppStatistics,
  type DifficultyLevel,
  type MathOperation,
  type OperationStatistics,
  type PracticeAttempt,
} from '../types';
import { calculateAccuracy } from '../utils/math';

export function createEmptyCounts(): OperationStatistics {
  return { attempted: 0, correct: 0, incorrect: 0 };
}

/** Statistics with every total at zero, including every operation and level. */
export function createEmptyStatistics(): AppStatistics {
  const byOperation = Object.fromEntries(
    MATH_OPERATIONS.map((operation) => [operation, createEmptyCounts()]),
  ) as Record<MathOperation, OperationStatistics>;
  const byDifficulty = Object.fromEntries(
    DIFFICULTY_LEVELS.map((level) => [level, createEmptyCounts()]),
  ) as Record<DifficultyLevel, OperationStatistics>;

  return { ...createEmptyCounts(), byOperation, byDifficulty };
}

function addResult(counts: OperationStatistics, correct: boolean): OperationStatistics {
  return {
    attempted: counts.attempted + 1,
    correct: counts.correct + (correct ? 1 : 0),
    incorrect: counts.incorrect + (correct ? 0 : 1),
  };
}

type CountedAttempt = Pick<PracticeAttempt, 'operation' | 'difficulty' | 'selfReportedCorrect'>;

/** New statistics with one more attempt counted in the overall, operation, and level totals. */
export function addAttemptToStatistics(
  statistics: AppStatistics,
  { operation, difficulty, selfReportedCorrect }: CountedAttempt,
): AppStatistics {
  return {
    ...addResult(statistics, selfReportedCorrect),
    byOperation: {
      ...statistics.byOperation,
      [operation]: addResult(statistics.byOperation[operation], selfReportedCorrect),
    },
    byDifficulty: {
      ...statistics.byDifficulty,
      [difficulty]: addResult(statistics.byDifficulty[difficulty], selfReportedCorrect),
    },
  };
}

/** Statistics calculated from a list of attempts. */
export function calculateStatistics(attempts: readonly CountedAttempt[]): AppStatistics {
  return attempts.reduce(addAttemptToStatistics, createEmptyStatistics());
}

/** Whole-number accuracy for a set of totals; 0 when nothing was attempted. */
export function getAccuracy({ correct, attempted }: OperationStatistics): number {
  return calculateAccuracy(correct, attempted);
}

function isCounts(value: unknown): value is OperationStatistics {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { attempted, correct, incorrect } = value as Record<string, unknown>;
  return (
    [attempted, correct, incorrect].every(
      (count) => Number.isInteger(count) && (count as number) >= 0,
    ) && (correct as number) + (incorrect as number) === attempted
  );
}

function sumAttempted(groups: readonly OperationStatistics[]): number {
  return groups.reduce((total, { attempted }) => total + attempted, 0);
}

/**
 * Stored statistics that are complete and consistent: every operation and
 * level is present, each total adds up, and the breakdowns add up to the
 * overall total. Anything else is treated as corrupted.
 */
export function parseStatistics(value: unknown): AppStatistics | null {
  if (!isCounts(value)) {
    return null;
  }
  const { byOperation, byDifficulty } = value as Partial<AppStatistics>;
  if (!byOperation || !byDifficulty) {
    return null;
  }

  const operationCounts = MATH_OPERATIONS.map((operation) => byOperation[operation]);
  const difficultyCounts = DIFFICULTY_LEVELS.map((level) => byDifficulty[level]);
  if (!operationCounts.every(isCounts) || !difficultyCounts.every(isCounts)) {
    return null;
  }
  if (
    sumAttempted(operationCounts) !== value.attempted ||
    sumAttempted(difficultyCounts) !== value.attempted
  ) {
    return null;
  }
  return value as AppStatistics;
}
