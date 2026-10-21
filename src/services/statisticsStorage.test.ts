import { describe, expect, it } from 'vitest';
import { MemoryStorage } from '../test/storage';
import type { PracticeAttempt } from '../types';
import { loadAttempts, loadSessions, saveAttempt, saveSession } from './historyStorage';
import { calculateStatistics, createEmptyStatistics } from './statisticsService';
import { clearPracticeHistory, loadStatistics, recordAttempt } from './statisticsStorage';
import { STORAGE_KEYS, createStorageService } from './storageService';

function makeAttempt(id: string, overrides: Partial<PracticeAttempt> = {}): PracticeAttempt {
  return {
    id,
    questionId: `q-${id}`,
    operation: 'subtraction',
    firstOperand: 9,
    secondOperand: 4,
    correctAnswer: 5,
    selectedAnswer: 5,
    selfReportedCorrect: true,
    difficulty: 1,
    source: 'regular',
    attemptedAt: '2026-10-22T10:00:00.000Z',
    sessionId: 's-1',
    ...overrides,
  };
}

describe('recordAttempt', () => {
  it('saves the attempt and adds it to the statistics', () => {
    const storage = createStorageService(new MemoryStorage());

    recordAttempt(makeAttempt('a-1'), storage);
    const missedDivision = makeAttempt('a-2', {
      selfReportedCorrect: false,
      operation: 'division',
    });
    recordAttempt(missedDivision, storage);

    expect(loadAttempts(storage)).toHaveLength(2);
    const statistics = loadStatistics(storage);
    expect(statistics).toMatchObject({ attempted: 2, correct: 1, incorrect: 1 });
    expect(statistics.byOperation.division).toEqual({ attempted: 1, correct: 0, incorrect: 1 });
  });

  it('never counts the same attempt twice', () => {
    const storage = createStorageService(new MemoryStorage());
    const attempt = makeAttempt('a-1');

    recordAttempt(attempt, storage);
    recordAttempt(attempt, storage);

    expect(loadStatistics(storage).attempted).toBe(1);
  });

  it('counts the first attempt once when no statistics were stored yet', () => {
    const storage = createStorageService(new MemoryStorage());
    saveAttempt(makeAttempt('older'), storage);

    recordAttempt(makeAttempt('new'), storage);

    expect(loadStatistics(storage).attempted).toBe(2);
  });

  it('keeps all-time totals even after old attempts are trimmed', () => {
    const storage = createStorageService(new MemoryStorage());
    for (let i = 1; i <= 3; i += 1) {
      recordAttempt(makeAttempt(`a-${i}`), storage);
    }
    // Simulate old records being removed to save space.
    storage.write(STORAGE_KEYS.attempts, loadAttempts(storage).slice(-1));

    expect(loadStatistics(storage).attempted).toBe(3);
  });

  it('reports a full storage', () => {
    const storage = createStorageService(new MemoryStorage({}, 'quota-exceeded'));

    expect(recordAttempt(makeAttempt('a-1'), storage)).toEqual({
      ok: false,
      reason: 'quota-exceeded',
    });
  });
});

describe('loadStatistics', () => {
  it('gives zero totals when nothing has been practiced, without saving anything', () => {
    const browserStorage = new MemoryStorage();

    expect(loadStatistics(createStorageService(browserStorage))).toEqual(createEmptyStatistics());
    expect(browserStorage.getItem(STORAGE_KEYS.statistics)).toBeNull();
  });

  it('builds statistics from saved attempts when none are stored', () => {
    // As for progress saved before statistics existed.
    const storage = createStorageService(new MemoryStorage());
    const attempts = [makeAttempt('a-1'), makeAttempt('a-2', { selfReportedCorrect: false })];
    for (const attempt of attempts) {
      saveAttempt(attempt, storage);
    }

    expect(loadStatistics(storage)).toEqual(calculateStatistics(attempts));
    expect(storage.read(STORAGE_KEYS.statistics, (value) => value, null).status).toBe('ok');
  });

  it('rebuilds corrupted statistics from saved attempts', () => {
    const browserStorage = new MemoryStorage({ [STORAGE_KEYS.statistics]: '{"attempted":"lots"}' });
    const storage = createStorageService(browserStorage);
    saveAttempt(makeAttempt('a-1'), storage);

    expect(loadStatistics(storage)).toMatchObject({ attempted: 1, correct: 1 });
  });

  it('gives zero totals when storage is unavailable', () => {
    expect(loadStatistics(createStorageService(null))).toEqual(createEmptyStatistics());
  });
});

describe('clearPracticeHistory', () => {
  it('erases attempts, sessions, statistics, and mistake patterns but keeps settings', () => {
    const browserStorage = new MemoryStorage({
      [STORAGE_KEYS.settings]: '{"showExplanations":false}',
      [STORAGE_KEYS.version]: '{"version":1}',
      [STORAGE_KEYS.mistakePatterns]: '[]',
      'otherApp.data': 'keep me',
    });
    const storage = createStorageService(browserStorage);
    recordAttempt(makeAttempt('a-1'), storage);
    saveSession(
      {
        id: 's-1',
        startedAt: '2026-10-22T10:00:00.000Z',
        operations: ['subtraction'],
        difficulty: 1,
        sessionLength: 5,
        attempted: 1,
        correct: 1,
        incorrect: 0,
      },
      storage,
    );

    expect(clearPracticeHistory(storage)).toEqual({ ok: true });

    expect(loadAttempts(storage)).toEqual([]);
    expect(loadSessions(storage)).toEqual([]);
    expect(browserStorage.getItem(STORAGE_KEYS.statistics)).toBeNull();
    expect(browserStorage.getItem(STORAGE_KEYS.mistakePatterns)).toBeNull();
    expect(browserStorage.getItem(STORAGE_KEYS.settings)).toBe('{"showExplanations":false}');
    expect(browserStorage.getItem(STORAGE_KEYS.version)).toBe('{"version":1}');
    expect(browserStorage.getItem('otherApp.data')).toBe('keep me');
  });
});
