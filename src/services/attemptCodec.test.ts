import { describe, expect, it } from 'vitest';
import type { PracticeAttempt } from '../types';
import { decodeAttempt, encodeAttempt, parseStoredAttempts } from './attemptCodec';

const attempt: PracticeAttempt = {
  id: 'a-1f2e3d4c5b6a7980',
  questionId: 'q-0a1b2c3d4e5f6071',
  operation: 'division',
  firstOperand: 56,
  secondOperand: 7,
  correctAnswer: 8,
  selectedAnswer: 9,
  selfReportedCorrect: false,
  difficulty: 2,
  source: 'regular',
  attemptedAt: '2026-10-22T10:05:30.123Z',
  sessionId: 's-9a8b7c6d5e4f3021',
};

const reviewAttempt: PracticeAttempt = {
  ...attempt,
  selfReportedCorrect: true,
  source: 'mistake-review',
  mistakePatternId: 'm-1234567890abcdef',
};

describe('encodeAttempt and decodeAttempt', () => {
  it.each([
    ['a regular attempt', attempt],
    ['a mistake-review attempt', reviewAttempt],
  ])('round-trip %s exactly', (_description, original) => {
    const stored = JSON.parse(JSON.stringify(encodeAttempt(original)));

    expect(decodeAttempt(stored)).toEqual(original);
  });

  it('stores the attempt compactly', () => {
    const compact = JSON.stringify(encodeAttempt(attempt)).length;
    const original = JSON.stringify(attempt).length;

    expect(compact).toBeLessThan(original * 0.5);
  });

  it('keeps an unusual date as it was', () => {
    const odd = { ...attempt, attemptedAt: 'sometime' };

    expect(decodeAttempt(encodeAttempt(odd))).toEqual(odd);
  });

  it.each([
    ['too few values', encodeAttempt(attempt).slice(0, 8)],
    ['an unknown operation code', ['a-1', 'q-1', 'x', 5, 7, 12, 12, 1, 1, 0, 0, 's-1']],
    ['a wrong correct-answer flag', ['a-1', 'q-1', 'a', 5, 7, 12, 12, 2, 1, 0, 0, 's-1']],
    ['an invalid difficulty', ['a-1', 'q-1', 'a', 5, 7, 12, 12, 1, 9, 0, 0, 's-1']],
    ['not a list', { id: 'a-1' }],
  ])('rejects %s', (_description, value) => {
    expect(decodeAttempt(value)).toBeNull();
  });
});

describe('parseStoredAttempts', () => {
  it('reads both the compact form and the original object form', () => {
    expect(parseStoredAttempts([encodeAttempt(attempt), reviewAttempt])).toEqual([
      attempt,
      reviewAttempt,
    ]);
  });

  it('drops invalid records and keeps the rest', () => {
    expect(parseStoredAttempts([encodeAttempt(attempt), ['broken'], 'garbage'])).toEqual([attempt]);
  });

  it('rejects data that is not a list', () => {
    expect(parseStoredAttempts({ attempts: [] })).toBeNull();
  });
});
