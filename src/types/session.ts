/**
 * Practice session and attempt types (specification sections 10.1 and 10.2).
 */
import type { DifficultyLevel, MathOperation, QuestionSource } from './question';

/** Number of questions in a session, or open-ended continuous practice. */
export type SessionLength = number | 'continuous';

/** One answered question, recorded after the student self-reports the result. */
export interface PracticeAttempt {
  id: string;
  questionId: string;
  operation: MathOperation;
  firstOperand: number;
  secondOperand: number;
  correctAnswer: number;
  selectedAnswer: number;
  /** The student's own judgment from the "I Got It Right / Wrong" buttons. */
  selfReportedCorrect: boolean;
  difficulty: DifficultyLevel;
  source: QuestionSource;
  /** ISO 8601 timestamp. */
  attemptedAt: string;
  sessionId: string;
}

/** A single practice session and its running totals. */
export interface PracticeSession {
  id: string;
  /** ISO 8601 timestamp. */
  startedAt: string;
  /** ISO 8601 timestamp; absent while the session is still in progress. */
  completedAt?: string;
  operations: MathOperation[];
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
  attempted: number;
  correct: number;
  incorrect: number;
}

/** The choices made on the practice setup page, used to start a session. */
export interface PracticeConfig {
  /** At least one operation, in the canonical MATH_OPERATIONS order. */
  operations: MathOperation[];
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
}
