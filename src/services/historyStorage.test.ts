import { describe, expect, it } from 'vitest';
import { MemoryStorage } from '../test/storage';
import type { PracticeAttempt, PracticeSession } from '../types';
import {
  loadAttempts,
  loadRecentSessions,
  loadSessions,
  saveAttempt,
  saveSession,
} from './historyStorage';
import { STORAGE_KEYS, createStorageService } from './storageService';

function makeSession(id: string, startedAt: string, overrides: Partial<PracticeSession> = {}) {
  const session: PracticeSession = {
    id,
    startedAt,
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 10,
    attempted: 1,
    correct: 1,
    incorrect: 0,
    ...overrides,
  };
  return session;
}

function makeAttempt(id: string, overrides: Partial<PracticeAttempt> = {}): PracticeAttempt {
  return {
    id,
    questionId: `q-${id}`,
    operation: 'multiplication',
    firstOperand: 7,
    secondOperand: 8,
    correctAnswer: 56,
    selectedAnswer: 54,
    selfReportedCorrect: false,
    difficulty: 2,
    source: 'regular',
    attemptedAt: '2026-10-21T10:01:00.000Z',
    sessionId: 's-1',
    ...overrides,
  };
}

describe('sessions', () => {
  it('saves a session and loads it back', () => {
    const storage = createStorageService(new MemoryStorage());
    const session = makeSession('s-1', '2026-10-21T10:00:00.000Z');

    expect(saveSession(session, storage)).toEqual({ ok: true });
    expect(loadSessions(storage)).toEqual([session]);
  });

  it('updates a session saved again, including its completion details', () => {
    const storage = createStorageService(new MemoryStorage());
    saveSession(makeSession('s-1', '2026-10-21T10:00:00.000Z'), storage);

    const finished = makeSession('s-1', '2026-10-21T10:00:00.000Z', {
      attempted: 10,
      correct: 8,
      incorrect: 2,
      completedAt: '2026-10-21T10:07:00.000Z',
    });
    saveSession(finished, storage);

    expect(loadSessions(storage)).toEqual([finished]);
  });

  it('lists recent sessions newest first, up to a limit', () => {
    const storage = createStorageService(new MemoryStorage());
    for (const [id, startedAt] of [
      ['s-1', '2026-10-19T09:00:00.000Z'],
      ['s-3', '2026-10-21T09:00:00.000Z'],
      ['s-2', '2026-10-20T09:00:00.000Z'],
    ]) {
      saveSession(makeSession(id, startedAt), storage);
    }

    expect(loadRecentSessions(2, storage).map(({ id }) => id)).toEqual(['s-3', 's-2']);
  });

  it('keeps only the most recent sessions when there are too many', () => {
    const storage = createStorageService(new MemoryStorage());
    for (let day = 1; day <= 5; day += 1) {
      saveSession(makeSession(`s-${day}`, `2026-10-0${day}T09:00:00.000Z`), storage, 3);
    }

    expect(loadSessions(storage).map(({ id }) => id)).toEqual(['s-3', 's-4', 's-5']);
  });

  it('drops corrupted session records but keeps valid ones', () => {
    const valid = makeSession('s-1', '2026-10-21T10:00:00.000Z');
    const storage = createStorageService(
      new MemoryStorage({
        [STORAGE_KEYS.sessions]: JSON.stringify([valid, { id: 's-2' }, 'garbage']),
      }),
    );

    expect(loadSessions(storage)).toEqual([valid]);
  });
});

describe('attempts', () => {
  it('saves every attempt with its answer, result, operation, level, session, and time', () => {
    const storage = createStorageService(new MemoryStorage());
    const first = makeAttempt('a-1');
    const second = makeAttempt('a-2', {
      operation: 'division',
      difficulty: 3,
      selectedAnswer: 9,
      correctAnswer: 9,
      selfReportedCorrect: true,
      sessionId: 's-2',
      attemptedAt: '2026-10-21T11:00:00.000Z',
    });

    saveAttempt(first, storage);
    saveAttempt(second, storage);

    expect(loadAttempts(storage)).toEqual([first, second]);
  });

  it('does not save the same attempt twice', () => {
    const storage = createStorageService(new MemoryStorage());
    const attempt = makeAttempt('a-1');

    saveAttempt(attempt, storage);
    saveAttempt(attempt, storage);

    expect(loadAttempts(storage)).toHaveLength(1);
  });

  it('keeps attempts after the browser restarts', () => {
    const browserStorage = new MemoryStorage();
    saveAttempt(makeAttempt('a-1'), createStorageService(browserStorage));

    // A new service over the same storage, as after closing and reopening the browser.
    const afterRestart = createStorageService(browserStorage);

    expect(loadAttempts(afterRestart).map(({ id }) => id)).toEqual(['a-1']);
  });

  it('keeps only the most recent attempts when there are too many', () => {
    const storage = createStorageService(new MemoryStorage());
    for (let i = 1; i <= 5; i += 1) {
      saveAttempt(makeAttempt(`a-${i}`), storage, 3);
    }

    expect(loadAttempts(storage).map(({ id }) => id)).toEqual(['a-3', 'a-4', 'a-5']);
  });

  it('drops corrupted attempt records but keeps valid ones', () => {
    const valid = makeAttempt('a-1');
    const storage = createStorageService(
      new MemoryStorage({
        [STORAGE_KEYS.attempts]: JSON.stringify([valid, { ...valid, id: 'a-2', source: 'other' }]),
      }),
    );

    expect(loadAttempts(storage)).toEqual([valid]);
  });

  it('reports when storage is full', () => {
    const storage = createStorageService(new MemoryStorage({}, 'quota-exceeded'));

    expect(saveAttempt(makeAttempt('a-1'), storage)).toEqual({
      ok: false,
      reason: 'quota-exceeded',
    });
  });
});
