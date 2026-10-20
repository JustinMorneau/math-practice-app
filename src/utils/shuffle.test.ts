import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../test/random';
import { shuffle } from './shuffle';

describe('shuffle', () => {
  it('returns the same items', () => {
    const items = [48, 54, 56, 64];
    const result = shuffle(items, createSeededRandom(1));
    expect([...result].sort((a, b) => a - b)).toEqual(items);
  });

  it('does not change the original list', () => {
    const items = [1, 2, 3, 4];
    shuffle(items, createSeededRandom(2));
    expect(items).toEqual([1, 2, 3, 4]);
  });

  it('returns a new array', () => {
    const items = [1, 2, 3];
    expect(shuffle(items)).not.toBe(items);
  });

  it('handles empty and single-item lists', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(['only'])).toEqual(['only']);
  });

  it('moves an item to every position with roughly equal frequency', () => {
    const random = createSeededRandom(42);
    const runs = 4000;
    const positionCounts = [0, 0, 0, 0];
    for (let i = 0; i < runs; i += 1) {
      positionCounts[shuffle(['target', 'b', 'c', 'd'], random).indexOf('target')] += 1;
    }
    // Each of the 4 positions should get about 25% of runs.
    for (const count of positionCounts) {
      expect(count / runs).toBeGreaterThan(0.2);
      expect(count / runs).toBeLessThan(0.3);
    }
  });
});
