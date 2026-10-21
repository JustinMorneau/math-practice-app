import { describe, expect, it } from 'vitest';
import { DIFFICULTY_LEVELS, MATH_OPERATIONS, type PracticeAttempt } from '../types';
import {
  addAttemptToStatistics,
  calculateStatistics,
  createEmptyStatistics,
  getAccuracy,
  parseStatistics,
} from './statisticsService';

type Result = Pick<PracticeAttempt, 'operation' | 'difficulty' | 'selfReportedCorrect'>;

const results: Result[] = [
  { operation: 'addition', difficulty: 1, selfReportedCorrect: true },
  { operation: 'addition', difficulty: 1, selfReportedCorrect: false },
  { operation: 'multiplication', difficulty: 2, selfReportedCorrect: true },
  { operation: 'division', difficulty: 3, selfReportedCorrect: true },
  { operation: 'division', difficulty: 2, selfReportedCorrect: false },
];

describe('createEmptyStatistics', () => {
  it('starts every total at zero, for every operation and level', () => {
    const statistics = createEmptyStatistics();
    const zero = { attempted: 0, correct: 0, incorrect: 0 };

    expect(statistics).toMatchObject(zero);
    for (const operation of MATH_OPERATIONS) {
      expect(statistics.byOperation[operation]).toEqual(zero);
    }
    for (const level of DIFFICULTY_LEVELS) {
      expect(statistics.byDifficulty[level]).toEqual(zero);
    }
  });
});

describe('addAttemptToStatistics', () => {
  it('counts a correct answer overall, for its operation, and for its level', () => {
    const statistics = addAttemptToStatistics(createEmptyStatistics(), results[2]);

    expect(statistics).toMatchObject({ attempted: 1, correct: 1, incorrect: 0 });
    const oneCorrect = { attempted: 1, correct: 1, incorrect: 0 };
    expect(statistics.byOperation.multiplication).toEqual(oneCorrect);
    expect(statistics.byDifficulty[2]).toEqual(oneCorrect);
    expect(statistics.byOperation.addition.attempted).toBe(0);
  });

  it('counts an incorrect answer', () => {
    const statistics = addAttemptToStatistics(createEmptyStatistics(), results[1]);

    expect(statistics).toMatchObject({ attempted: 1, correct: 0, incorrect: 1 });
    expect(statistics.byOperation.addition.incorrect).toBe(1);
  });

  it('does not change the statistics it was given', () => {
    const before = createEmptyStatistics();
    addAttemptToStatistics(before, results[0]);

    expect(before.attempted).toBe(0);
  });
});

describe('calculateStatistics', () => {
  it('totals a list of attempts', () => {
    const statistics = calculateStatistics(results);

    expect(statistics).toMatchObject({ attempted: 5, correct: 3, incorrect: 2 });
    expect(statistics.byOperation).toMatchObject({
      addition: { attempted: 2, correct: 1, incorrect: 1 },
      subtraction: { attempted: 0, correct: 0, incorrect: 0 },
      multiplication: { attempted: 1, correct: 1, incorrect: 0 },
      division: { attempted: 2, correct: 1, incorrect: 1 },
    });
    expect(statistics.byDifficulty).toMatchObject({
      1: { attempted: 2, correct: 1, incorrect: 1 },
      2: { attempted: 2, correct: 1, incorrect: 1 },
      3: { attempted: 1, correct: 1, incorrect: 0 },
      4: { attempted: 0, correct: 0, incorrect: 0 },
    });
  });

  it('gives zero totals for no attempts', () => {
    expect(calculateStatistics([])).toEqual(createEmptyStatistics());
  });
});

describe('getAccuracy', () => {
  it('calculates accuracy from totals', () => {
    expect(getAccuracy(calculateStatistics(results))).toBe(60);
  });

  it('is 0 with zero attempts instead of dividing by zero', () => {
    expect(getAccuracy(createEmptyStatistics())).toBe(0);
  });

  it('is 100 when every answer was right and 0 when none were', () => {
    expect(getAccuracy({ attempted: 4, correct: 4, incorrect: 0 })).toBe(100);
    expect(getAccuracy({ attempted: 4, correct: 0, incorrect: 4 })).toBe(0);
  });
});

describe('parseStatistics', () => {
  const statistics = calculateStatistics(results);

  it('accepts complete, consistent statistics', () => {
    expect(parseStatistics(statistics)).toEqual(statistics);
  });

  it('accepts statistics that went through JSON, where level keys become strings', () => {
    expect(parseStatistics(JSON.parse(JSON.stringify(statistics)))).toEqual(statistics);
  });

  const onlyAddition = { addition: statistics.byOperation.addition };

  it.each([
    ['null', null],
    ['totals that do not add up', { ...statistics, correct: 4 }],
    ['a negative total', { ...statistics, attempted: -5, correct: -3, incorrect: -2 }],
    ['a missing operation', { ...statistics, byOperation: onlyAddition }],
    ['a missing level breakdown', { ...statistics, byDifficulty: undefined }],
    [
      'breakdowns that do not match the overall total',
      { ...statistics, attempted: 6, correct: 4, incorrect: 2 },
    ],
  ])('rejects %s', (_description, value) => {
    expect(parseStatistics(value)).toBeNull();
  });
});
