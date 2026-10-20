/**
 * Mistake-tracking types (specification sections 6.4 and 10.3).
 */
import type { DifficultyLevel, MathOperation } from './question';

/** A question the student got wrong, used to generate similar review questions. */
export interface MistakePattern {
  id: string;
  operation: MathOperation;
  firstOperand: number;
  secondOperand: number;
  correctAnswer: number;
  difficulty: DifficultyLevel;
  /** How many times this exact question has been answered incorrectly. */
  incorrectCount: number;
  /** How many related review questions have since been answered correctly. */
  similarCorrectCount: number;
  /** ISO 8601 timestamp of the most recent incorrect answer. */
  lastIncorrectAt: string;
  /** True once `similarCorrectCount` reaches the mastery threshold. */
  mastered: boolean;
}
