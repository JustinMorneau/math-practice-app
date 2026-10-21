/**
 * End-to-end flows for mistake review: choosing review on the setup page,
 * practicing review questions, mastering mistakes, and the summary's
 * Practice Mistakes button (specification section 21.3).
 */
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import { loadAttempts } from '../services/historyStorage';
import { loadMistakePatterns, saveMistakePatterns } from '../services/mistakeStorage';
import { saveSettings } from '../services/settingsStorage';
import { createStorageService, type StorageService } from '../services/storageService';
import { renderAppAt } from '../test/renderWithRouter';
import { MemoryStorage } from '../test/storage';
import type { MistakePattern, PracticeConfig, PracticeSession } from '../types';

type User = ReturnType<typeof userEvent.setup>;

function mistake(id: string, overrides: Partial<MistakePattern> = {}): MistakePattern {
  return {
    id,
    operation: 'multiplication',
    firstOperand: 8,
    secondOperand: 7,
    correctAnswer: 56,
    difficulty: 2,
    incorrectCount: 1,
    similarCorrectCount: 0,
    lastIncorrectAt: '2026-10-22T10:00:00.000Z',
    mastered: false,
    ...overrides,
  };
}

function storageWith(patterns: MistakePattern[], masteryThreshold = 3): StorageService {
  const storage = createStorageService(new MemoryStorage());
  saveMistakePatterns(patterns, storage);
  saveSettings({ ...DEFAULT_SETTINGS, masteryThreshold }, storage);
  return storage;
}

async function answerCard(user: User, gotItRight: boolean) {
  const choices = screen.getByRole('group', { name: 'Answer choices' });
  await user.click(within(choices).getAllByRole('button')[0]);
  await user.click(screen.getByRole('button', { name: 'Flip Card' }));
  await user.click(
    screen.getByRole('button', { name: gotItRight ? 'I Got It Right' : 'I Got It Wrong' }),
  );
}

