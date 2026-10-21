/**
 * Checks a complete question, including its answer choices, against the
 * rules in specification sections 8.2 and 18.
 */
import type { Question } from '../types';
import { getProblemErrors, type ProblemCheckOptions } from './problemValidation';

/** Every question offers this many choices: one correct answer and three distractors. */
export const CHOICE_COUNT = 4;

/** Every rule the answer choices break, or an empty list when they are valid. */
export function getChoiceErrors({ choices, correctAnswer }: Question): string[] {
  if (!Array.isArray(choices) || choices.length !== CHOICE_COUNT) {
    return [`There must be exactly ${CHOICE_COUNT} answer choices.`];
  }

  const errors: string[] = [];
  if (!choices.every((choice) => Number.isInteger(choice))) {
    errors.push('Answer choices must be whole numbers.');
  }
  if (choices.some((choice) => choice < 0)) {
    errors.push('Answer choices cannot be negative.');
  }
  if (new Set(choices).size !== choices.length) {
    errors.push('Answer choices must be unique.');
  }
  if (choices.filter((choice) => choice === correctAnswer).length !== 1) {
    errors.push('Exactly one answer choice must equal the correct answer.');
  }
  return errors;
}

/** Every rule the question breaks: problem rules first, then answer-choice rules. */
export function getQuestionErrors(question: Question, options?: ProblemCheckOptions): string[] {
  return [...getProblemErrors(question, options), ...getChoiceErrors(question)];
}

export function isValidQuestion(question: Question): boolean {
  return getQuestionErrors(question).length === 0;
}
