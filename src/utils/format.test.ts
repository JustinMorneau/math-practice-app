import { describe, expect, it } from 'vitest';
import type { PracticeConfig } from '../types';
import {
  formatDateTime,
  formatDifficulty,
  formatOperationList,
  formatPracticeSetup,
  formatProblemText,
  formatQuestionCount,
  formatSessionLength,
  formatSpokenProblem,
} from './format';

describe('formatOperationList', () => {
  it('formats one operation', () => {
    expect(formatOperationList(['addition'])).toBe('Addition');
  });

  it('formats two operations', () => {
    expect(formatOperationList(['addition', 'division'])).toBe('Addition and Division');
  });

  it('formats several operations as a list', () => {
    expect(formatOperationList(['addition', 'subtraction', 'multiplication', 'division'])).toBe(
      'Addition, Subtraction, Multiplication, and Division',
    );
  });
});

describe('formatDifficulty', () => {
  it.each([
    [1, 'Beginner'],
    [2, 'Easy'],
    [3, 'Intermediate'],
    [4, 'Advanced'],
  ] as const)('names level %s "%s"', (level, name) => {
    expect(formatDifficulty(level)).toBe(name);
  });
});

describe('formatQuestionCount', () => {
  it.each([
    [0, '0 questions'],
    [1, '1 question'],
    [7, '7 questions'],
  ])('formats %i as "%s"', (count, expected) => {
    expect(formatQuestionCount(count)).toBe(expected);
  });
});

describe('formatSessionLength', () => {
  it('uses the plural for several questions', () => {
    expect(formatSessionLength(10)).toBe('10 questions');
  });

  it('uses the singular for one question', () => {
    expect(formatSessionLength(1)).toBe('1 question');
  });

  it('describes continuous practice', () => {
    expect(formatSessionLength('continuous')).toBe('No limit');
  });
});

describe('formatProblemText', () => {
  it.each([
    ['addition', 7, 8, '7 + 8'],
    ['subtraction', 15, 8, '15 − 8'],
    ['multiplication', 7, 8, '7 × 8'],
    ['division', 56, 7, '56 ÷ 7'],
  ] as const)('formats %s as "%s"', (operation, first, second, expected) => {
    expect(formatProblemText(operation, first, second)).toBe(expected);
  });
});

describe('formatDateTime', () => {
  it('formats a timestamp as a readable date', () => {
    expect(formatDateTime('2026-10-21T15:05:00.000Z')).toMatch(/2026/);
  });

  it('returns the original text when it is not a valid date', () => {
    expect(formatDateTime('not a date')).toBe('not a date');
  });
});

describe('formatPracticeSetup', () => {
  it('describes regular practice by operations and level', () => {
    expect(formatPracticeSetup({ operations: ['addition', 'division'], difficulty: 2 })).toBe(
      'Addition and Division, Easy level',
    );
  });

  it('describes review sessions without a single level', () => {
    const review: PracticeConfig = {
      operations: ['multiplication'],
      difficulty: 3,
      sessionLength: 10,
      mode: 'mistake-review',
    };
    expect(formatPracticeSetup(review)).toBe('Mistake review: Multiplication');
  });
});

describe('formatSpokenProblem', () => {
  it.each([
    ['addition', 7, 8, '7 plus 8'],
    ['subtraction', 15, 8, '15 minus 8'],
    ['multiplication', 7, 8, '7 times 8'],
    ['division', 56, 7, '56 divided by 7'],
  ] as const)('reads %s as "%s"', (operation, first, second, expected) => {
    expect(formatSpokenProblem(operation, first, second)).toBe(expected);
  });
});
