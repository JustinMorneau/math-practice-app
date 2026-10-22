import { describe, expect, it } from 'vitest';
import { MemoryStorage } from '../test/storage';
import type { PracticeAttempt } from '../types';
import { recordAttempt } from './attemptRecorder';
import { MAX_STORED_ATTEMPTS, loadAttempts, saveAttempt, saveAttempts } from './historyStorage';
import { loadMistakePatterns, saveMistakePatterns } from './mistakeStorage';
import { loadStatistics } from './statisticsStorage';
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

describe('recordAttempt: attempts and statistics', () => {
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
describe('recordAttempt: mistake patterns', () => {
  it('creates a mistake pattern for an incorrect answer', () => {
    const storage = createStorageService(new MemoryStorage());

    recordAttempt(
      makeAttempt('a-1', {
        operation: 'multiplication',
        firstOperand: 8,
        secondOperand: 7,
        correctAnswer: 56,
        selectedAnswer: 54,
        selfReportedCorrect: false,
        difficulty: 2,
        attemptedAt: '2026-10-22T10:05:00.000Z',
      }),
      storage,
    );

    expect(loadMistakePatterns(storage).patterns).toEqual([
      {
        id: expect.stringMatching(/^m-/),
        operation: 'multiplication',
        firstOperand: 8,
        secondOperand: 7,
        correctAnswer: 56,
        difficulty: 2,
        incorrectCount: 1,
        similarCorrectCount: 0,
        lastIncorrectAt: '2026-10-22T10:05:00.000Z',
        mastered: false,
      },
    ]);
  });

  it('does not create a pattern for a correct answer', () => {
    const storage = createStorageService(new MemoryStorage());

    recordAttempt(makeAttempt('a-1'), storage);

    expect(loadMistakePatterns(storage).patterns).toEqual([]);
  });

  it('updates the existing pattern when the same fact is missed again', () => {
    const storage = createStorageService(new MemoryStorage());
    const missed = { selfReportedCorrect: false };

    recordAttempt(makeAttempt('a-1', missed), storage);
    const laterMiss = makeAttempt('a-2', { ...missed, attemptedAt: '2026-10-23T09:00:00.000Z' });
    recordAttempt(laterMiss, storage);

    const { patterns } = loadMistakePatterns(storage);
    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toMatchObject({
      incorrectCount: 2,
      lastIncorrectAt: '2026-10-23T09:00:00.000Z',
    });
  });

  it('records a missed fact only once when the same attempt is recorded twice', () => {
    const storage = createStorageService(new MemoryStorage());
    const attempt = makeAttempt('a-1', { selfReportedCorrect: false });

    recordAttempt(attempt, storage);
    recordAttempt(attempt, storage);

    expect(loadMistakePatterns(storage).patterns[0].incorrectCount).toBe(1);
  });
});

describe('recordAttempt: mistake review', () => {
  const original = {
    id: 'm-original',
    operation: 'multiplication' as const,
    firstOperand: 8,
    secondOperand: 7,
    correctAnswer: 56,
    difficulty: 2 as const,
    incorrectCount: 1,
    similarCorrectCount: 0,
    lastIncorrectAt: '2026-10-21T10:00:00.000Z',
    mastered: false,
  };

  /** A review answer for 56 ÷ 8, a fact-family question from 8 × 7. */
  function reviewAttempt(id: string, correct: boolean): PracticeAttempt {
    return makeAttempt(id, {
      operation: 'division',
      firstOperand: 56,
      secondOperand: 8,
      correctAnswer: 7,
      selectedAnswer: correct ? 7 : 6,
      selfReportedCorrect: correct,
      difficulty: 2,
      source: 'mistake-review',
      mistakePatternId: 'm-original',
    });
  }

  function storageWithOriginal() {
    const storage = createStorageService(new MemoryStorage());
    saveMistakePatterns([original], storage);
    return storage;
  }

  function findOriginal(storage: ReturnType<typeof storageWithOriginal>) {
    return loadMistakePatterns(storage).patterns.find(({ id }) => id === 'm-original');
  }

  it('counts a correct review answer toward the original mistake', () => {
    const storage = storageWithOriginal();

    recordAttempt(reviewAttempt('a-1', true), storage);

    expect(findOriginal(storage)).toMatchObject({ similarCorrectCount: 1, mastered: false });
  });

  it('masters the original mistake after three correct review answers', () => {
    const storage = storageWithOriginal();

    for (const id of ['a-1', 'a-2', 'a-3']) {
      recordAttempt(reviewAttempt(id, true), storage);
    }

    expect(findOriginal(storage)).toMatchObject({ similarCorrectCount: 3, mastered: true });
  });

  it('uses the mastery threshold from settings', () => {
    const storage = storageWithOriginal();

    recordAttempt(reviewAttempt('a-1', true), storage, { masteryThreshold: 2 });
    recordAttempt(reviewAttempt('a-2', true), storage, { masteryThreshold: 2 });

    expect(findOriginal(storage)?.mastered).toBe(true);
  });

  it('handles an incorrect review answer: a step back, plus a mistake for the new fact', () => {
    const storage = storageWithOriginal();
    recordAttempt(reviewAttempt('a-1', true), storage);

    recordAttempt(reviewAttempt('a-2', false), storage);

    const { patterns } = loadMistakePatterns(storage);
    expect(findOriginal(storage)?.similarCorrectCount).toBe(0);
    expect(patterns).toHaveLength(2);
    expect(patterns[1]).toMatchObject({
      operation: 'division',
      firstOperand: 56,
      secondOperand: 8,
    });
  });

  it('counts a review answer only once', () => {
    const storage = storageWithOriginal();

    recordAttempt(reviewAttempt('a-1', true), storage);
    recordAttempt(reviewAttempt('a-1', true), storage);

    expect(findOriginal(storage)?.similarCorrectCount).toBe(1);
  });
});

describe('recordAttempt with a large practice history', () => {
  /** A full history of saved attempts, as after months of practice. */
  function storageWithFullHistory() {
    const browserStorage = new MemoryStorage();
    const storage = createStorageService(browserStorage);
    const history = Array.from({ length: MAX_STORED_ATTEMPTS }, (_, index) =>
      makeAttempt(`old-${index}`, { selfReportedCorrect: index % 4 !== 0 }),
    );
    saveAttempts(history, storage);
    return { browserStorage, storage };
  }

  it('keeps recording, removing the oldest details but keeping all-time totals', () => {
    const { storage } = storageWithFullHistory();

    recordAttempt(makeAttempt('newest'), storage);

    const attempts = loadAttempts(storage);
    expect(attempts).toHaveLength(MAX_STORED_ATTEMPTS);
    expect(attempts[0].id).toBe('old-1');
    expect(attempts.at(-1)?.id).toBe('newest');
    expect(loadStatistics(storage).attempted).toBe(MAX_STORED_ATTEMPTS + 1);
  });

  it('keeps several thousand attempts compact', () => {
    const { browserStorage } = storageWithFullHistory();

    const stored = browserStorage.getItem(STORAGE_KEYS.attempts) ?? '';

    // About 90 characters each, instead of over 300 as plain objects.
    expect(stored.length / MAX_STORED_ATTEMPTS).toBeLessThan(120);
  });
});
