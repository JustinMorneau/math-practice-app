import { describe, expect, it } from 'vitest';
import { MemoryStorage } from '../test/storage';
import type { MistakePattern } from '../types';
import { loadMistakePatterns, repairMistakePatterns, saveMistakePatterns } from './mistakeStorage';
import { STORAGE_KEYS, createStorageService } from './storageService';

const pattern: MistakePattern = {
  id: 'm-1',
  operation: 'division',
  firstOperand: 56,
  secondOperand: 7,
  correctAnswer: 8,
  difficulty: 2,
  incorrectCount: 2,
  similarCorrectCount: 1,
  lastIncorrectAt: '2026-10-22T10:00:00.000Z',
  mastered: false,
};

describe('mistake pattern storage', () => {
  it('saves patterns and loads them back', () => {
    const storage = createStorageService(new MemoryStorage());

    saveMistakePatterns([pattern], storage);

    expect(loadMistakePatterns(storage)).toEqual({ patterns: [pattern], droppedCount: 0 });
  });

  it('loads an empty list when nothing is saved', () => {
    expect(loadMistakePatterns(createStorageService(new MemoryStorage())).patterns).toEqual([]);
  });

  it('skips invalid records while loading', () => {
    const storage = createStorageService(
      new MemoryStorage({
        [STORAGE_KEYS.mistakePatterns]: JSON.stringify([pattern, { ...pattern, correctAnswer: 9 }]),
      }),
    );

    expect(loadMistakePatterns(storage)).toEqual({ patterns: [pattern], droppedCount: 1 });
  });
});

describe('repairMistakePatterns', () => {
  it('removes invalid records from storage and keeps the valid ones', () => {
    const browserStorage = new MemoryStorage({
      [STORAGE_KEYS.mistakePatterns]: JSON.stringify([pattern, { id: 'broken' }]),
    });

    const patterns = repairMistakePatterns(createStorageService(browserStorage));

    expect(patterns).toEqual([pattern]);
    const stored = browserStorage.getItem(STORAGE_KEYS.mistakePatterns) ?? '';
    expect(JSON.parse(stored)).toEqual([pattern]);
  });

  it('replaces unreadable data with an empty list without touching other data', () => {
    const browserStorage = new MemoryStorage({
      [STORAGE_KEYS.mistakePatterns]: '{not json',
      [STORAGE_KEYS.attempts]: '[]',
    });

    expect(repairMistakePatterns(createStorageService(browserStorage))).toEqual([]);
    expect(browserStorage.getItem(STORAGE_KEYS.mistakePatterns)).toBe('[]');
    expect(browserStorage.getItem(STORAGE_KEYS.attempts)).toBe('[]');
  });

  it('leaves valid data as it is', () => {
    const stored = JSON.stringify([pattern]);
    const browserStorage = new MemoryStorage({ [STORAGE_KEYS.mistakePatterns]: stored });

    repairMistakePatterns(createStorageService(browserStorage));

    expect(browserStorage.getItem(STORAGE_KEYS.mistakePatterns)).toBe(stored);
  });

  it('does nothing when no patterns are saved', () => {
    const browserStorage = new MemoryStorage();

    expect(repairMistakePatterns(createStorageService(browserStorage))).toEqual([]);
    expect(browserStorage.getItem(STORAGE_KEYS.mistakePatterns)).toBeNull();
  });
});
