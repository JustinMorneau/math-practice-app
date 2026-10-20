/**
 * Core question types (specification sections 8.1 and 9).
 *
 * The const arrays below are the single source of truth for the supported
 * operations and difficulty levels. The union types are derived from them so
 * the app can both type-check values and iterate over every option (for
 * example, to build selectors or initialize per-operation statistics).
 * Const arrays are used instead of enums because the project compiles with
 * `erasableSyntaxOnly`.
 */

export const MATH_OPERATIONS = ['addition', 'subtraction', 'multiplication', 'division'] as const;

/** An arithmetic operation the app can generate questions for. */
export type MathOperation = (typeof MATH_OPERATIONS)[number];

export const DIFFICULTY_LEVELS = [1, 2, 3, 4] as const;

/** 1 = Beginner, 2 = Easy, 3 = Intermediate, 4 = Advanced (specification section 7). */
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

/** Whether a question came from normal practice or from reviewing a past mistake. */
export type QuestionSource = 'regular' | 'mistake-review';

/** A single generated multiple-choice math question. */
export interface Question {
  id: string;
  operation: MathOperation;
  firstOperand: number;
  secondOperand: number;
  /** Human-readable form of the question, e.g. "7 × 8". */
  displayText: string;
  correctAnswer: number;
  /**
   * Exactly four unique, shuffled choices, one of which equals `correctAnswer`.
   * The count is enforced by question validation rather than a tuple type so
   * that array utilities such as shuffle can be used without casts.
   */
  choices: number[];
  difficulty: DifficultyLevel;
  source: QuestionSource;
  /** Set only when `source` is `'mistake-review'`. */
  mistakePatternId?: string;
}
