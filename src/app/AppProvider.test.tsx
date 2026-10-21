import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import { loadAttempts, loadSessions } from '../services/historyStorage';
import { loadMistakePatterns } from '../services/mistakeStorage';
import { loadSettings } from '../services/settingsStorage';
import { STORAGE_KEYS, createStorageService } from '../services/storageService';
import { renderAppAt } from '../test/renderWithRouter';
import { MemoryStorage } from '../test/storage';
import type { PracticeConfig } from '../types';
import { useAppData } from './AppDataContext';
import AppProvider from './AppProvider';

const config: PracticeConfig = { operations: ['addition'], difficulty: 1, sessionLength: 2 };

async function answerCard(user: ReturnType<typeof userEvent.setup>, gotItRight: boolean) {
  const choices = screen.getByRole('group', { name: 'Answer choices' });
  await user.click(within(choices).getAllByRole('button')[0]);
  await user.click(screen.getByRole('button', { name: 'Flip Card' }));
  await user.click(
    screen.getByRole('button', { name: gotItRight ? 'I Got It Right' : 'I Got It Wrong' }),
  );
}

/** The live region where saving problems are announced. */
function getWarningRegion() {
  return screen.getByRole('status', { name: 'Saving progress' });
}

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

  it('removes invalid mistake records when the app starts', () => {
    const valid = {
      id: 'm-1',
      operation: 'addition',
      firstOperand: 4,
      secondOperand: 5,
      correctAnswer: 9,
      difficulty: 1,
      incorrectCount: 1,
      similarCorrectCount: 0,
      lastIncorrectAt: '2026-10-22T10:00:00.000Z',
      mastered: false,
    };
    const corrupted = { ...valid, id: 'm-2', correctAnswer: 10 };
    const browserStorage = new MemoryStorage({
      [STORAGE_KEYS.mistakePatterns]: JSON.stringify([valid, corrupted]),
    });

    renderAppAt('/', { storage: createStorageService(browserStorage) });

    const stored = browserStorage.getItem(STORAGE_KEYS.mistakePatterns) ?? '';
    expect(JSON.parse(stored)).toEqual([valid]);
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

    expect(getWarningRegion()).toBeEmptyDOMElement();
  });

  it('warns, without crashing, when the browser blocks storage', () => {
    renderAppAt('/', { storage: createStorageService(null) });

    expect(getWarningRegion()).toHaveTextContent(/isn't letting the app save/);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('lets the student dismiss the warning', async () => {
    const user = userEvent.setup();
    renderAppAt('/', { storage: createStorageService(null) });

    await user.click(screen.getByRole('button', { name: 'Got It' }));

    expect(getWarningRegion()).toBeEmptyDOMElement();
  });
});

describe('saving practice', () => {
  it('saves the session and every attempt as the student practices', async () => {
    const storage = createStorageService(new MemoryStorage());
    const user = userEvent.setup();
    renderAppAt('/practice/session', { state: config, storage });

    await answerCard(user, true);
    expect(loadAttempts(storage)).toHaveLength(1);
    expect(loadSessions(storage)[0]).toMatchObject({ attempted: 1, correct: 1 });

    await answerCard(user, false);
    const attempts = loadAttempts(storage);
    const [session] = loadSessions(storage);
    expect(attempts.map(({ selfReportedCorrect }) => selfReportedCorrect)).toEqual([true, false]);
    expect(attempts.every(({ sessionId }) => sessionId === session.id)).toBe(true);
    expect(session).toMatchObject({ attempted: 2, correct: 1, incorrect: 1 });
    expect(session.completedAt).toEqual(expect.any(String));
  });

  it('saves a mistake pattern when an answer is marked incorrect', async () => {
    const storage = createStorageService(new MemoryStorage());
    const user = userEvent.setup();
    renderAppAt('/practice/session', { state: config, storage });

    await answerCard(user, false);

    const [attempt] = loadAttempts(storage);
    const { patterns } = loadMistakePatterns(storage);
    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toMatchObject({
      operation: attempt.operation,
      firstOperand: attempt.firstOperand,
      secondOperand: attempt.secondOperand,
      correctAnswer: attempt.correctAnswer,
      incorrectCount: 1,
    });
  });

  it('does not save a session that was opened but never answered', () => {
    const storage = createStorageService(new MemoryStorage());

    renderAppAt('/practice/session', { state: config, storage });

    expect(loadSessions(storage)).toEqual([]);
  });

  it('keeps practicing and warns when storage is full', async () => {
    const browserStorage = new MemoryStorage();
    const storage = createStorageService(browserStorage);
    const user = userEvent.setup();
    renderAppAt('/practice/session', { state: { ...config, sessionLength: 5 }, storage });

    browserStorage.failureMode = 'quota-exceeded';
    await answerCard(user, true);

    expect(getWarningRegion()).toHaveTextContent(/storage is full/);
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
  });
});
