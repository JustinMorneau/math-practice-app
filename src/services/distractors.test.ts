import { describe, expect, it } from 'vitest';
import { alwaysHighest, alwaysLowest, createSeededRandom } from '../test/random';
import { DIFFICULTY_LEVELS, MATH_OPERATIONS, type MathProblem } from '../types';
import {
  addWithoutCarrying,
  DISTRACTOR_COUNT,
  generateDistractors,
  getMistakeAnswers,
  subtractSmallerDigitFromLarger,
} from './distractors';
import { createProblem, generateProblem } from './questionGenerator';

function expectValidDistractors(problem: MathProblem, distractors: number[]) {
  expect(distractors).toHaveLength(DISTRACTOR_COUNT);
  expect(new Set(distractors).size).toBe(DISTRACTOR_COUNT);
  for (const distractor of distractors) {
    expect(Number.isInteger(distractor)).toBe(true);
    expect(distractor).toBeGreaterThanOrEqual(0);
    expect(distractor).not.toBe(problem.correctAnswer);
  }
}

describe('addWithoutCarrying', () => {
  it.each([
    [47, 38, 75],
    [5, 3, 8],
    [999, 1, 990],
    [0, 0, 0],
  ])('%i + %i without carrying is %i', (first, second, expected) => {
    expect(addWithoutCarrying(first, second)).toBe(expected);
  });
});

describe('subtractSmallerDigitFromLarger', () => {
  it.each([
    [52, 27, 35],
    [85, 23, 62],
    [400, 125, 325],
  ])('%i − %i taking smaller digits from larger is %i', (first, second, expected) => {
    expect(subtractSmallerDigitFromLarger(first, second)).toBe(expected);
  });
});

describe('getMistakeAnswers', () => {
  it('uses neighboring times-table facts for multiplication', () => {
    // The specification's example: 8 × 7 = 56, with 48 and 64 as likely mistakes.
    const mistakes = getMistakeAnswers(createProblem('multiplication', 2, 8, 7));
    expect(mistakes).toEqual(expect.arrayContaining([48, 64, 63, 49]));
  });

  it('includes the forgotten-carry answer for addition', () => {
    expect(getMistakeAnswers(createProblem('addition', 3, 47, 38))).toContain(75);
  });

  it('includes the smaller-from-larger answer for subtraction', () => {
    expect(getMistakeAnswers(createProblem('subtraction', 3, 52, 27))).toContain(35);
  });

  it('includes neighboring quotients and the divisor for division', () => {
    expect(getMistakeAnswers(createProblem('division', 2, 56, 7))).toEqual(
      expect.arrayContaining([7, 9]),
    );
  });
});

describe('generateDistractors', () => {
  describe.each(MATH_OPERATIONS)('%s', (operation) => {
    it.each(DIFFICULTY_LEVELS)('gives three valid distractors at level %i', (level) => {
      const random = createSeededRandom(level);
      for (let i = 0; i < 300; i += 1) {
        const problem = generateProblem(operation, level, random);
        expectValidDistractors(problem, generateDistractors(problem, random));
      }
    });
  });

  it.each([
    ['0 + 0', createProblem('addition', 1, 0, 0)],
    ['5 − 5', createProblem('subtraction', 1, 5, 5)],
    ['0 × 4', createProblem('multiplication', 1, 0, 4)],
    ['0 ÷ 1', createProblem('division', 1, 0, 1)],
    ['1 + 0', createProblem('addition', 1, 1, 0)],
  ])('handles answers at or near zero (%s)', (_label, problem) => {
    for (const random of [alwaysLowest, alwaysHighest, createSeededRandom(9)]) {
      expectValidDistractors(problem, generateDistractors(problem, random));
    }
  });

  it('keeps distractors plausible: a known mistake or within 10 of the answer', () => {
    const random = createSeededRandom(11);
    for (const operation of MATH_OPERATIONS) {
      for (let i = 0; i < 300; i += 1) {
        const problem = generateProblem(operation, 3, random);
        const mistakes = getMistakeAnswers(problem);
        for (const distractor of generateDistractors(problem, random)) {
          const isNearby = Math.abs(distractor - problem.correctAnswer) <= 10;
          expect(isNearby || mistakes.includes(distractor)).toBe(true);
        }
      }
    }
  });

  it('draws the 8 × 7 distractors from nearby facts and numbers', () => {
    const problem = createProblem('multiplication', 2, 8, 7);
    const allowed = new Set([48, 49, 63, 64, 46, 53, 54, 55, 57, 58, 59, 66]);
    const random = createSeededRandom(12);
    for (let i = 0; i < 50; i += 1) {
      for (const distractor of generateDistractors(problem, random)) {
        expect(allowed.has(distractor)).toBe(true);
      }
    }
  });

  it('does not make the correct answer predictable by its size', () => {
    // Count how often the answer is the smallest, 2nd, 3rd, or largest choice.
    const random = createSeededRandom(13);
    const runs = 4000;
    const rankCounts = [0, 0, 0, 0];
    for (let i = 0; i < runs; i += 1) {
      const problem = generateProblem('addition', 3, random);
      const choices = [problem.correctAnswer, ...generateDistractors(problem, random)];
      rankCounts[choices.sort((a, b) => a - b).indexOf(problem.correctAnswer)] += 1;
    }
    for (const count of rankCounts) {
      expect(count / runs).toBeGreaterThan(0.15);
      expect(count / runs).toBeLessThan(0.35);
    }
  });
});
