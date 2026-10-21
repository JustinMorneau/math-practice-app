/**
 * Runtime type guards for data that arrives untyped, such as router state
 * and (in later phases) values read from localStorage.
 */
import {
  DIFFICULTY_LEVELS,
  MATH_OPERATIONS,
  type DifficultyLevel,
  type MathOperation,
  type PracticeAttempt,
  type PracticeConfig,
  type PracticeMode,
  type PracticeSession,
  type SessionLength,
} from '../types';

export function isMathOperation(value: unknown): value is MathOperation {
  return typeof value === 'string' && (MATH_OPERATIONS as readonly string[]).includes(value);
}

export function isDifficultyLevel(value: unknown): value is DifficultyLevel {
  return typeof value === 'number' && (DIFFICULTY_LEVELS as readonly number[]).includes(value);
}

/** A positive whole number of questions, or `'continuous'`. */
export function isSessionLength(value: unknown): value is SessionLength {
  return value === 'continuous' || (Number.isInteger(value) && (value as number) > 0);
}

/** At least one supported operation, with no duplicates. */
export function isOperationList(value: unknown): value is MathOperation[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(isMathOperation) &&
    new Set(value).size === value.length
  );
}

export function isPracticeMode(value: unknown): value is PracticeMode {
  return value === 'regular' || value === 'mistake-review';
}

/** A complete setup with at least one operation and no duplicates. */
export function isPracticeConfig(value: unknown): value is PracticeConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { operations, difficulty, sessionLength, mode } = value as Record<string, unknown>;

  return (
    isOperationList(operations) &&
    isDifficultyLevel(difficulty) &&
    isSessionLength(sessionLength) &&
    (mode === undefined || isPracticeMode(mode))
  );
}

function isCount(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

/**
 * A complete session record whose totals add up: correct + incorrect must
 * equal attempted.
 */
export function isPracticeSession(value: unknown): value is PracticeSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const { id, startedAt, completedAt, attempted, correct, incorrect, ...config } = record;

  return (
    typeof id === 'string' &&
    typeof startedAt === 'string' &&
    (completedAt === undefined || typeof completedAt === 'string') &&
    isPracticeConfig(config) &&
    isCount(attempted) &&
    isCount(correct) &&
    isCount(incorrect) &&
    correct + incorrect === attempted
  );
}

/** A stored record of one answered question (specification section 10.1). */
export function isPracticeAttempt(value: unknown): value is PracticeAttempt {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const attempt = value as Record<string, unknown>;
  return (
    typeof attempt.id === 'string' &&
    typeof attempt.questionId === 'string' &&
    typeof attempt.sessionId === 'string' &&
    typeof attempt.attemptedAt === 'string' &&
    isMathOperation(attempt.operation) &&
    isDifficultyLevel(attempt.difficulty) &&
    Number.isInteger(attempt.firstOperand) &&
    Number.isInteger(attempt.secondOperand) &&
    Number.isInteger(attempt.correctAnswer) &&
    Number.isInteger(attempt.selectedAnswer) &&
    typeof attempt.selfReportedCorrect === 'boolean' &&
    (attempt.source === 'regular' || attempt.source === 'mistake-review') &&
    (attempt.mistakePatternId === undefined || typeof attempt.mistakePatternId === 'string')
  );
}
