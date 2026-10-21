/**
 * Saves and loads application settings (specification section 6.7).
 * Invalid stored values are replaced field by field, so one bad value
 * never erases the rest of the student's preferences.
 */
import { DEFAULT_SETTINGS, MASTERY_THRESHOLD_RANGE } from '../constants/defaultSettings';
import { SESSION_LENGTH_OPTIONS } from '../constants/practiceOptions';
import type { AppSettings } from '../types';
import { isDifficultyLevel, isOperationList } from '../utils/validation';
import {
  STORAGE_KEYS,
  appStorage,
  type ReadStatus,
  type StorageService,
  type WriteResult,
} from './storageService';

const SETTING_VALIDATORS: { [K in keyof AppSettings]: (value: unknown) => boolean } = {
  soundEffectsEnabled: (value) => typeof value === 'boolean',
  cardAnimationsEnabled: (value) => typeof value === 'boolean',
  showExplanations: (value) => typeof value === 'boolean',
  // Only lengths the setup page offers, so a default always matches a choice.
  defaultSessionLength: (value) => SESSION_LENGTH_OPTIONS.some((option) => option.value === value),
  defaultDifficulty: isDifficultyLevel,
  defaultOperations: isOperationList,
  masteryThreshold: (value) =>
    Number.isInteger(value) &&
    (value as number) >= MASTERY_THRESHOLD_RANGE.min &&
    (value as number) <= MASTERY_THRESHOLD_RANGE.max,
};

/**
 * Complete settings built from stored data: each valid stored value is kept
 * and anything missing or invalid uses its default. Returns null when the
 * stored data is not an object at all.
 */
export function parseSettings(value: unknown): AppSettings | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const stored = value as Record<string, unknown>;
  const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const [name, isValid] of Object.entries(SETTING_VALIDATORS)) {
    if (isValid(stored[name])) {
      settings[name] = stored[name];
    }
  }
  return settings as unknown as AppSettings;
}

export interface LoadedSettings {
  settings: AppSettings;
  status: ReadStatus;
}

/** The saved settings, or the defaults when none are saved or they cannot be read. */
export function loadSettings(storage: StorageService = appStorage): LoadedSettings {
  const { status, value } = storage.read(STORAGE_KEYS.settings, parseSettings, DEFAULT_SETTINGS);
  return { settings: value, status };
}

export function saveSettings(
  settings: AppSettings,
  storage: StorageService = appStorage,
): WriteResult {
  return storage.write(STORAGE_KEYS.settings, settings);
}
