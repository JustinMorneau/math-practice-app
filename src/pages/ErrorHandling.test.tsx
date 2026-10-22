/**
 * Friendly handling of unexpected errors and damaged saved data
 * (specification section 17).
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import { loadAttempts } from '../services/historyStorage';
import { loadMistakePatterns } from '../services/mistakeStorage';
import { loadSettings } from '../services/settingsStorage';
import { STORAGE_KEYS, createStorageService } from '../services/storageService';
import { renderAppAt } from '../test/renderWithRouter';
import { CURRENT_VERSION_RECORD, MemoryStorage } from '../test/storage';
import ErrorPage from './ErrorPage';

function Broken(): never {
  throw new Error('Cannot read properties of undefined (reading "secret")');
}

function renderBrokenPage(standalone: boolean) {
  const router = createMemoryRouter([
    { path: '/', element: <Broken />, errorElement: <ErrorPage standalone={standalone} /> },
  ]);
  return render(<RouterProvider router={router} />);
}

describe('ErrorPage', () => {
  it('shows a friendly message and a safe way home instead of crashing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderBrokenPage(false);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/your saved progress is safe/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Home' })).toHaveAttribute('href', '/');
  });

  it('never shows technical details', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = renderBrokenPage(false);

    expect(container).not.toHaveTextContent(/undefined|secret|Error/);
  });

  it('logs the error for developers', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderBrokenPage(false);

    expect(consoleError).toHaveBeenCalled();
  });

  it('provides its own main area when the whole layout failed', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderBrokenPage(true);

    expect(screen.getByRole('main')).toHaveTextContent(/something went wrong/i);
  });
});

describe('damaged saved data', () => {
  /** Every category of saved data, each damaged in a different way. */
  function damagedStorage() {
    return new MemoryStorage({
      [STORAGE_KEYS.version]: '"one"',
      [STORAGE_KEYS.settings]: JSON.stringify({ ...DEFAULT_SETTINGS, defaultDifficulty: 99 }),
      [STORAGE_KEYS.sessions]: '[{"id":"s-1"},"garbage"]',
      [STORAGE_KEYS.attempts]: '{not json',
      [STORAGE_KEYS.statistics]: '{"attempted":-4}',
      [STORAGE_KEYS.mistakePatterns]: '[{"id":"m-1","operation":"division","secondOperand":0}]',
      [STORAGE_KEYS.activeSession]: 'null',
    });
  }

  it.each([
    ['/', /welcome/i],
    ['/practice/setup', 'Practice Setup'],
    ['/statistics', 'Statistics'],
    ['/settings', 'Settings'],
  ])('still shows %s without crashing', (path, heading) => {
    renderAppAt(path, { storage: createStorageService(damagedStorage()) });

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('replaces only the damaged parts', () => {
    const browserStorage = damagedStorage();
    const storage = createStorageService(browserStorage);
    renderAppAt('/', { storage });

    // The one bad setting falls back to its default; the rest are kept.
    expect(loadSettings(storage).settings).toEqual(DEFAULT_SETTINGS);
    expect(loadMistakePatterns(storage).patterns).toEqual([]);
    expect(loadAttempts(storage)).toEqual([]);
    expect(browserStorage.getItem(STORAGE_KEYS.version)).toBe(CURRENT_VERSION_RECORD);
  });

  it('lets the student practice and save progress again', async () => {
    const user = userEvent.setup();
    const storage = createStorageService(damagedStorage());
    renderAppAt('/practice/setup', { storage });

    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    const choices = screen.getByRole('group', { name: 'Answer choices' });
    await user.click(within(choices).getAllByRole('button')[0]);
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));

    expect(loadAttempts(storage)).toHaveLength(1);
    expect(loadMistakePatterns(storage).patterns).toHaveLength(1);
  });
});
