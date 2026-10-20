/**
 * Runtime type guards for data that arrives untyped, such as router state
 * and (in later phases) values read from localStorage.
 */
import {
  DIFFICULTY_LEVELS,
  MATH_OPERATIONS,
  type DifficultyLevel,
  type MathOperation,
  type PracticeConfig,
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

/** A complete setup with at least one operation and no duplicates. */
export function isPracticeConfig(value: unknown): value is PracticeConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { operations, difficulty, sessionLength } = value as Record<string, unknown>;

  return (
    Array.isArray(operations) &&
    operations.length > 0 &&
    operations.every(isMathOperation) &&
    new Set(operations).size === operations.length &&
    isDifficultyLevel(difficulty) &&
    isSessionLength(sessionLength)
  );
}
