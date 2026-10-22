/**
 * A compact stored form for attempts (specification section 23: "Keep
 * local-storage records compact"). Each attempt is saved as an array rather
 * than an object with repeated field names, with a one-letter operation code
 * and a numeric timestamp, which makes saved attempts about three times
 * smaller and faster to read and write.
 *
 * Stored form, in order:
 *   [id, questionId, operation code, first operand, second operand,
 *    correct answer, selected answer, right (1) or wrong (0), difficulty,
 *    source (0 regular, 1 mistake review), attempted-at time in ms,
 *    session id, mistake pattern id (review attempts only)]
 */
import type { MathOperation, PracticeAttempt } from '../types';
import { isPracticeAttempt } from '../utils/validation';

export type StoredAttempt = [
  id: string,
  questionId: string,
  operation: string,
  firstOperand: number,
  secondOperand: number,
  correctAnswer: number,
  selectedAnswer: number,
  selfReportedCorrect: 0 | 1,
  difficulty: number,
  source: 0 | 1,
  /** Milliseconds since 1970, or the original text if it was not a valid date. */
  attemptedAt: number | string,
  sessionId: string,
  mistakePatternId?: string,
];

const OPERATION_CODES: Record<MathOperation, string> = {
  addition: 'a',
  subtraction: 's',
  multiplication: 'm',
  division: 'd',
};

const OPERATIONS_BY_CODE = new Map(
  Object.entries(OPERATION_CODES).map(([operation, code]) => [code, operation]),
);

export function encodeAttempt(attempt: PracticeAttempt): StoredAttempt {
  const time = Date.parse(attempt.attemptedAt);
  const stored: StoredAttempt = [
    attempt.id,
    attempt.questionId,
    OPERATION_CODES[attempt.operation],
    attempt.firstOperand,
    attempt.secondOperand,
    attempt.correctAnswer,
    attempt.selectedAnswer,
    attempt.selfReportedCorrect ? 1 : 0,
    attempt.difficulty,
    attempt.source === 'mistake-review' ? 1 : 0,
    Number.isNaN(time) ? attempt.attemptedAt : time,
    attempt.sessionId,
  ];
  if (attempt.mistakePatternId !== undefined) {
    stored.push(attempt.mistakePatternId);
  }
  return stored;
}

/** The attempt in a stored array, or null when it is incomplete or invalid. */
export function decodeAttempt(value: unknown): PracticeAttempt | null {
  if (!Array.isArray(value) || (value.length !== 12 && value.length !== 13)) {
    return null;
  }
  const [id, questionId, code, first, second, correct] = value;
  const [selected, right, level, source, time, sessionId, mistakePatternId] = value.slice(6);

  const attempt = {
    id,
    questionId,
    operation: OPERATIONS_BY_CODE.get(code),
    firstOperand: first,
    secondOperand: second,
    correctAnswer: correct,
    selectedAnswer: selected,
    selfReportedCorrect: right === 1,
    difficulty: level,
    source: source === 1 ? 'mistake-review' : 'regular',
    attemptedAt: typeof time === 'number' ? new Date(time).toISOString() : time,
    sessionId,
    ...(mistakePatternId === undefined ? {} : { mistakePatternId }),
  };
  const validFlags = (right === 0 || right === 1) && (source === 0 || source === 1);
  return validFlags && isPracticeAttempt(attempt) ? attempt : null;
}

/**
 * Every valid attempt in stored data, accepting both the compact form and
 * the original object form saved before version 2. Invalid records are
 * dropped; returns null when the data is not a list at all.
 */
export function parseStoredAttempts(value: unknown): PracticeAttempt[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value
    .map((item) => (Array.isArray(item) ? decodeAttempt(item) : item))
    .filter(isPracticeAttempt);
}
