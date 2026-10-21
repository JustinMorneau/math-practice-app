import { describe, expect, it } from 'vitest';
import { MemoryStorage } from '../test/storage';
import { STORAGE_KEYS, createStorageService } from './storageService';

const parseNumber = (value: unknown) => (typeof value === 'number' ? value : null);

describe('createStorageService', () => {
  it('writes and reads back JSON values', () => {
    const service = createStorageService(new MemoryStorage());

    expect(service.write(STORAGE_KEYS.settings, { theme: 'blocks' })).toEqual({ ok: true });
    expect(service.read(STORAGE_KEYS.settings, (value) => value, null)).toEqual({
      status: 'ok',
      value: { theme: 'blocks' },
    });
  });

  it('reports missing data and returns the fallback', () => {
    const service = createStorageService(new MemoryStorage());

    expect(service.read(STORAGE_KEYS.statistics, parseNumber, 0)).toEqual({
      status: 'missing',
      value: 0,
    });
  });

  it('reports data that is not valid JSON as invalid', () => {
    const storage = new MemoryStorage({ [STORAGE_KEYS.statistics]: '{not json' });

    expect(createStorageService(storage).read(STORAGE_KEYS.statistics, parseNumber, 0)).toEqual({
      status: 'invalid',
      value: 0,
    });
  });

  it('reports data the parser rejects as invalid', () => {
    const storage = new MemoryStorage({ [STORAGE_KEYS.statistics]: '"seven"' });

    expect(createStorageService(storage).read(STORAGE_KEYS.statistics, parseNumber, 0)).toEqual({
      status: 'invalid',
      value: 0,
    });
  });

  describe('when browser storage is unavailable', () => {
    const service = createStorageService(null);

    it('says so', () => {
      expect(service.isAvailable).toBe(false);
    });

    it('returns fallbacks instead of throwing', () => {
      expect(service.read(STORAGE_KEYS.settings, parseNumber, 5)).toEqual({
        status: 'unavailable',
        value: 5,
      });
    });

    it('reports failed writes instead of throwing', () => {
      expect(service.write(STORAGE_KEYS.settings, 1)).toEqual({ ok: false, reason: 'unavailable' });
      expect(service.clearAppData()).toEqual({ ok: false, reason: 'unavailable' });
    });
  });

  it('treats a storage that throws on read as unavailable', () => {
    const service = createStorageService(new MemoryStorage({}, 'read-error'));

    expect(service.read(STORAGE_KEYS.settings, parseNumber, 0).status).toBe('unavailable');
  });

  it('reports a full storage as quota-exceeded', () => {
    const service = createStorageService(new MemoryStorage({}, 'quota-exceeded'));

    expect(service.write(STORAGE_KEYS.attempts, [1, 2, 3])).toEqual({
      ok: false,
      reason: 'quota-exceeded',
    });
  });

  it('reports other write errors as unknown', () => {
    const service = createStorageService(new MemoryStorage({}, 'write-error'));

    expect(service.write(STORAGE_KEYS.attempts, [])).toEqual({ ok: false, reason: 'unknown' });
  });

  it('removes a single key', () => {
    const storage = new MemoryStorage({ [STORAGE_KEYS.sessions]: '[]' });

    createStorageService(storage).remove(STORAGE_KEYS.sessions);

    expect(storage.getItem(STORAGE_KEYS.sessions)).toBeNull();
  });

  it('clears only this app’s data, keeping anything else the site stored', () => {
    const storage = new MemoryStorage({
      [STORAGE_KEYS.settings]: '{}',
      [STORAGE_KEYS.attempts]: '[]',
      [STORAGE_KEYS.version]: '{"version":1}',
      'otherApp.preferences': '{"dark":true}',
    });

    expect(createStorageService(storage).clearAppData()).toEqual({ ok: true });

    expect(storage.length).toBe(1);
    expect(storage.getItem('otherApp.preferences')).toBe('{"dark":true}');
  });
});
