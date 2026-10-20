/**
 * Aggregate statistics types (specification section 10.4).
 *
 * Accuracy is intentionally not stored; it is derived as
 * `correct / attempted × 100` (and 0 when nothing has been attempted).
 */
import type { DifficultyLevel, MathOperation } from './question';

/**
 * Attempted / correct / incorrect counts for one slice of the data.
 * Despite the name (kept from the specification), it is used for both
 * per-operation and per-difficulty breakdowns.
 */
export interface OperationStatistics {
  attempted: number;
  correct: number;
  incorrect: number;
}

/** All-time totals plus breakdowns by operation and by difficulty level. */
export interface AppStatistics {
  attempted: number;
  correct: number;
  incorrect: number;
  byOperation: Record<MathOperation, OperationStatistics>;
  byDifficulty: Record<DifficultyLevel, OperationStatistics>;
}
