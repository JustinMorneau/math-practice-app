import { DIFFICULTY_DETAILS, OPERATION_DETAILS } from '../constants/practiceOptions';
import type { DifficultyLevel, MathOperation, SessionLength } from '../types';

const listFormatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

/** "Addition", "Addition and Division", "Addition, Subtraction, and Division". */
export function formatOperationList(operations: readonly MathOperation[]): string {
  return listFormatter.format(operations.map((operation) => OPERATION_DETAILS[operation].label));
}

/** "Beginner", "Easy", "Intermediate", or "Advanced". */
export function formatDifficulty(difficulty: DifficultyLevel): string {
  return DIFFICULTY_DETAILS[difficulty].name;
}

/** "1 question" or "10 questions". */
export function formatQuestionCount(count: number): string {
  return count === 1 ? '1 question' : `${count} questions`;
}

/** "1 question", "10 questions", or "No limit" for continuous practice. */
export function formatSessionLength(length: SessionLength): string {
  return length === 'continuous' ? 'No limit' : formatQuestionCount(length);
}

/** The question as shown on a card, e.g. "7 × 8" or "56 ÷ 7". */
export function formatProblemText(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
): string {
  return `${firstOperand} ${OPERATION_DETAILS[operation].symbol} ${secondOperand}`;
}
