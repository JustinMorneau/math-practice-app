import { describe, expect, it } from 'vitest';
import { getExplanation } from './explanations';
import { createProblem } from './questionGenerator';

describe('getExplanation', () => {
  it.each([
    ['addition', 7, 8, '7 + 8 = 15. Check it: 15 − 8 = 7.'],
    ['subtraction', 15, 8, '15 − 8 = 7 because 7 + 8 = 15.'],
    ['multiplication', 7, 8, '7 × 8 means 7 groups of 8, which makes 56.'],
    ['division', 56, 7, '56 ÷ 7 = 8 because 7 × 8 = 56.'],
  ] as const)('explains %s', (operation, first, second, expected) => {
    expect(getExplanation(createProblem(operation, 2, first, second))).toBe(expected);
  });

  it('handles zero', () => {
    expect(getExplanation(createProblem('division', 1, 0, 4))).toBe('0 ÷ 4 = 0 because 4 × 0 = 0.');
  });
});
