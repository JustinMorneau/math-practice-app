/**
 * A safe wrapper around localStorage (specification sections 11, 17, and
 * 20.4). Nothing here throws: reads report whether data was missing,
 * invalid, or unreadable, and writes report why they failed, so the app can
 * keep running and show a friendly warning instead.
 */

/** Every key the app stores, all under the `mathPractice.` prefix. */
export const STORAGE_KEYS = {
  settings: 'mathPractice.settings',
  sessions: 'mathPractice.sessions',
  attempts: 'mathPractice.attempts',
  mistakePatterns: 'mathPractice.mistakePatterns',
  statistics: 'mathPractice.statistics',
  activeSession: 'mathPractice.activeSession',
  version: 'mathPractice.version',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type ReadStatus = 'ok' | 'missing' | 'invalid' | 'unavailable';

export interface ReadResult<T> {
  status: ReadStatus;
  /** The stored value when `status` is `'ok'`, otherwise the fallback. */
  value: T;
}

export type StorageFailure = 'unavailable' | 'quota-exceeded' | 'unknown';

export type WriteResult = { ok: true } | { ok: false; reason: StorageFailure };

/**
 * Turns parsed JSON into a usable value, or returns null when it is not
 * usable at all. Parsers may repair data, for example by dropping invalid
 * items from a list.
 */
export type Parser<T> = (value: unknown) => T | null;

export interface StorageService {
  /** False when the browser blocks storage entirely (e.g. some private modes). */
  readonly isAvailable: boolean;
  read<T>(key: StorageKey, parse: Parser<T>, fallback: T): ReadResult<T>;
  write(key: StorageKey, value: unknown): WriteResult;
  remove(key: StorageKey): WriteResult;
  /** Removes only this app's keys, never other data stored by the same site. */
  clearAppData(): WriteResult;
}

/** The browser's localStorage, or null when it cannot be used at all. */
export function getBrowserStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    // Some browsers expose localStorage but throw on first use.
    storage.getItem(STORAGE_KEYS.version);
    return storage;
  } catch {
    return null;
  }
}

function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014)
  );
}

function toFailure(error: unknown): WriteResult {
  return { ok: false, reason: isQuotaExceededError(error) ? 'quota-exceeded' : 'unknown' };
}

const UNAVAILABLE: WriteResult = { ok: false, reason: 'unavailable' };

export function createStorageService(
  storage: Storage | null = getBrowserStorage(),
): StorageService {
  return {
    isAvailable: storage !== null,

    read<T>(key: StorageKey, parse: Parser<T>, fallback: T): ReadResult<T> {
      if (storage === null) {
        return { status: 'unavailable', value: fallback };
      }

      let raw: string | null;
      try {
        raw = storage.getItem(key);
      } catch {
        return { status: 'unavailable', value: fallback };
      }
      if (raw === null) {
        return { status: 'missing', value: fallback };
      }

      try {
        const parsed = parse(JSON.parse(raw));
        return parsed === null
          ? { status: 'invalid', value: fallback }
          : { status: 'ok', value: parsed };
      } catch {
        return { status: 'invalid', value: fallback };
      }
    },

    write(key: StorageKey, value: unknown): WriteResult {
      if (storage === null) {
        return UNAVAILABLE;
      }
      try {
        storage.setItem(key, JSON.stringify(value));
        return { ok: true };
      } catch (error) {
        return toFailure(error);
      }
    },

    remove(key: StorageKey): WriteResult {
      if (storage === null) {
        return UNAVAILABLE;
      }
      try {
        storage.removeItem(key);
        return { ok: true };
      } catch (error) {
        return toFailure(error);
      }
    },

    clearAppData(): WriteResult {
      if (storage === null) {
        return UNAVAILABLE;
      }
      try {
        for (const key of Object.values(STORAGE_KEYS)) {
          storage.removeItem(key);
        }
        return { ok: true };
      } catch (error) {
        return toFailure(error);
      }
    },
  };
}

/** The storage service the app uses, backed by the browser's localStorage. */
export const appStorage = createStorageService();
