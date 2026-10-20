import type { RandomSource } from '../utils/math';

/**
 * A small seeded pseudo-random generator (mulberry32). The same seed always
 * produces the same sequence, which keeps randomized tests repeatable.
 */
export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Always picks the lowest possible value. */
export const alwaysLowest: RandomSource = () => 0;

/** Always picks the highest possible value. */
export const alwaysHighest: RandomSource = () => 0.999_999_999;
