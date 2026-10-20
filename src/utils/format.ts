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

/** "1 question", "10 questions", or "No limit" for continuous practice. */
export function formatSessionLength(length: SessionLength): string {
  if (length === 'continuous') {
    return 'No limit';
  }
  return length === 1 ? '1 question' : `${length} questions`;
}
