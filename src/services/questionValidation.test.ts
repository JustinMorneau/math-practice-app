import { describe, expect, it } from 'vitest';
import type { Question } from '../types';
import { getChoiceErrors, getQuestionErrors, isValidQuestion } from './questionValidation';

const validQuestion: Question = {
  id: 'q-1',
  operation: 'multiplication',
  firstOperand: 7,
  secondOperand: 8,
  displayText: '7 × 8',
  correctAnswer: 56,
  choices: [48, 54, 56, 64],
  difficulty: 2,
  source: 'regular',
};

describe('getChoiceErrors', () => {
  it('accepts four unique whole-number choices that include the answer once', () => {
    expect(getChoiceErrors(validQuestion)).toEqual([]);
    expect(isValidQuestion(validQuestion)).toBe(true);
  });

  it.each([
    ['three choices', [48, 56, 64]],
    ['five choices', [48, 54, 56, 63, 64]],
  ])('rejects %s', (_description, choices) => {
    expect(getChoiceErrors({ ...validQuestion, choices })).toEqual([
      'There must be exactly 4 answer choices.',
    ]);
  });

  it('rejects duplicate choices', () => {
    expect(getChoiceErrors({ ...validQuestion, choices: [48, 56, 56, 64] })).toContain(
      'Answer choices must be unique.',
    );
  });

  it('rejects choices that leave out the correct answer', () => {
    expect(getChoiceErrors({ ...validQuestion, choices: [48, 54, 63, 64] })).toContain(
      'Exactly one answer choice must equal the correct answer.',
    );
  });

  it('rejects negative choices', () => {
    expect(getChoiceErrors({ ...validQuestion, choices: [-8, 54, 56, 64] })).toContain(
      'Answer choices cannot be negative.',
    );
  });

  it('rejects fractional choices', () => {
    expect(getChoiceErrors({ ...validQuestion, choices: [48, 54.5, 56, 64] })).toContain(
      'Answer choices must be whole numbers.',
    );
  });
});

describe('getQuestionErrors', () => {
  it('includes problem errors as well as choice errors', () => {
    const errors = getQuestionErrors({ ...validQuestion, correctAnswer: 50 });
    expect(errors).toContain('The correct answer should be 56, not 50.');
    expect(errors).toContain('Exactly one answer choice must equal the correct answer.');
  });
});
