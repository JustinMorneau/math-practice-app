import { describe, expect, it } from 'vitest';
import type { MistakePattern, PracticeAttempt } from '../types';
import { calculateStatistics, createEmptyStatistics } from './statisticsService';
import {
  formatMistakeFact,
  getMostMissedFacts,
  getMostMissedOperations,
  sortByMostMissed,
  summarizeMistakes,
} from './mistakeStatistics';

function pattern(id: string, overrides: Partial<MistakePattern> = {}): MistakePattern {
  return {
    id,
    operation: 'multiplication',
    firstOperand: 8,
    secondOperand: 7,
    correctAnswer: 56,
    difficulty: 2,
    incorrectCount: 1,
    similarCorrectCount: 0,
    lastIncorrectAt: '2026-10-20T10:00:00.000Z',
    mastered: false,
    ...overrides,
  };
}

type Answer = Pick<PracticeAttempt, 'source' | 'selfReportedCorrect'>;
const regular: Answer = { source: 'regular', selfReportedCorrect: false };
const reviewRight: Answer = { source: 'mistake-review', selfReportedCorrect: true };
const reviewWrong: Answer = { source: 'mistake-review', selfReportedCorrect: false };

describe('summarizeMistakes', () => {
  it('counts active and mastered mistakes and review answers', () => {
    const patterns = [pattern('a'), pattern('b'), pattern('c', { mastered: true })];
    const attempts = [regular, reviewRight, reviewWrong, reviewRight];

    expect(summarizeMistakes(patterns, attempts)).toEqual({
      activeCount: 2,
      masteredCount: 1,
      reviewAttempted: 3,
      reviewCorrect: 2,
    });
  });

  it('is all zeros with no mistakes', () => {
    expect(summarizeMistakes([], [])).toEqual({
      activeCount: 0,
      masteredCount: 0,
      reviewAttempted: 0,
      reviewCorrect: 0,
    });
  });
});

describe('getMostMissedOperations', () => {
  function missed(operation: PracticeAttempt['operation']) {
    return { operation, difficulty: 1 as const, selfReportedCorrect: false };
  }

  it('finds the operation missed most often', () => {
    const statistics = calculateStatistics([
      missed('division'),
      missed('division'),
      missed('addition'),
      { operation: 'addition', difficulty: 1, selfReportedCorrect: true },
    ]);

    expect(getMostMissedOperations(statistics)).toEqual(['division']);
  });

  it('lists every operation tied for the most', () => {
    const statistics = calculateStatistics([missed('subtraction'), missed('multiplication')]);

    expect(getMostMissedOperations(statistics)).toEqual(['subtraction', 'multiplication']);
  });

  it('is empty when nothing has been missed', () => {
    expect(getMostMissedOperations(createEmptyStatistics())).toEqual([]);
  });
});

describe('sortByMostMissed', () => {
  it('puts the most missed facts first', () => {
    const patterns = [
      pattern('once'),
      pattern('thrice', { incorrectCount: 3 }),
      pattern('twice', { incorrectCount: 2 }),
    ];

    expect(sortByMostMissed(patterns).map(({ id }) => id)).toEqual(['thrice', 'twice', 'once']);
  });

  it('breaks ties by the most recent miss, then by the fact', () => {
    const patterns = [
      pattern('older', { incorrectCount: 2, lastIncorrectAt: '2026-10-01T00:00:00.000Z' }),
      pattern('newer', { incorrectCount: 2, lastIncorrectAt: '2026-10-21T00:00:00.000Z' }),
      pattern('nine-times', {
        incorrectCount: 2,
        lastIncorrectAt: '2026-10-01T00:00:00.000Z',
        firstOperand: 9,
        correctAnswer: 63,
      }),
    ];

    expect(sortByMostMissed(patterns).map(({ id }) => id)).toEqual([
      'newer',
      'older',
      'nine-times',
    ]);
  });

  it('does not change the original list', () => {
    const patterns = [pattern('a'), pattern('b', { incorrectCount: 4 })];
    sortByMostMissed(patterns);

    expect(patterns.map(({ id }) => id)).toEqual(['a', 'b']);
  });
});

describe('getMostMissedFacts', () => {
  it('returns the top five', () => {
    const patterns = Array.from({ length: 8 }, (_, index) =>
      pattern(`p-${index}`, { incorrectCount: index + 1 }),
    );

    expect(getMostMissedFacts(patterns).map(({ id }) => id)).toEqual([
      'p-7',
      'p-6',
      'p-5',
      'p-4',
      'p-3',
    ]);
  });
});

describe('formatMistakeFact', () => {
  it('shows the fact with its answer', () => {
    expect(formatMistakeFact(pattern('a'))).toBe('8 × 7 = 56');
  });
});
