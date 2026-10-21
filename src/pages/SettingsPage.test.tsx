import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import { loadSettings, saveSettings } from '../services/settingsStorage';
import { createStorageService } from '../services/storageService';
import { renderAppAt } from '../test/renderWithRouter';
import { MemoryStorage } from '../test/storage';

function setup() {
  const storage = createStorageService(new MemoryStorage());
  return { storage, user: userEvent.setup() };
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
    await user.click(screen.getByRole('switch', { name: 'Sound effects' }));
    await user.click(
      getGroup('Questions to master a mistake').getByRole('radio', { name: '5 questions' }),
    );

    expect(loadSettings(storage).settings).toEqual({
      soundEffectsEnabled: true,
      cardAnimationsEnabled: false,
      showExplanations: false,
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
