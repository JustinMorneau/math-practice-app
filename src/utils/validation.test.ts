import { describe, expect, it } from 'vitest';
import type { PracticeAttempt, PracticeConfig, PracticeSession } from '../types';
import {
  isDifficultyLevel,
  isMathOperation,
  isOperationList,
  isPracticeAttempt,
  isPracticeConfig,
  isPracticeSession,
  isSessionLength,
} from './validation';

const validConfig: PracticeConfig = {
  operations: ['addition', 'division'],
  difficulty: 2,
  sessionLength: 10,
};

describe('isMathOperation', () => {
  it.each(['addition', 'subtraction', 'multiplication', 'division'])('accepts %s', (value) => {
    expect(isMathOperation(value)).toBe(true);
  });

  it.each(['modulo', 'Addition', '', 1, null, undefined])('rejects %s', (value) => {
    expect(isMathOperation(value)).toBe(false);
  });
});

describe('isDifficultyLevel', () => {
  it.each([1, 2, 3, 4])('accepts %s', (value) => {
    expect(isDifficultyLevel(value)).toBe(true);
  });

  it.each([0, 5, 1.5, '1', null])('rejects %s', (value) => {
    expect(isDifficultyLevel(value)).toBe(false);
  });
});

describe('isSessionLength', () => {
  it.each([5, 10, 20, 1, 'continuous'])('accepts %s', (value) => {
    expect(isSessionLength(value)).toBe(true);
  });

  it.each([0, -5, 2.5, '10', 'forever', null, Number.NaN])('rejects %s', (value) => {
    expect(isSessionLength(value)).toBe(false);
  });
});

describe('isPracticeConfig', () => {
  it('accepts a complete configuration', () => {
    expect(isPracticeConfig(validConfig)).toBe(true);
  });

  it('accepts continuous practice', () => {
    expect(isPracticeConfig({ ...validConfig, sessionLength: 'continuous' })).toBe(true);
  });

  it('accepts both practice modes, and setups saved before modes existed', () => {
    expect(isPracticeConfig({ ...validConfig, mode: 'regular' })).toBe(true);
    expect(isPracticeConfig({ ...validConfig, mode: 'mistake-review' })).toBe(true);
    expect(isPracticeConfig(validConfig)).toBe(true);
  });

  it.each([
    ['null', null],
    ['a string', 'addition'],
    ['no operations', { ...validConfig, operations: [] }],
    ['an unknown operation', { ...validConfig, operations: ['addition', 'modulo'] }],
    ['duplicate operations', { ...validConfig, operations: ['addition', 'addition'] }],
    ['operations that are not an array', { ...validConfig, operations: 'addition' }],
    ['an invalid difficulty', { ...validConfig, difficulty: 7 }],
    ['an invalid session length', { ...validConfig, sessionLength: 0 }],
    ['a missing field', { operations: ['addition'], difficulty: 1 }],
    ['an unknown mode', { ...validConfig, mode: 'speed-round' }],
  ])('rejects %s', (_description, value) => {
    expect(isPracticeConfig(value)).toBe(false);
  });
});

describe('isPracticeSession', () => {
  const session: PracticeSession = {
    id: 's-1',
    startedAt: '2026-10-21T10:00:00.000Z',
    completedAt: '2026-10-21T10:05:00.000Z',
    operations: ['multiplication'],
    difficulty: 2,
    sessionLength: 10,
    attempted: 10,
    correct: 7,
    incorrect: 3,
  };

  it('accepts a complete session', () => {
    expect(isPracticeSession(session)).toBe(true);
  });

  it('accepts a session that has not finished', () => {
    expect(isPracticeSession({ ...session, completedAt: undefined })).toBe(true);
  });

  it.each([
    ['null', null],
    ['a missing id', { ...session, id: undefined }],
    ['totals that do not add up', { ...session, correct: 8 }],
    ['a negative count', { ...session, attempted: -1, correct: -1, incorrect: 0 }],
    ['a fractional count', { ...session, attempted: 9.5, correct: 6.5 }],
    ['an invalid setup', { ...session, operations: [] }],
    ['a non-string completion time', { ...session, completedAt: 5 }],
  ])('rejects %s', (_description, value) => {
    expect(isPracticeSession(value)).toBe(false);
  });
});

describe('isOperationList', () => {
  it('accepts one or more different operations', () => {
    expect(isOperationList(['addition'])).toBe(true);
    expect(isOperationList(['addition', 'division'])).toBe(true);
  });

  it.each([
    ['an empty list', []],
    ['a duplicate', ['addition', 'addition']],
    ['an unknown operation', ['addition', 'modulo']],
    ['a non-list', 'addition'],
  ])('rejects %s', (_description, value) => {
    expect(isOperationList(value)).toBe(false);
  });
});

describe('isPracticeAttempt', () => {
  const attempt: PracticeAttempt = {
    id: 'a-1',
    questionId: 'q-1',
    operation: 'division',
    firstOperand: 56,
    secondOperand: 7,
    correctAnswer: 8,
    selectedAnswer: 9,
    selfReportedCorrect: false,
    difficulty: 2,
    source: 'regular',
    attemptedAt: '2026-10-21T10:01:00.000Z',
    sessionId: 's-1',
  };

  it('accepts a complete attempt', () => {
    expect(isPracticeAttempt(attempt)).toBe(true);
    expect(isPracticeAttempt({ ...attempt, source: 'mistake-review' })).toBe(true);
    expect(
      isPracticeAttempt({ ...attempt, source: 'mistake-review', mistakePatternId: 'm-1' }),
    ).toBe(true);
  });

  it.each([
    ['null', null],
    ['a missing session id', { ...attempt, sessionId: undefined }],
    ['an unknown operation', { ...attempt, operation: 'modulo' }],
    ['an invalid difficulty', { ...attempt, difficulty: 0 }],
    ['a fractional answer', { ...attempt, selectedAnswer: 8.5 }],
    ['a non-boolean result', { ...attempt, selfReportedCorrect: 'yes' }],
    ['an unknown source', { ...attempt, source: 'quiz' }],
    ['a non-string mistake pattern id', { ...attempt, mistakePatternId: 7 }],
  ])('rejects %s', (_description, value) => {
    expect(isPracticeAttempt(value)).toBe(false);
  });
});
