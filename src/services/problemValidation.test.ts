import { describe, expect, it } from 'vitest';
import type { DifficultyLevel, MathOperation, MathProblem } from '../types';
import { getProblemErrors, isValidProblem, matchesDifficulty } from './problemValidation';

const validProblem: MathProblem = {
  operation: 'multiplication',
  firstOperand: 7,
  secondOperand: 8,
  displayText: '7 × 8',
  correctAnswer: 56,
  difficulty: 2,
};

describe('getProblemErrors', () => {
  it('accepts a valid problem', () => {
    expect(getProblemErrors(validProblem)).toEqual([]);
    expect(isValidProblem(validProblem)).toBe(true);
  });

  it('rejects an unsupported operation', () => {
    const problem = { ...validProblem, operation: 'modulo' } as unknown as MathProblem;
    expect(getProblemErrors(problem)).toEqual(['Unsupported operation: modulo']);
  });

  it('rejects an unsupported difficulty level', () => {
    const problem = { ...validProblem, difficulty: 9 } as unknown as MathProblem;
    expect(isValidProblem(problem)).toBe(false);
  });

  it('rejects division by zero', () => {
    const problem: MathProblem = {
      operation: 'division',
      firstOperand: 5,
      secondOperand: 0,
      displayText: '5 ÷ 0',
      correctAnswer: 0,
      difficulty: 1,
    };
    expect(getProblemErrors(problem)).toEqual(['Division by zero is not allowed.']);
  });

  it('rejects division with a remainder', () => {
    const problem: MathProblem = {
      operation: 'division',
      firstOperand: 7,
      secondOperand: 2,
      displayText: '7 ÷ 2',
      correctAnswer: 3.5,
      difficulty: 1,
    };
    expect(getProblemErrors(problem)).toContain('The answer must be a whole number.');
  });

  it('rejects a wrong correct answer', () => {
    expect(getProblemErrors({ ...validProblem, correctAnswer: 54 })).toContain(
      'The correct answer should be 56, not 54.',
    );
  });

  it('rejects a negative answer', () => {
    const problem: MathProblem = {
      operation: 'subtraction',
      firstOperand: 3,
      secondOperand: 8,
      displayText: '3 − 8',
      correctAnswer: -5,
      difficulty: 1,
    };
    expect(getProblemErrors(problem)).toContain('Negative answers are not allowed.');
  });

  it('rejects display text that does not match the operands', () => {
    expect(getProblemErrors({ ...validProblem, displayText: '8 × 7' })).toContain(
      'The display text does not match the operands.',
    );
  });

  it('rejects numbers outside the difficulty level', () => {
    expect(getProblemErrors({ ...validProblem, difficulty: 1 })).toContain(
      'The numbers do not match difficulty level 1.',
    );
  });
});

describe('matchesDifficulty', () => {
  /** Only the operation, operands, and difficulty matter to matchesDifficulty. */
  function fitsLevel(
    operation: MathOperation,
    firstOperand: number,
    secondOperand: number,
    difficulty: DifficultyLevel,
  ): boolean {
    return matchesDifficulty({
      ...validProblem,
      operation,
      firstOperand,
      secondOperand,
      difficulty,
    });
  }

  it('enforces the Level 1 addition result limit of 20', () => {
    const problem: MathProblem = {
      operation: 'addition',
      firstOperand: 10,
      secondOperand: 10,
      displayText: '10 + 10',
      correctAnswer: 20,
      difficulty: 1,
    };
    expect(matchesDifficulty(problem)).toBe(true);
    expect(matchesDifficulty({ ...problem, firstOperand: 11 })).toBe(false);
  });

  it('accepts multiplication factors in either order', () => {
    // Level 4 allows two-digit × one-digit, written either way round.
    expect(fitsLevel('multiplication', 45, 7, 4)).toBe(true);
    expect(fitsLevel('multiplication', 7, 45, 4)).toBe(true);
    expect(fitsLevel('multiplication', 7, 8, 4)).toBe(false);
  });

  it('checks the divisor and the whole-number answer for division', () => {
    expect(fitsLevel('division', 144, 12, 3)).toBe(true);
    expect(fitsLevel('division', 169, 13, 3)).toBe(false);
  });
});
