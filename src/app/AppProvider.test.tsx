import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import { loadSettings } from '../services/settingsStorage';
import { STORAGE_KEYS, createStorageService } from '../services/storageService';
import { renderAppAt } from '../test/renderWithRouter';
import { MemoryStorage } from '../test/storage';
import { useAppData } from './AppDataContext';
import AppProvider from './AppProvider';

/** Shows one setting and changes it, to test the provider without a settings page. */
function SettingsProbe() {
  const { settings, updateSettings } = useAppData();
  return (
    <>
      <p>Mastery threshold: {settings.masteryThreshold}</p>
      <button
        type="button"
        onClick={() => updateSettings({ masteryThreshold: settings.masteryThreshold + 1 })}
      >
        Raise threshold
      </button>
    </>
  );
}

describe('AppProvider', () => {
  it('records the data-schema version when the app starts', () => {
    const storage = new MemoryStorage();

    renderAppAt('/', { storage: createStorageService(storage) });

    expect(storage.getItem(STORAGE_KEYS.version)).toBe('{"version":1}');
  });

  it('loads saved settings when the app starts', () => {
    const storage = createStorageService(
      new MemoryStorage({
        [STORAGE_KEYS.settings]: JSON.stringify({ ...DEFAULT_SETTINGS, masteryThreshold: 5 }),
      }),
    );

    render(
      <AppProvider storage={storage}>
        <SettingsProbe />
      </AppProvider>,
    );

    expect(screen.getByText('Mastery threshold: 5')).toBeInTheDocument();
  });

  it('uses the default settings when none are saved', () => {
    render(
      <AppProvider storage={createStorageService(new MemoryStorage())}>
        <SettingsProbe />
      </AppProvider>,
    );

    expect(screen.getByText('Mastery threshold: 3')).toBeInTheDocument();
  });

  it('saves changed settings', async () => {
    const user = userEvent.setup();
    const storage = createStorageService(new MemoryStorage());
    render(
      <AppProvider storage={storage}>
        <SettingsProbe />
      </AppProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Raise threshold' }));

    expect(screen.getByText('Mastery threshold: 4')).toBeInTheDocument();
    expect(loadSettings(storage).settings.masteryThreshold).toBe(4);
  });

  it('shows no warning when storage works', () => {
    renderAppAt('/', { storage: createStorageService(new MemoryStorage()) });

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('warns, without crashing, when the browser blocks storage', () => {
    renderAppAt('/', { storage: createStorageService(null) });

    expect(screen.getByRole('status')).toHaveTextContent(/isn't letting the app save/);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('lets the student dismiss the warning', async () => {
    const user = userEvent.setup();
    renderAppAt('/', { storage: createStorageService(null) });

    await user.click(screen.getByRole('button', { name: 'Got It' }));

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
