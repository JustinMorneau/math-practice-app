/**
 * Number ranges for every operation at every difficulty level
 * (specification section 7). All ranges are inclusive.
 *
 * Where the specification leaves a value open, the choice is noted below.
 * Changing a range here changes both question generation and validation.
 */
import type { DifficultyLevel } from '../types';

export interface NumberRange {
  readonly min: number;
  readonly max: number;
}

export interface AdditionRules {
  readonly first: NumberRange;
  readonly second: NumberRange;
  /** Largest allowed sum, when the level sets one. */
  readonly maxResult?: number;
}

/** The second number is never larger than the first, so answers are never negative. */
export interface SubtractionRules {
  readonly minuend: NumberRange;
  readonly subtrahend: NumberRange;
}

/** The two factors may appear in either order. */
export interface MultiplicationRules {
  readonly firstFactor: NumberRange;
  readonly secondFactor: NumberRange;
}

/**
 * Division is built from a divisor and a whole-number quotient, then
 * dividend = divisor × quotient (specification section 9).
 */
export interface DivisionRules {
  readonly divisor: NumberRange;
  readonly quotient: NumberRange;
}

export interface DifficultyRules {
  readonly addition: AdditionRules;
  readonly subtraction: SubtractionRules;
  readonly multiplication: MultiplicationRules;
  readonly division: DivisionRules;
}

export const DIFFICULTY_RULES: Readonly<Record<DifficultyLevel, DifficultyRules>> = {
  // Level 1: Beginner
  1: {
    addition: { first: { min: 0, max: 10 }, second: { min: 0, max: 10 }, maxResult: 20 },
    subtraction: { minuend: { min: 0, max: 10 }, subtrahend: { min: 0, max: 10 } },
    multiplication: { firstFactor: { min: 0, max: 5 }, secondFactor: { min: 0, max: 5 } },
    // Choice: quotients 0–5, matching the Level 1 times tables.
    division: { divisor: { min: 1, max: 5 }, quotient: { min: 0, max: 5 } },
  },
  // Level 2: Easy
  2: {
    addition: { first: { min: 0, max: 50 }, second: { min: 0, max: 50 }, maxResult: 100 },
    subtraction: { minuend: { min: 0, max: 50 }, subtrahend: { min: 0, max: 50 } },
    multiplication: { firstFactor: { min: 0, max: 10 }, secondFactor: { min: 0, max: 10 } },
    // Choice: quotients 0–10, matching the Level 2 times tables.
    division: { divisor: { min: 1, max: 10 }, quotient: { min: 0, max: 10 } },
  },
  // Level 3: Intermediate
  3: {
    addition: { first: { min: 0, max: 100 }, second: { min: 0, max: 100 } },
    subtraction: { minuend: { min: 0, max: 100 }, subtrahend: { min: 0, max: 100 } },
    // One-digit × one-digit and one-digit × two-digit. Choice: factors of
    // 0 and 1 are left to the lower levels.
    multiplication: { firstFactor: { min: 2, max: 9 }, secondFactor: { min: 2, max: 99 } },
    // Divisors 1–12 and dividends up to 144 (12 × 12).
    division: { divisor: { min: 1, max: 12 }, quotient: { min: 0, max: 12 } },
  },
  // Level 4: Advanced
  4: {
    // Choice: multi-digit means at least two digits; numbers stay below 1,000.
    addition: { first: { min: 10, max: 999 }, second: { min: 10, max: 999 } },
    subtraction: { minuend: { min: 10, max: 999 }, subtrahend: { min: 10, max: 999 } },
    // Two-digit × one-digit and two-digit × two-digit.
    multiplication: { firstFactor: { min: 10, max: 99 }, secondFactor: { min: 2, max: 99 } },
    // Choice: one- or two-digit divisors up to 25 and quotients 5–40,
    // so dividends stay at or below 1,000.
    division: { divisor: { min: 2, max: 25 }, quotient: { min: 5, max: 40 } },
  },
};

export function isInRange(value: number, { min, max }: NumberRange): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}
