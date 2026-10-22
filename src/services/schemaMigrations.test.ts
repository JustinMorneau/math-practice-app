import { describe, expect, it, vi } from 'vitest';
import { MemoryStorage } from '../test/storage';
import type { PracticeAttempt } from '../types';
import { loadAttempts } from './historyStorage';
import { CURRENT_SCHEMA_VERSION, ensureSchemaVersion, type Migration } from './schemaMigrations';
import { STORAGE_KEYS, createStorageService } from './storageService';

function storedVersion(storage: MemoryStorage) {
  return JSON.parse(storage.getItem(STORAGE_KEYS.version) ?? 'null');
}

describe('ensureSchemaVersion', () => {
  it('records the current version on first launch', () => {
    const storage = new MemoryStorage();

    expect(ensureSchemaVersion(createStorageService(storage))).toBe('initialized');
    expect(storedVersion(storage)).toEqual({ version: CURRENT_SCHEMA_VERSION });
  });

  it('leaves data that already uses the current version alone', () => {
    const storage = new MemoryStorage({ [STORAGE_KEYS.version]: '{"version":1}' });

    expect(ensureSchemaVersion(createStorageService(storage), [], 1)).toBe('current');
  });

  it('runs pending migrations in order and records each new version', () => {
    const storage = new MemoryStorage({ [STORAGE_KEYS.version]: '{"version":1}' });
    const calls: number[] = [];
    const migrations: Migration[] = [
      { toVersion: 3, migrate: () => calls.push(3) },
      { toVersion: 2, migrate: () => calls.push(2) },
      { toVersion: 4, migrate: () => calls.push(4) },
    ];

    const status = ensureSchemaVersion(createStorageService(storage), migrations, 3);

    expect(status).toBe('migrated');
    expect(calls).toEqual([2, 3]);
    expect(storedVersion(storage)).toEqual({ version: 3 });
  });

  it('skips migrations the data has already had', () => {
    const storage = new MemoryStorage({ [STORAGE_KEYS.version]: '{"version":2}' });
    const toTwo = vi.fn();
    const toThree = vi.fn();

    ensureSchemaVersion(
      createStorageService(storage),
      [
        { toVersion: 2, migrate: toTwo },
        { toVersion: 3, migrate: toThree },
      ],
      3,
    );

    expect(toTwo).not.toHaveBeenCalled();
    expect(toThree).toHaveBeenCalledOnce();
  });

  it('does not touch data written by a newer version of the app', () => {
    const storage = new MemoryStorage({
      [STORAGE_KEYS.version]: '{"version":9}',
      [STORAGE_KEYS.sessions]: '[{"future":true}]',
    });

    expect(ensureSchemaVersion(createStorageService(storage), [], 1)).toBe('newer');
    expect(storedVersion(storage)).toEqual({ version: 9 });
    expect(storage.getItem(STORAGE_KEYS.sessions)).toBe('[{"future":true}]');
  });

  it('replaces a corrupted version record without touching other data', () => {
    const storage = new MemoryStorage({
      [STORAGE_KEYS.version]: '{"version":"one"}',
      [STORAGE_KEYS.settings]: '{"showExplanations":false}',
      'otherApp.data': 'keep me',
    });

    expect(ensureSchemaVersion(createStorageService(storage))).toBe('initialized');
    expect(storedVersion(storage)).toEqual({ version: CURRENT_SCHEMA_VERSION });
    expect(storage.getItem(STORAGE_KEYS.settings)).toBe('{"showExplanations":false}');
    expect(storage.getItem('otherApp.data')).toBe('keep me');
  });

  it('reports unavailable storage without throwing', () => {
    expect(ensureSchemaVersion(createStorageService(null))).toBe('unavailable');
  });
});

describe('version 2: compact attempts', () => {
  const attempt: PracticeAttempt = {
    id: 'a-6f1d0f6a-6a43-4a63-8f5e-0d53f2c4b5e1',
    questionId: 'q-1c7a0f6a-6a43-4a63-8f5e-0d53f2c4b5e1',
    operation: 'multiplication',
    firstOperand: 8,
    secondOperand: 7,
    correctAnswer: 56,
    selectedAnswer: 54,
    selfReportedCorrect: false,
    difficulty: 2,
    source: 'regular',
    attemptedAt: '2026-10-21T15:05:00.000Z',
    sessionId: 's-2b7a0f6a-6a43-4a63-8f5e-0d53f2c4b5e1',
  };

  it('rewrites attempts saved by version 1 in the compact form, keeping every detail', () => {
    const browserStorage = new MemoryStorage({
      [STORAGE_KEYS.version]: '{"version":1}',
      [STORAGE_KEYS.attempts]: JSON.stringify([attempt]),
    });
    const storage = createStorageService(browserStorage);
    const before = browserStorage.getItem(STORAGE_KEYS.attempts) ?? '';

    expect(ensureSchemaVersion(storage)).toBe('migrated');

    const after = browserStorage.getItem(STORAGE_KEYS.attempts) ?? '';
    expect(Array.isArray(JSON.parse(after)[0])).toBe(true);
    expect(after.length).toBeLessThan(before.length);
    expect(loadAttempts(storage)).toEqual([attempt]);
    expect(storedVersion(browserStorage)).toEqual({ version: 2 });
  });

  it('writes nothing when there are no attempts', () => {
    const browserStorage = new MemoryStorage({ [STORAGE_KEYS.version]: '{"version":1}' });

    ensureSchemaVersion(createStorageService(browserStorage));

    expect(browserStorage.getItem(STORAGE_KEYS.attempts)).toBeNull();
  });
});
