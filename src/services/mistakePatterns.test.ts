import { describe, expect, it } from 'vitest';
import type { MistakePattern } from '../types';
import {
  isMistakePattern,
  isSameFact,
  limitMistakePatterns,
  parseMistakePatterns,
  recordIncorrectAnswer,
} from './mistakePatterns';

const missedEightTimesSeven = {
  operation: 'multiplication' as const,
  firstOperand: 8,
  secondOperand: 7,
  correctAnswer: 56,
  difficulty: 2 as const,
  attemptedAt: '2026-10-22T10:00:00.000Z',
};

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
    lastIncorrectAt: '2026-10-22T10:00:00.000Z',
    mastered: false,
    ...overrides,
  };
}

describe('isSameFact', () => {
  it('matches the same problem', () => {
    expect(isSameFact(makePattern('m-1'), missedEightTimesSeven)).toBe(true);
  });

  it('matches addition and multiplication in either order', () => {
    const reversed = { ...missedEightTimesSeven, firstOperand: 7, secondOperand: 8 };
    expect(isSameFact(makePattern('m-1'), reversed)).toBe(true);
    const addition = { operation: 'addition' as const, firstOperand: 3, secondOperand: 9 };
    expect(isSameFact(addition, { ...addition, firstOperand: 9, secondOperand: 3 })).toBe(true);
  });

  it('does not treat reversed subtraction or division as the same fact', () => {
    const subtraction = { operation: 'subtraction' as const, firstOperand: 9, secondOperand: 3 };
    const division = { operation: 'division' as const, firstOperand: 8, secondOperand: 4 };
    const reversedSubtraction = { ...subtraction, firstOperand: 3, secondOperand: 9 };
    const reversedDivision = { ...division, firstOperand: 4, secondOperand: 8 };
    expect(isSameFact(subtraction, reversedSubtraction)).toBe(false);
    expect(isSameFact(division, reversedDivision)).toBe(false);
  });

  it('does not match a different operation with the same numbers', () => {
    const addition = { ...missedEightTimesSeven, operation: 'addition' as const };
    expect(isSameFact(makePattern('m-1'), addition)).toBe(false);
  });
});

describe('recordIncorrectAnswer', () => {
  it('creates a new pattern for a first mistake', () => {
    expect(recordIncorrectAnswer([], missedEightTimesSeven, 'm-1')).toEqual([makePattern('m-1')]);
  });

  it('updates an existing pattern instead of adding a duplicate', () => {
    const existing = makePattern('m-1', { similarCorrectCount: 2 });
    const later = { ...missedEightTimesSeven, attemptedAt: '2026-10-25T08:00:00.000Z' };

    const patterns = recordIncorrectAnswer([existing], later, 'm-2');

    expect(patterns).toEqual([
      makePattern('m-1', { incorrectCount: 2, lastIncorrectAt: '2026-10-25T08:00:00.000Z' }),
    ]);
  });

  it('counts the reversed multiplication fact as the same pattern', () => {
    const reversed = { ...missedEightTimesSeven, firstOperand: 7, secondOperand: 8 };

    const patterns = recordIncorrectAnswer([makePattern('m-1')], reversed, 'm-2');

    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toMatchObject({ id: 'm-1', incorrectCount: 2 });
  });

  it('starts mastery over when a mastered fact is missed again', () => {
    const mastered = makePattern('m-1', { similarCorrectCount: 3, mastered: true });

    const [pattern] = recordIncorrectAnswer([mastered], missedEightTimesSeven, 'm-2');

    expect(pattern).toMatchObject({ similarCorrectCount: 0, mastered: false });
  });

  it('leaves other patterns unchanged', () => {
    const other = makePattern('m-other', { operation: 'addition', correctAnswer: 15 });

    const patterns = recordIncorrectAnswer([other], missedEightTimesSeven, 'm-new');

    expect(patterns[0]).toBe(other);
    expect(patterns).toHaveLength(2);
  });
});

describe('limitMistakePatterns', () => {
  it('keeps everything when under the limit', () => {
    const patterns = [makePattern('m-1'), makePattern('m-2')];

    expect(limitMistakePatterns(patterns, 5)).toEqual(patterns);
  });

  it('removes mastered patterns first, then the oldest', () => {
    const patterns = [
      makePattern('old-active', { lastIncorrectAt: '2026-01-01T00:00:00.000Z' }),
      makePattern('new-mastered', { lastIncorrectAt: '2026-10-01T00:00:00.000Z', mastered: true }),
      makePattern('new-active', { lastIncorrectAt: '2026-10-02T00:00:00.000Z' }),
      makePattern('mid-active', { lastIncorrectAt: '2026-05-01T00:00:00.000Z' }),
    ];

    const kept = limitMistakePatterns(patterns, 2).map(({ id }) => id);

    expect(kept).toEqual(['new-active', 'mid-active']);
  });
});

describe('isMistakePattern', () => {
  it('accepts a valid pattern', () => {
    expect(isMistakePattern(makePattern('m-1'))).toBe(true);
  });

  it.each([
    ['null', null],
    ['a missing id', { ...makePattern('m-1'), id: undefined }],
    ['an unknown operation', makePattern('m-1', { operation: 'modulo' as never })],
    ['a wrong correct answer', makePattern('m-1', { correctAnswer: 54 })],
    ['division by zero', makePattern('m-1', { operation: 'division', secondOperand: 0 })],
    ['a zero incorrect count', makePattern('m-1', { incorrectCount: 0 })],
    ['a negative similar count', makePattern('m-1', { similarCorrectCount: -1 })],
    ['an invalid date', makePattern('m-1', { lastIncorrectAt: 'yesterday' })],
    ['a non-boolean mastered flag', { ...makePattern('m-1'), mastered: 'no' }],
  ])('rejects %s', (_description, value) => {
    expect(isMistakePattern(value)).toBe(false);
  });
});

describe('parseMistakePatterns', () => {
  it('keeps valid records and counts the invalid ones', () => {
    const valid = makePattern('m-1');

    expect(parseMistakePatterns([valid, { id: 'broken' }, 'garbage'])).toEqual({
      patterns: [valid],
      droppedCount: 2,
    });
  });

  it('rejects data that is not a list', () => {
    expect(parseMistakePatterns({ patterns: [] })).toBeNull();
  });
});