describe('choosing mistake review on the setup page', () => {
  it('offers regular practice and mistake review, defaulting to regular', () => {
    renderAppAt('/practice/setup', { storage: storageWith([mistake('m-1')]) });

    const modes = within(screen.getByRole('group', { name: 'What do you want to practice?' }));
    expect(modes.getByRole('radio', { name: 'Regular practice' })).toBeChecked();
    expect(modes.getByRole('radio', { name: 'Review my mistakes' })).not.toBeChecked();
  });

  it('shows how many mistakes are waiting', () => {
    const mastered = mistake('m-3', { mastered: true });
    const storage = storageWith([mistake('m-1'), mistake('m-2'), mastered]);
    renderAppAt('/practice/setup', { storage });

    expect(screen.getByRole('radio', { name: 'Review my mistakes' })).toHaveAccessibleDescription(
      '2 mistakes to review',
    );
  });

  it('disables review and explains why when there are no active mistakes', () => {
    renderAppAt('/practice/setup', { storage: storageWith([mistake('m-1', { mastered: true })]) });

    const review = screen.getByRole('radio', { name: 'Review my mistakes' });
    expect(review).toBeDisabled();
    expect(review).toHaveAccessibleDescription(/no mistakes to review yet/i);
  });

  it('hides the problem and level choices in review mode', async () => {
    const user = userEvent.setup();
    renderAppAt('/practice/setup', { storage: storageWith([mistake('m-1')]) });

    await user.click(screen.getByRole('radio', { name: 'Review my mistakes' }));

    expect(screen.queryByRole('group', { name: 'Choose your problems' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Choose your level' })).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'How many questions?' })).toBeInTheDocument();
    expect(screen.getByText(/questions similar to the problems you missed/)).toBeInTheDocument();
  });

  it('starts a review session of questions linked to the mistakes', async () => {
    const user = userEvent.setup();
    const storage = storageWith([mistake('m-1')]);
    renderAppAt('/practice/setup', { storage });

    await user.click(screen.getByRole('radio', { name: 'Review my mistakes' }));
    await user.click(screen.getByRole('radio', { name: '5 questions' }));
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    expect(screen.getByText('Mistake review: Multiplication')).toBeInTheDocument();

    await answerCard(user, true);

    const [attempt] = loadAttempts(storage);
    expect(attempt).toMatchObject({ source: 'mistake-review', mistakePatternId: 'm-1' });
  });
});

describe('review sessions', () => {
  const reviewConfig: PracticeConfig = {
    operations: ['multiplication'],
    difficulty: 2,
    sessionLength: 10,
    mode: 'mistake-review',
  };

  it('moves a mistake toward mastery with each correct review answer', async () => {
    const user = userEvent.setup();
    const storage = storageWith([mistake('m-1')]);
    renderAppAt('/practice/session', { state: reviewConfig, storage });

    await answerCard(user, true);
    await answerCard(user, true);

    expect(loadMistakePatterns(storage).patterns[0]).toMatchObject({
      similarCorrectCount: 2,
      mastered: false,
    });
  });

  it('mixes questions from several mistakes', async () => {
    const user = userEvent.setup();
    const addition = mistake('m-2', {
      operation: 'addition',
      firstOperand: 9,
      secondOperand: 6,
      correctAnswer: 15,
    });
    const storage = storageWith([mistake('m-1'), addition]);
    renderAppAt('/practice/session', { state: reviewConfig, storage });

    for (let i = 0; i < 4; i += 1) {
      await answerCard(user, true);
    }

    const patternIds = loadAttempts(storage).map(({ mistakePatternId }) => mistakePatternId);
    expect(new Set(patternIds)).toEqual(new Set(['m-1', 'm-2']));
  });

  it('ends once every mistake is mastered and celebrates it', async () => {
    const user = userEvent.setup();
    const storage = storageWith([mistake('m-1')], 2);
    renderAppAt('/practice/session', { state: reviewConfig, storage });

    await answerCard(user, true);
    await answerCard(user, true);

    expect(screen.getByRole('heading', { level: 1, name: 'Session Summary' })).toBeInTheDocument();
    expect(screen.getByText(/mastered every mistake/i)).toBeInTheDocument();
    expect(screen.getByText('Mistake-review questions completed: 2')).toBeInTheDocument();
    expect(screen.queryByText(/you ended after/i)).not.toBeInTheDocument();
    expect(loadMistakePatterns(storage).patterns[0].mastered).toBe(true);
  });

  it('explains when there is nothing left to review', () => {
    renderAppAt('/practice/session', {
      state: reviewConfig,
      storage: storageWith([mistake('m-1', { mastered: true })]),
    });

    expect(screen.getByText(/no mistakes to review right now/i)).toBeInTheDocument();
  });
});

describe('Practice Mistakes on the session summary', () => {
  const finishedSession: PracticeSession = {
    id: 's-1',
    startedAt: '2026-10-22T10:00:00.000Z',
    completedAt: '2026-10-22T10:05:00.000Z',
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 5,
    mode: 'regular',
    attempted: 5,
    correct: 3,
    incorrect: 2,
  };
  const summaryState = { session: finishedSession, reviewQuestionCount: 0 };

  it('starts a review session when there are mistakes to review', async () => {
    const user = userEvent.setup();
    const storage = storageWith([mistake('m-1')]);
    renderAppAt('/practice/summary', { state: summaryState, storage });

    await user.click(screen.getByRole('button', { name: 'Practice Mistakes' }));

    expect(screen.getByText('Mistake review: Multiplication')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
  });

  it('is not offered when there are no mistakes to review', () => {
    renderAppAt('/practice/summary', { state: summaryState, storage: storageWith([]) });

    expect(screen.queryByRole('button', { name: 'Practice Mistakes' })).not.toBeInTheDocument();
  });
});
