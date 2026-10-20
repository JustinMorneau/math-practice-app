import { describe, expect, it } from 'vitest';
import { DIFFICULTY_LEVELS } from '../types';
import { DIFFICULTY_RULES, isInRange, type NumberRange } from './difficultyRules';

function expectValidRange({ min, max }: NumberRange) {
  expect(Number.isInteger(min)).toBe(true);
  expect(Number.isInteger(max)).toBe(true);
  expect(min).toBeGreaterThanOrEqual(0);
  expect(min).toBeLessThanOrEqual(max);
}

describe('DIFFICULTY_RULES', () => {
  describe.each(DIFFICULTY_LEVELS)('level %i', (level) => {
    const rules = DIFFICULTY_RULES[level];

    it('uses whole-number, non-negative ranges', () => {
      expectValidRange(rules.addition.first);
      expectValidRange(rules.addition.second);
      expectValidRange(rules.subtraction.minuend);
      expectValidRange(rules.subtraction.subtrahend);
      expectValidRange(rules.multiplication.firstFactor);
      expectValidRange(rules.multiplication.secondFactor);
      expectValidRange(rules.division.divisor);
      expectValidRange(rules.division.quotient);
    });

    it('never allows a divisor of zero', () => {
      expect(rules.division.divisor.min).toBeGreaterThanOrEqual(1);
    });

    it('can always pick a second subtraction number no larger than the first', () => {
      expect(rules.subtraction.minuend.min).toBeGreaterThanOrEqual(
        rules.subtraction.subtrahend.min,
      );
    });

    it('can always meet the addition result limit', () => {
      const { first, second, maxResult } = rules.addition;
      if (maxResult !== undefined) {
        expect(first.max + second.min).toBeLessThanOrEqual(maxResult);
      }
    });
  });

  it('matches the specification limits', () => {
    expect(DIFFICULTY_RULES[1].addition).toMatchObject({ first: { max: 10 }, maxResult: 20 });
    expect(DIFFICULTY_RULES[2].addition).toMatchObject({ first: { max: 50 }, maxResult: 100 });
    expect(DIFFICULTY_RULES[1].multiplication.firstFactor).toEqual({ min: 0, max: 5 });
    expect(DIFFICULTY_RULES[2].multiplication.firstFactor).toEqual({ min: 0, max: 10 });
    expect(DIFFICULTY_RULES[1].division.divisor).toEqual({ min: 1, max: 5 });
    expect(DIFFICULTY_RULES[2].division.divisor).toEqual({ min: 1, max: 10 });
    expect(DIFFICULTY_RULES[3].division.divisor).toEqual({ min: 1, max: 12 });
    const level3Division = DIFFICULTY_RULES[3].division;
    expect(level3Division.divisor.max * level3Division.quotient.max).toBeLessThanOrEqual(144);
  });
});

describe('isInRange', () => {
  const range = { min: 2, max: 9 };

  it('includes both ends', () => {
    expect(isInRange(2, range)).toBe(true);
    expect(isInRange(9, range)).toBe(true);
  });

  it('rejects values outside the range and non-whole numbers', () => {
    expect(isInRange(1, range)).toBe(false);
    expect(isInRange(10, range)).toBe(false);
    expect(isInRange(4.5, range)).toBe(false);
  });
});
