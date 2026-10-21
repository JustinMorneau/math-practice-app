import { describe, expect, it } from 'vitest';
import { alwaysHighest, alwaysLowest, createSeededRandom } from '../test/random';
import { calculateAccuracy, calculateAnswer, pickRandom, randomInt } from './math';

describe('randomInt', () => {
  it('returns the minimum when the random source is at its lowest', () => {
    expect(randomInt(3, 9, alwaysLowest)).toBe(3);
  });

  it('returns the maximum when the random source is at its highest', () => {
    expect(randomInt(3, 9, alwaysHighest)).toBe(9);
  });

  it('returns min when min equals max', () => {
    expect(randomInt(7, 7)).toBe(7);
  });

  it('only returns whole numbers in range, and reaches every value', () => {
    const random = createSeededRandom(1);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i += 1) {
      const value = randomInt(-2, 4, random);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(-2);
      expect(value).toBeLessThanOrEqual(4);
      seen.add(value);
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([-2, -1, 0, 1, 2, 3, 4]);
  });

  it('rejects min greater than max', () => {
    expect(() => randomInt(5, 1)).toThrow(RangeError);
  });

  it('rejects bounds that are not whole numbers', () => {
    expect(() => randomInt(0.5, 3)).toThrow(RangeError);
    expect(() => randomInt(0, Number.NaN)).toThrow(RangeError);
  });
});

describe('pickRandom', () => {
  it('returns an item from the list', () => {
    const items = ['a', 'b', 'c'];
    expect(items).toContain(pickRandom(items, createSeededRandom(2)));
  });

  it('can return every item', () => {
    const random = createSeededRandom(3);
    const seen = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      seen.add(pickRandom(['a', 'b', 'c'], random));
    }
    expect(seen.size).toBe(3);
  });

  it('rejects an empty list', () => {
    expect(() => pickRandom([])).toThrow(RangeError);
  });
});

describe('calculateAnswer', () => {
  it.each([
    ['addition', 7, 8, 15],
    ['subtraction', 15, 8, 7],
    ['multiplication', 7, 8, 56],
    ['division', 56, 7, 8],
  ] as const)('calculates %s of %i and %i', (operation, first, second, expected) => {
    expect(calculateAnswer(operation, first, second)).toBe(expected);
  });

  it('returns a fraction for uneven division so validation can reject it', () => {
    expect(calculateAnswer('division', 7, 2)).toBe(3.5);
  });
});

describe('calculateAccuracy', () => {
  it.each([
    [7, 10, 70],
    [2, 3, 67],
    [1, 3, 33],
    [10, 10, 100],
    [0, 10, 0],
  ])('%i right out of %i is %i%%', (correct, attempted, expected) => {
    expect(calculateAccuracy(correct, attempted)).toBe(expected);
  });

  it('is 0 when nothing was attempted', () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
  });

  it('only shows 100% when every answer was right', () => {
    expect(calculateAccuracy(199, 200)).toBe(99);
  });

  it('never shows 0% when at least one answer was right', () => {
    expect(calculateAccuracy(1, 250)).toBe(1);
  });
});
