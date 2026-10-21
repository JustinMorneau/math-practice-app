/**
 * Display details and defaults for the practice setup options.
 * Labels are written for children ages 7–12.
 */
import type { DifficultyLevel, MathOperation, SessionLength } from '../types';

export interface OperationDetails {
  label: string;
  symbol: string;
}

export const OPERATION_DETAILS: Record<MathOperation, OperationDetails> = {
  addition: { label: 'Addition', symbol: '+' },
  subtraction: { label: 'Subtraction', symbol: '−' },
  multiplication: { label: 'Multiplication', symbol: '×' },
  division: { label: 'Division', symbol: '÷' },
};

export interface DifficultyDetails {
  name: string;
  description: string;
}

/** Names and short summaries of the difficulty rules in specification section 7. */
export const DIFFICULTY_DETAILS: Record<DifficultyLevel, DifficultyDetails> = {
  1: { name: 'Beginner', description: 'Numbers up to 10' },
  2: { name: 'Easy', description: 'Numbers up to 50 and times tables to 10' },
  3: { name: 'Intermediate', description: 'Numbers up to 100, with carrying and borrowing' },
  4: { name: 'Advanced', description: 'Numbers up to 1,000 and bigger times problems' },
};

export interface SessionLengthOption {
  value: SessionLength;
  label: string;
  description: string;
}

export const SESSION_LENGTH_OPTIONS: readonly SessionLengthOption[] = [
  { value: 5, label: '5 questions', description: 'A quick warm-up' },
  { value: 10, label: '10 questions', description: 'A good workout' },
  { value: 20, label: '20 questions', description: 'A big challenge' },
  { value: 'continuous', label: 'Keep going', description: 'Stop whenever you like' },
];
