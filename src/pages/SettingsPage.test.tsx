import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import { loadAttempts } from '../services/historyStorage';
import { loadSettings, saveSettings } from '../services/settingsStorage';
import { recordAttempt } from '../services/attemptRecorder';
import { STORAGE_KEYS, createStorageService } from '../services/storageService';
import { renderAppAt } from '../test/renderWithRouter';
import { MemoryStorage } from '../test/storage';

function setup() {
  const browserStorage = new MemoryStorage();
  const storage = createStorageService(browserStorage);
  return { browserStorage, storage, user: userEvent.setup() };
}

function getGroup(name: string) {
  return within(screen.getByRole('group', { name }));
}

describe('SettingsPage', () => {
  it('shows the current settings', () => {
    const { storage } = setup();
    saveSettings({ ...DEFAULT_SETTINGS, defaultDifficulty: 3, showExplanations: false }, storage);
    renderAppAt('/settings', { storage });

    expect(getGroup('Default problems').getByRole('checkbox', { name: 'Addition' })).toBeChecked();
    expect(getGroup('Default level').getByRole('radio', { name: 'Intermediate' })).toBeChecked();
    expect(
      getGroup('Default number of questions').getByRole('radio', { name: '10 questions' }),
    ).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Card animation' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Show explanations' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Encouraging messages' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Sound effects' })).not.toBeChecked();
    expect(
      getGroup('Questions to master a mistake').getByRole('radio', { name: '3 questions' }),
    ).toBeChecked();
  });

  it('saves each change automatically', async () => {
    const { storage, user } = setup();
    renderAppAt('/settings', { storage });

    await user.click(getGroup('Default problems').getByRole('checkbox', { name: 'Division' }));
    await user.click(getGroup('Default level').getByRole('radio', { name: 'Advanced' }));
    await user.click(
      getGroup('Default number of questions').getByRole('radio', { name: 'Keep going' }),
    );
    await user.click(screen.getByRole('switch', { name: 'Card animation' }));
    await user.click(screen.getByRole('switch', { name: 'Show explanations' }));
    await user.click(screen.getByRole('switch', { name: 'Encouraging messages' }));
    await user.click(screen.getByRole('switch', { name: 'Sound effects' }));
    await user.click(
      getGroup('Questions to master a mistake').getByRole('radio', { name: '5 questions' }),
    );

    expect(loadSettings(storage).settings).toEqual({
      soundEffectsEnabled: true,
      cardAnimationsEnabled: false,
      showExplanations: false,
      feedbackMessagesEnabled: false,
      defaultSessionLength: 'continuous',
      defaultDifficulty: 4,
      defaultOperations: ['addition', 'division'],
      masteryThreshold: 5,
    });
    expect(screen.getByRole('status', { name: 'Settings updates' })).toHaveTextContent(
      'Your settings were saved.',
    );
  });

  it('never saves an empty list of default problems', async () => {
    const { storage, user } = setup();
    renderAppAt('/settings', { storage });

    await user.click(getGroup('Default problems').getByRole('checkbox', { name: 'Addition' }));

    expect(screen.getByRole('status', { name: 'Settings updates' })).toHaveTextContent(
      /pick at least one kind of problem/i,
    );
    expect(loadSettings(storage).settings.defaultOperations).toEqual(['addition']);
  });
});

describe('Clearing all application data', () => {
  it('shows a strong warning before erasing anything', async () => {
    const { storage, user } = setup();
    renderAppAt('/settings', { storage });

    await user.click(screen.getByRole('button', { name: 'Clear All Application Data' }));

    const dialog = within(screen.getByRole('dialog', { name: 'Clear all application data?' }));
    expect(dialog.getByText(/permanently erases/)).toBeInTheDocument();
    expect(dialog.getByText("This can't be undone.")).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Keep My Data' })).toHaveFocus();
  });

  it('keeps everything when cancelled', async () => {
    const { storage, user } = setup();
    saveSettings({ ...DEFAULT_SETTINGS, masteryThreshold: 5 }, storage);
    renderAppAt('/settings', { storage });

    await user.click(screen.getByRole('button', { name: 'Clear All Application Data' }));
    await user.click(screen.getByRole('button', { name: 'Keep My Data' }));

    expect(loadSettings(storage).settings.masteryThreshold).toBe(5);
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
  });

  it('erases everything, restores defaults, and returns home', async () => {
    const { browserStorage, storage, user } = setup();
    saveSettings({ ...DEFAULT_SETTINGS, masteryThreshold: 5, defaultDifficulty: 4 }, storage);
    recordAttempt(
      {
        id: 'a-1',
        questionId: 'q-1',
        operation: 'addition',
        firstOperand: 2,
        secondOperand: 3,
        correctAnswer: 5,
        selectedAnswer: 5,
        selfReportedCorrect: true,
        difficulty: 1,
        source: 'regular',
        attemptedAt: '2026-10-22T10:00:00.000Z',
        sessionId: 's-1',
      },
      storage,
    );
    browserStorage.setItem(STORAGE_KEYS.mistakePatterns, '[]');
    browserStorage.setItem('otherApp.data', 'keep me');
    renderAppAt('/settings', { storage });

    await user.click(screen.getByRole('button', { name: 'Clear All Application Data' }));
    await user.click(screen.getByRole('button', { name: 'Erase All Data' }));

    expect(screen.getByRole('heading', { level: 1, name: /welcome/i })).toBeInTheDocument();
    expect(screen.getByText(/all app data was cleared/i)).toBeInTheDocument();
    expect(loadAttempts(storage)).toEqual([]);
    for (const key of [
      STORAGE_KEYS.settings,
      STORAGE_KEYS.sessions,
      STORAGE_KEYS.attempts,
      STORAGE_KEYS.statistics,
      STORAGE_KEYS.mistakePatterns,
    ]) {
      expect(browserStorage.getItem(key)).toBeNull();
    }
    expect(browserStorage.getItem(STORAGE_KEYS.version)).toBe('{"version":1}');
    expect(browserStorage.getItem('otherApp.data')).toBe('keep me');

    // The app is back on its defaults, e.g. on the setup page.
    await user.click(screen.getByRole('link', { name: 'Start Practice' }));
    expect(screen.getByRole('radio', { name: 'Beginner' })).toBeChecked();
  });
});
