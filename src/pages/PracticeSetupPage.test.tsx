import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import { loadSettings, saveSettings } from '../services/settingsStorage';
import { createStorageService } from '../services/storageService';
import { renderAppAt } from '../test/renderWithRouter';
import { MemoryStorage } from '../test/storage';

/**
 * The setup page's own status message. Scoped to <main> because the shared
 * layout also has a status region for storage warnings.
 */
function getSetupMessage() {
  return within(screen.getByRole('main')).getByRole('status');
}

function getStartButton() {
  return screen.getByRole('button', { name: 'Start Session' });
}

describe('PracticeSetupPage', () => {
  it('shows the operation, difficulty, and session-length choices', () => {
    renderAppAt('/practice/setup');

    expect(screen.getByRole('group', { name: 'Choose your problems' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Choose your level' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'How many questions?' })).toBeInTheDocument();
  });

  it('shows no notice when opened normally', () => {
    renderAppAt('/practice/setup');

    expect(screen.queryByText("Let's set up your practice first.")).not.toBeInTheDocument();
  });

  it('starts from previous choices passed in router state', () => {
    const state = { config: { operations: ['division'], difficulty: 4, sessionLength: 5 } };
    renderAppAt('/practice/setup', { state });

    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Addition' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Advanced' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '5 questions' })).toBeChecked();
  });

  it('starts from the default settings', () => {
    const storage = createStorageService(new MemoryStorage());
    saveSettings(
      {
        ...DEFAULT_SETTINGS,
        defaultOperations: ['subtraction', 'division'],
        defaultDifficulty: 3,
        defaultSessionLength: 20,
      },
      storage,
    );
    renderAppAt('/practice/setup', { storage });

    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Addition' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Intermediate' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '20 questions' })).toBeChecked();
  });

  it('lets one session differ from the defaults without changing them', async () => {
    const user = userEvent.setup();
    const storage = createStorageService(new MemoryStorage());
    renderAppAt('/practice/setup', { storage });

    await user.click(screen.getByRole('radio', { name: 'Advanced' }));
    await user.click(getStartButton());

    expect(screen.getByText('Addition, Advanced level')).toBeInTheDocument();
    expect(loadSettings(storage).settings.defaultDifficulty).toBe(1);
  });

  it('starts with sensible defaults so a session can begin right away', () => {
    renderAppAt('/practice/setup');

    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Beginner' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '10 questions' })).toBeChecked();
    expect(getStartButton()).toBeEnabled();
  });

  it('disables Start Session and explains why when no operation is selected', async () => {
    const user = userEvent.setup();
    renderAppAt('/practice/setup');

    await user.click(screen.getByRole('checkbox', { name: 'Addition' }));

    expect(getStartButton()).toBeDisabled();
    expect(getSetupMessage()).toHaveTextContent('Pick at least one kind of problem to start.');
    expect(getStartButton()).toHaveAccessibleDescription(/pick at least one kind of problem/i);
  });

  it('re-enables Start Session once an operation is selected again', async () => {
    const user = userEvent.setup();
    renderAppAt('/practice/setup');

    await user.click(screen.getByRole('checkbox', { name: 'Addition' }));
    await user.click(screen.getByRole('checkbox', { name: 'Division' }));

    expect(getStartButton()).toBeEnabled();
    expect(getSetupMessage()).toBeEmptyDOMElement();
  });

  it('passes the chosen setup to the practice session', async () => {
    const user = userEvent.setup();
    renderAppAt('/practice/setup');

    await user.click(screen.getByRole('checkbox', { name: 'Multiplication' }));
    await user.click(screen.getByRole('radio', { name: 'Intermediate' }));
    await user.click(screen.getByRole('radio', { name: '20 questions' }));
    await user.click(getStartButton());

    expect(screen.getByRole('heading', { level: 1, name: 'Practice' })).toBeInTheDocument();
    expect(screen.getByText('Addition and Multiplication, Intermediate level')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 20')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '20');
  });

  it('passes mixed operations and continuous practice', async () => {
    const user = userEvent.setup();
    renderAppAt('/practice/setup');

    await user.click(screen.getByRole('button', { name: 'Select all' }));
    await user.click(screen.getByRole('radio', { name: 'Keep going' }));
    await user.click(getStartButton());

    expect(
      screen.getByText('Addition, Subtraction, Multiplication, and Division, Beginner level'),
    ).toBeInTheDocument();
    expect(screen.getByText('Question 1')).toBeInTheDocument();
  });
});
