/**
 * Saves and loads aggregate statistics (specification sections 11, 17, and
 * 20.3). Totals are stored separately from attempts, so trimming old
 * attempt records never shrinks the student's all-time totals.
 */
import type { AppStatistics, PracticeAttempt } from '../types';
import { loadAttempts, saveAttempt } from './historyStorage';
import {
  addAttemptToStatistics,
  calculateStatistics,
  createEmptyStatistics,
  parseStatistics,
} from './statisticsService';
import { STORAGE_KEYS, appStorage, type StorageService, type WriteResult } from './storageService';

/**
 * The stored statistics. When they are missing or corrupted, they are
 * rebuilt from the stored attempts and saved again, so only the affected
 * section is replaced (specification section 17).
 */
export function loadStatistics(storage: StorageService = appStorage): AppStatistics {
  const { status, value } = storage.read(STORAGE_KEYS.statistics, parseStatistics, null);
  if (status === 'ok' && value !== null) {
    return value;
  }
  if (status === 'unavailable') {
    return createEmptyStatistics();
  }

  const rebuilt = calculateStatistics(loadAttempts(storage));
  // Save the rebuilt totals, unless there is simply nothing recorded yet.
  if (status === 'invalid' || rebuilt.attempted > 0) {
    storage.write(STORAGE_KEYS.statistics, rebuilt);
  }
  return rebuilt;
}

/**
 * Saves an attempt and adds it to the statistics. Recording the same
 * attempt again does nothing, so totals are never counted twice.
 */
export function recordAttempt(
  attempt: PracticeAttempt,
  storage: StorageService = appStorage,
): WriteResult {
  if (loadAttempts(storage).some(({ id }) => id === attempt.id)) {
    return { ok: true };
  }

  // Load first: if statistics must be rebuilt from attempts, this attempt
  // must not be in the list yet, or it would be counted twice.
  const statistics = loadStatistics(storage);
  const saved = saveAttempt(attempt, storage);
  if (!saved.ok) {
    return saved;
  }
  return storage.write(STORAGE_KEYS.statistics, addAttemptToStatistics(statistics, attempt));
}

/**
 * Erases practice history: attempts, sessions, statistics, and mistake
 * patterns. Settings are kept, since they are preferences rather than
 * history; clearing everything is a separate action on the settings page.
 */
export function clearPracticeHistory(storage: StorageService = appStorage): WriteResult {
  const results = [
    storage.remove(STORAGE_KEYS.attempts),
    storage.remove(STORAGE_KEYS.sessions),
    storage.remove(STORAGE_KEYS.statistics),
    storage.remove(STORAGE_KEYS.mistakePatterns),
  ];
  return results.find((result) => !result.ok) ?? { ok: true };
}
