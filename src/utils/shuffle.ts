import { randomInt, type RandomSource } from './math';

/**
 * Returns a shuffled copy of `items` using the Fisher–Yates algorithm, which
 * gives every order an equal chance. The original list is not changed.
 */
export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index, random);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
