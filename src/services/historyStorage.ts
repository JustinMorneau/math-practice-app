/**
 * Saves and loads practice sessions and attempts (specification sections
 * 10.1, 10.2, 11, and 23). Saving is idempotent: saving the same session or
 * attempt again updates it rather than adding a duplicate.
 *
 * To keep storage compact, attempts are saved in a compact array form (see
 * attemptCodec) and only the most recent records are kept. Aggregate
 * statistics are stored separately, so trimming old records does not change
 * the student's all-time totals.
 */
import type { PracticeAttempt, PracticeSession } from '../types';
import { isPracticeSession } from '../utils/validation';
import { encodeAttempt, parseStoredAttempts } from './attemptCodec';
import { STORAGE_KEYS, appStorage, type StorageService, type WriteResult } from './storageService';

/** Most sessions kept in storage; the oldest are removed first. */
export const MAX_STORED_SESSIONS = 100;

/** Most attempts kept in storage (several thousand, per section 23); the oldest go first. */
export const MAX_STORED_ATTEMPTS = 5000;

/** Keeps the valid items of a stored list and drops any that are corrupted. */
function parseList<T>(isValid: (item: unknown) => item is T) {
  return (value: unknown): T[] | null => (Array.isArray(value) ? value.filter(isValid) : null);
}

const parseSessions = parseList(isPracticeSession);

export function loadSessions(storage: StorageService = appStorage): PracticeSession[] {
  return storage.read(STORAGE_KEYS.sessions, parseSessions, []).value;
}

/** The most recently started sessions, newest first. */
export function loadRecentSessions(
  limit = 10,
  storage: StorageService = appStorage,
): PracticeSession[] {
  return [...loadSessions(storage)]
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
}

/** Adds a session, or updates it if a session with the same id is already saved. */
export function saveSession(
  session: PracticeSession,
  storage: StorageService = appStorage,
  maxSessions = MAX_STORED_SESSIONS,
): WriteResult {
  const others = loadSessions(storage).filter(({ id }) => id !== session.id);
  const sessions = [...others, session]
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .slice(-maxSessions);
  return storage.write(STORAGE_KEYS.sessions, sessions);
}

/** Attempts in the order they were answered, from either stored form. */
export function loadAttempts(storage: StorageService = appStorage): PracticeAttempt[] {
  return storage.read(STORAGE_KEYS.attempts, parseStoredAttempts, []).value;
}

/**
 * Saves a full list of attempts in the compact stored form, keeping only the
 * most recent `maxAttempts`.
 */
export function saveAttempts(
  attempts: readonly PracticeAttempt[],
  storage: StorageService = appStorage,
  maxAttempts = MAX_STORED_ATTEMPTS,
): WriteResult {
  return storage.write(STORAGE_KEYS.attempts, attempts.slice(-maxAttempts).map(encodeAttempt));
}

/** Adds an attempt; does nothing if an attempt with the same id is already saved. */
export function saveAttempt(
  attempt: PracticeAttempt,
  storage: StorageService = appStorage,
  maxAttempts = MAX_STORED_ATTEMPTS,
): WriteResult {
  const attempts = loadAttempts(storage);
  if (attempts.some(({ id }) => id === attempt.id)) {
    return { ok: true };
  }
  return saveAttempts([...attempts, attempt], storage, maxAttempts);
}
