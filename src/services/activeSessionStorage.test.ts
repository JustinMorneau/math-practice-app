import { describe, expect, it } from 'vitest';
import { MemoryStorage } from '../test/storage';
import type { PracticeConfig } from '../types';
import {
  clearActiveSession,
  loadActiveSession,
  parseActiveSession,
  saveActiveSession,
  type ActiveSessionRecord,
} from './activeSessionStorage';
import { createAttempt, createSessionState } from './practiceSession';
import { createProblem, createQuestion } from './questionGenerator';
import { STORAGE_KEYS, createStorageService } from './storageService';

const config: PracticeConfig = {
  operations: ['multiplication'],
  difficulty: 2,
  sessionLength: 10,
  mode: 'regular',
};

function makeRecord(): ActiveSessionRecord {
  const first = createQuestion(createProblem('multiplication', 2, 7, 8));
  const state = createSessionState(config, {
    id: 's-1',
    startedAt: '2026-10-22T10:00:00.000Z',
    firstQuestion: first,
  });
  const attempt = createAttempt({
    id: 'a-1',
    question: first,
    sessionId: 's-1',
    selectedAnswer: 56,
    selfReportedCorrect: true,
    attemptedAt: '2026-10-22T10:01:00.000Z',
  });
  const current = createQuestion(createProblem('multiplication', 2, 6, 9));
  return {
    locationKey: 'key-1',
    state: {
      ...state,
      session: { ...state.session, attempted: 1, correct: 1 },
      attempts: [attempt],
      currentQuestion: current,
    },
    card: { selectedAnswer: current.choices[0], isFlipped: false },
  };
}

describe('active session storage', () => {
  it('saves the session in progress and loads it back', () => {
    const storage = createStorageService(new MemoryStorage());
    const record = makeRecord();

    saveActiveSession(record, storage);

    expect(loadActiveSession(storage)).toEqual(record);
  });

  it('returns null when nothing is saved', () => {
    expect(loadActiveSession(createStorageService(new MemoryStorage()))).toBeNull();
  });

  it('forgets the session when cleared', () => {
    const storage = createStorageService(new MemoryStorage());
    saveActiveSession(makeRecord(), storage);

    clearActiveSession(storage);

    expect(loadActiveSession(storage)).toBeNull();
  });

  it('treats unreadable saved data as no session', () => {
    const storage = createStorageService(
      new MemoryStorage({ [STORAGE_KEYS.activeSession]: '{broken' }),
    );

    expect(loadActiveSession(storage)).toBeNull();
  });
});

describe('parseActiveSession', () => {
  it('accepts a complete record', () => {
    const record = makeRecord();

    expect(parseActiveSession(JSON.parse(JSON.stringify(record)))).toEqual(record);
  });

  it('accepts a flipped card', () => {
    const record = makeRecord();
    record.card.isFlipped = true;

    expect(parseActiveSession(record)).toEqual(record);
  });

  it.each([
    ['a missing location key', (r: ActiveSessionRecord) => ({ ...r, locationKey: 5 })],
    [
      'a session that has ended',
      (r: ActiveSessionRecord) => ({ ...r, state: { ...r.state, status: 'completed' } }),
    ],
    [
      'attempts that do not match the totals',
      (r: ActiveSessionRecord) => ({ ...r, state: { ...r.state, attempts: [] } }),
    ],
    [
      'a broken current question',
      (r: ActiveSessionRecord) => ({
        ...r,
        state: { ...r.state, currentQuestion: { ...r.state.currentQuestion, correctAnswer: 1 } },
      }),
    ],
    [
      'a selected answer that is not a choice',
      (r: ActiveSessionRecord) => ({ ...r, card: { selectedAnswer: 999, isFlipped: false } }),
    ],
    [
      'a flipped card without an answer',
      (r: ActiveSessionRecord) => ({ ...r, card: { selectedAnswer: null, isFlipped: true } }),
    ],
  ])('rejects %s', (_description, corrupt) => {
    expect(parseActiveSession(corrupt(makeRecord()))).toBeNull();
  });
});
