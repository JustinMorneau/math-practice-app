import { describe, expect, it, vi } from 'vitest';
import { alwaysHighest, alwaysLowest, createSeededRandom } from '../test/random';
import {
  DIFFICULTY_LEVELS,
  MATH_OPERATIONS,
  type DifficultyLevel,
  type MathOperation,
  type MathProblem,
} from '../types';
import { getProblemErrors } from './problemValidation';
import {
  createFallbackProblem,
  generateAdditionProblem,
  generateDivisionProblem,
  generateMultiplicationProblem,
  generateProblem,
  generateProblemForOperations,
  generateSubtractionProblem,
} from './questionGenerator';

const SAMPLES = 500;

/** Many problems from a fixed seed, so failures are repeatable. */
function sample(
  generate: (difficulty: DifficultyLevel, random: () => number) => MathProblem,
  difficulty: DifficultyLevel,
  seed = 1,
): MathProblem[] {
  const random = createSeededRandom(seed);
  return Array.from({ length: SAMPLES }, () => generate(difficulty, random));
}

function expectBetween(value: number, min: number, max: number) {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

describe('generateAdditionProblem', () => {
  // [level, operand min, operand max, largest allowed sum]
  it.each([
    [1, 0, 10, 20],
    [2, 0, 50, 100],
    [3, 0, 100, 200],
    [4, 10, 999, 1998],
  ] as const)('level %i uses numbers %i–%i with sums up to %i', (level, min, max, maxSum) => {
    for (const problem of sample(generateAdditionProblem, level)) {
      expect(problem.operation).toBe('addition');
      expectBetween(problem.firstOperand, min, max);
      expectBetween(problem.secondOperand, min, max);
      expect(problem.correctAnswer).toBe(problem.firstOperand + problem.secondOperand);
      expect(problem.correctAnswer).toBeLessThanOrEqual(maxSum);
      expect(problem.displayText).toBe(`${problem.firstOperand} + ${problem.secondOperand}`);
    }
  });

  it('reaches the smallest and largest numbers', () => {
    expect(generateAdditionProblem(1, alwaysLowest).displayText).toBe('0 + 0');
    expect(generateAdditionProblem(1, alwaysHighest).displayText).toBe('10 + 10');
  });
});

describe('generateSubtractionProblem', () => {
  it.each([
    [1, 0, 10],
    [2, 0, 50],
    [3, 0, 100],
    [4, 10, 999],
  ] as const)('level %i uses numbers %i–%i and never goes below zero', (level, min, max) => {
    for (const problem of sample(generateSubtractionProblem, level)) {
      expectBetween(problem.firstOperand, min, max);
      expectBetween(problem.secondOperand, min, max);
      expect(problem.firstOperand).toBeGreaterThanOrEqual(problem.secondOperand);
      expect(problem.correctAnswer).toBe(problem.firstOperand - problem.secondOperand);
      expect(problem.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(problem.displayText).toBe(`${problem.firstOperand} − ${problem.secondOperand}`);
    }
  });
});

describe('generateMultiplicationProblem', () => {
  // [level, smaller-factor min/max, larger-factor min/max]
  it.each([
    [1, 0, 5, 0, 5],
    [2, 0, 10, 0, 10],
    [3, 2, 9, 2, 99],
    [4, 2, 99, 10, 99],
  ] as const)(
    'level %i uses factors in the expected ranges',
    (level, smallMin, smallMax, largeMin, largeMax) => {
      for (const problem of sample(generateMultiplicationProblem, level)) {
        const small = Math.min(problem.firstOperand, problem.secondOperand);
        const large = Math.max(problem.firstOperand, problem.secondOperand);
        expectBetween(small, smallMin, smallMax);
        expectBetween(large, largeMin, largeMax);
        expect(problem.correctAnswer).toBe(problem.firstOperand * problem.secondOperand);
        expect(problem.displayText).toBe(`${problem.firstOperand} × ${problem.secondOperand}`);
      }
    },
  );

  it('level 3 includes one-digit × one-digit and one-digit × two-digit problems', () => {
    const problems = sample(generateMultiplicationProblem, 3);
    const largerFactors = problems.map((p) => Math.max(p.firstOperand, p.secondOperand));
    expect(largerFactors.some((factor) => factor <= 9)).toBe(true);
    expect(largerFactors.some((factor) => factor >= 10)).toBe(true);
  });

  it('shows the factors in both orders', () => {
    const problems = sample(generateMultiplicationProblem, 4);
    expect(problems.some((p) => p.firstOperand > p.secondOperand)).toBe(true);
    expect(problems.some((p) => p.firstOperand < p.secondOperand)).toBe(true);
  });
});

describe('generateDivisionProblem', () => {
  // [level, divisor min, divisor max, largest dividend]
  it.each([
    [1, 1, 5, 25],
    [2, 1, 10, 100],
    [3, 1, 12, 144],
    [4, 2, 25, 1000],
  ] as const)(
    'level %i uses divisors %i–%i and whole-number answers',
    (level, divisorMin, divisorMax, maxDividend) => {
      for (const problem of sample(generateDivisionProblem, level)) {
        const { firstOperand: dividend, secondOperand: divisor, correctAnswer } = problem;
        expect(divisor).not.toBe(0);
        expectBetween(divisor, divisorMin, divisorMax);
        expect(Number.isInteger(correctAnswer)).toBe(true);
        expect(dividend).toBe(divisor * correctAnswer);
        expect(dividend).toBeLessThanOrEqual(maxDividend);
        expect(problem.displayText).toBe(`${dividend} ÷ ${divisor}`);
      }
    },
  );

  it('cannot divide by zero even at the lowest random value', () => {
    for (const level of DIFFICULTY_LEVELS) {
      expect(generateDivisionProblem(level, alwaysLowest).secondOperand).toBeGreaterThan(0);
    }
  });
});

describe('generateProblem', () => {
  describe.each(MATH_OPERATIONS)('%s', (operation) => {
    it.each(DIFFICULTY_LEVELS)('produces valid problems at level %i', (level) => {
      const random = createSeededRandom(level * 100);
      for (let i = 0; i < SAMPLES; i += 1) {
        const problem = generateProblem(operation, level, random);
        expect(problem.operation).toBe(operation);
        expect(problem.difficulty).toBe(level);
        expect(getProblemErrors(problem)).toEqual([]);
      }
    });

    it.each(DIFFICULTY_LEVELS)('stays valid at the range edges for level %i', (level) => {
      expect(getProblemErrors(generateProblem(operation, level, alwaysLowest))).toEqual([]);
      expect(getProblemErrors(generateProblem(operation, level, alwaysHighest))).toEqual([]);
    });
  });

  it('returns a valid fallback problem when generation keeps failing', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const brokenRandom = () => Number.NaN;

    const problem = generateProblem('addition', 2, brokenRandom);

    expect(getProblemErrors(problem)).toEqual([]);
    expect(problem).toEqual(createFallbackProblem('addition', 2));
    expect(consoleError).toHaveBeenCalledOnce();
  });
});

describe('createFallbackProblem', () => {
  it.each(MATH_OPERATIONS)('is valid for %s at every level', (operation) => {
    for (const level of DIFFICULTY_LEVELS) {
      expect(getProblemErrors(createFallbackProblem(operation, level))).toEqual([]);
    }
  });
});

describe('generateProblemForOperations', () => {
  it('only uses the selected operations, and uses each of them', () => {
    const random = createSeededRandom(5);
    const seen = new Set<string>();
    for (let i = 0; i < SAMPLES; i += 1) {
      const problem = generateProblemForOperations(['subtraction', 'division'], 2, random);
      expect(['subtraction', 'division']).toContain(problem.operation);
      seen.add(problem.operation);
    }
    expect(seen).toEqual(new Set(['subtraction', 'division']));
  });

  it('mixes all four operations in roughly equal amounts', () => {
    const random = createSeededRandom(6);
    const counts: Record<MathOperation, number> = {
      addition: 0,
      subtraction: 0,
      multiplication: 0,
      division: 0,
    };
    const runs = 4000;
    for (let i = 0; i < runs; i += 1) {
      counts[generateProblemForOperations(MATH_OPERATIONS, 1, random).operation] += 1;
    }
    for (const count of Object.values(counts)) {
      expect(count / runs).toBeGreaterThan(0.2);
      expect(count / runs).toBeLessThan(0.3);
    }
  });

  it('rejects an empty list of operations', () => {
    expect(() => generateProblemForOperations([], 1)).toThrow(RangeError);
  });
});
