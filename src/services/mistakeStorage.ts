/**
 * Saves and loads mistake patterns (specification sections 11 and 17).
 * Invalid records are dropped individually, so one corrupted pattern never
 * erases the rest.
 */
import type { MistakePattern } from '../types';
import { parseMistakePatterns } from './mistakePatterns';
import { STORAGE_KEYS, appStorage, type StorageService, type WriteResult } from './storageService';

export interface LoadedMistakePatterns {
  patterns: MistakePattern[];
  /** How many stored records were invalid and left out. */
  droppedCount: number;
}

export function loadMistakePatterns(storage: StorageService = appStorage): LoadedMistakePatterns {
  const { value } = storage.read(STORAGE_KEYS.mistakePatterns, parseMistakePatterns, null);
  return value ?? { patterns: [], droppedCount: 0 };
}

export function saveMistakePatterns(
  patterns: readonly MistakePattern[],
  storage: StorageService = appStorage,
): WriteResult {
  return storage.write(STORAGE_KEYS.mistakePatterns, patterns);
}

/**
 * Checks stored patterns when the app starts. Invalid records are removed
 * and the remaining valid patterns are saved again; unreadable data is
 * replaced with an empty list. Returns the valid patterns.
 */
export function repairMistakePatterns(storage: StorageService = appStorage): MistakePattern[] {
  const { status, value } = storage.read(STORAGE_KEYS.mistakePatterns, parseMistakePatterns, null);
  if (status === 'invalid') {
    saveMistakePatterns([], storage);
    return [];
  }
  if (value === null) {
    return [];
  }
  if (value.droppedCount > 0) {
    saveMistakePatterns(value.patterns, storage);
  }
  return value.patterns;
}
