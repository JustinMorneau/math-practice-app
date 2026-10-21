import { describe, expect, it } from 'vitest';
import { alwaysLowest, createSeededRandom } from '../test/random';
import type { MistakePattern } from '../types';
import {
  generateReviewQuestion,
  getActivePatterns,
  getPatternOperations,
  getReviewPriority,
  pickPatternForReview,
} from './mistakeReview';

const NOW = Date.parse('2026-10-22T12:00:00.000Z');
const HOURS_AGO = (hours: number) => new Date(NOW - hours * 3600 * 1000).toISOString();

function makePattern(id: string, overrides: Partial<MistakePattern> = {}): MistakePattern {
  return {
    id,
    operation: 'multiplication',
    firstOperand: 8,
    secondOperand: 7,
    correctAnswer: 56,
    difficulty: 2,
    incorrectCount: 1,
    similarCorrectCount: 0,
    lastIncorrectAt: HOURS_AGO(48),
    mastered: false,
    ...overrides,
  };
}

const options = { now: NOW, masteryThreshold: 3 };

describe('getReviewPriority', () => {
  it('ranks frequently missed patterns higher', () => {
    const once = getReviewPriority(makePattern('a'), options);
    const often = getReviewPriority(makePattern('b', { incorrectCount: 4 }), options);

    expect(often).toBeGreaterThan(once);
  });

  it('ranks recently missed patterns higher', () => {
    const missedAgo = (hours: number) =>
      getReviewPriority(makePattern('a', { lastIncorrectAt: HOURS_AGO(hours) }), options);
    const today = missedAgo(2);
    const lastWeek = missedAgo(100);
    const lastYear = missedAgo(9000);

    expect(today).toBeGreaterThan(lastWeek);
    expect(lastWeek).toBeGreaterThan(lastYear);
  });

  it('ranks patterns with little successful review higher', () => {
    const noProgress = getReviewPriority(makePattern('a'), options);
    const almostMastered = getReviewPriority(makePattern('b', { similarCorrectCount: 2 }), options);

    expect(noProgress).toBeGreaterThan(almostMastered);
  });

  it('stops counting misses after five, so one fact cannot crowd out the rest', () => {
    const five = getReviewPriority(makePattern('a', { incorrectCount: 5 }), options);
    const fifty = getReviewPriority(makePattern('b', { incorrectCount: 50 }), options);

    expect(fifty).toBe(five);
  });

  it('is always positive', () => {
    const lowest = makePattern('a', { similarCorrectCount: 9, lastIncorrectAt: HOURS_AGO(9000) });
    expect(getReviewPriority(lowest, options)).toBeGreaterThan(0);
  });
});

describe('getActivePatterns and getPatternOperations', () => {
  it('leaves out mastered patterns', () => {
    const patterns = [makePattern('a'), makePattern('b', { mastered: true })];

    expect(getActivePatterns(patterns).map(({ id }) => id)).toEqual(['a']);
  });

  it('lists the operations used, in the usual order', () => {
    const patterns = [
      makePattern('a', {
        operation: 'division',
        firstOperand: 56,
        secondOperand: 7,
        correctAnswer: 8,
      }),
      makePattern('b'),
      makePattern('c', {
        operation: 'addition',
        firstOperand: 2,
        secondOperand: 3,
        correctAnswer: 5,
      }),
    ];

    expect(getPatternOperations(patterns)).toEqual(['addition', 'multiplication', 'division']);
  });
});

describe('pickPatternForReview', () => {
  it('returns null when nothing is left to review', () => {
    expect(pickPatternForReview([])).toBeNull();
    expect(pickPatternForReview([makePattern('a', { mastered: true })])).toBeNull();
  });

  it('never picks a mastered pattern', () => {
    const random = createSeededRandom(1);
    const patterns = [makePattern('active'), makePattern('done', { mastered: true })];
    for (let i = 0; i < 100; i += 1) {
      expect(pickPatternForReview(patterns, { ...options, random })?.id).toBe('active');
    }
  });

  it('picks higher-priority patterns more often', () => {
    const random = createSeededRandom(2);
    const patterns = [
      makePattern('urgent', { incorrectCount: 5, lastIncorrectAt: HOURS_AGO(1) }),
      makePattern('calm', { similarCorrectCount: 2, lastIncorrectAt: HOURS_AGO(9000) }),
    ];
    const counts = { urgent: 0, calm: 0 };
    for (let i = 0; i < 2000; i += 1) {
      const picked = pickPatternForReview(patterns, { ...options, random });
      counts[picked?.id as 'urgent' | 'calm'] += 1;
    }

    expect(counts.urgent).toBeGreaterThan(counts.calm * 2);
    expect(counts.calm).toBeGreaterThan(0);
  });

  it('mixes patterns with the same priority about evenly', () => {
    const random = createSeededRandom(3);
    const patterns = [makePattern('a'), makePattern('b'), makePattern('c')];
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 3000; i += 1) {
      counts[pickPatternForReview(patterns, { ...options, random })?.id ?? ''] += 1;
    }

    for (const count of Object.values(counts)) {
      expect(count / 3000).toBeGreaterThan(0.28);
      expect(count / 3000).toBeLessThan(0.39);
    }
  });

  it('avoids the previous pattern when another is available', () => {
    const patterns = [makePattern('a'), makePattern('b')];
    for (const random of [alwaysLowest, createSeededRandom(4)]) {
      expect(pickPatternForReview(patterns, { random, previousPatternId: 'a' })?.id).toBe('b');
    }
  });

  it('reuses the only remaining pattern', () => {
    expect(pickPatternForReview([makePattern('a')], { previousPatternId: 'a' })?.id).toBe('a');
  });
});

describe('generateReviewQuestion', () => {
  it('builds a review question linked to an active pattern', () => {
    const random = createSeededRandom(5);
    const question = generateReviewQuestion([makePattern('m-1')], { random });

    expect(question).toMatchObject({ source: 'mistake-review', mistakePatternId: 'm-1' });
  });

  it('returns null when every pattern is mastered', () => {
    expect(generateReviewQuestion([makePattern('m-1', { mastered: true })])).toBeNull();
  });
});
