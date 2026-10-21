import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import { MemoryStorage } from '../test/storage';
import type { AppSettings } from '../types';
import { loadSettings, parseSettings, saveSettings } from './settingsStorage';
import { STORAGE_KEYS, createStorageService } from './storageService';

const customSettings: AppSettings = {
  soundEffectsEnabled: true,
  cardAnimationsEnabled: false,
  showExplanations: false,
  defaultSessionLength: 'continuous',
  defaultDifficulty: 3,
  defaultOperations: ['multiplication', 'division'],
  masteryThreshold: 5,
};

describe('loadSettings', () => {
  it('uses the defaults when nothing has been saved', () => {
    const storage = createStorageService(new MemoryStorage());

    expect(loadSettings(storage)).toEqual({ settings: DEFAULT_SETTINGS, status: 'missing' });
  });

  it('loads saved settings', () => {
    const storage = createStorageService(new MemoryStorage());
    saveSettings(customSettings, storage);

    expect(loadSettings(storage)).toEqual({ settings: customSettings, status: 'ok' });
  });

  it('uses the defaults when the saved settings are unreadable', () => {
    const storage = createStorageService(
      new MemoryStorage({ [STORAGE_KEYS.settings]: 'not json at all' }),
    );

    expect(loadSettings(storage)).toEqual({ settings: DEFAULT_SETTINGS, status: 'invalid' });
  });

  it('uses the defaults when storage is unavailable', () => {
    expect(loadSettings(createStorageService(null)).settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe('parseSettings', () => {
  it('keeps valid values and replaces only the invalid ones', () => {
    const stored = {
      ...customSettings,
      defaultDifficulty: 7,
      defaultOperations: ['addition', 'modulo'],
      masteryThreshold: 0,
    };

    expect(parseSettings(stored)).toEqual({
      ...customSettings,
      defaultDifficulty: DEFAULT_SETTINGS.defaultDifficulty,
      defaultOperations: DEFAULT_SETTINGS.defaultOperations,
      masteryThreshold: DEFAULT_SETTINGS.masteryThreshold,
    });
  });

  it('fills in settings missing from older saved data', () => {
    expect(parseSettings({ showExplanations: false })).toEqual({
      ...DEFAULT_SETTINGS,
      showExplanations: false,
    });
  });

  it('ignores unknown fields', () => {
    expect(parseSettings({ ...customSettings, favoriteColor: 'green' })).toEqual(customSettings);
  });

  it.each([null, 'settings', 42, [1, 2]])('rejects %s', (value) => {
    expect(parseSettings(value)).toBeNull();
  });
});

describe('saveSettings', () => {
  it('reports when storage is full', () => {
    const storage = createStorageService(new MemoryStorage({}, 'quota-exceeded'));

    expect(saveSettings(customSettings, storage)).toEqual({ ok: false, reason: 'quota-exceeded' });
  });
});
