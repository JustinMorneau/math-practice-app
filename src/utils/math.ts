import type { MathOperation } from '../types';

/**
 * A function returning a number in [0, 1), like Math.random.
 * Generators accept one so tests can use a predictable, seeded source.
 */
export type RandomSource = () => number;

/** A random whole number from `min` to `max`, inclusive. */
export function randomInt(min: number, max: number, random: RandomSource = Math.random): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new RangeError(`randomInt needs whole-number bounds, got ${min} and ${max}.`);
  }
  if (min > max) {
    throw new RangeError(`randomInt needs min <= max, got ${min} and ${max}.`);
  }
  return Math.floor(random() * (max - min + 1)) + min;
}

/** A random item from a non-empty list. */
export function pickRandom<T>(items: readonly T[], random: RandomSource = Math.random): T {
  if (items.length === 0) {
    throw new RangeError('pickRandom needs at least one item.');
  }
  return items[randomInt(0, items.length - 1, random)];
}

/**
 * The exact result of `first <operation> second`. Division may return a
 * fraction; question validation rejects those.
 */
export function calculateAnswer(operation: MathOperation, first: number, second: number): number {
  switch (operation) {
    case 'addition':
      return first + second;
    case 'subtraction':
      return first - second;
    case 'multiplication':
      return first * second;
    case 'division':
      return first / second;
    default: {
      const unsupported: never = operation;
      throw new Error(`Unsupported operation: ${String(unsupported)}`);
    }
  }
}
