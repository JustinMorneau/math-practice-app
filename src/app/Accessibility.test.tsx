/**
 * Automated accessibility checks (axe-core) for every page in its main
 * states, plus a complete session using only the keyboard.
 */
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { recordAttempt } from '../services/attemptRecorder';
import { saveSession } from '../services/historyStorage';
import { createStorageService, type StorageService } from '../services/storageService';
import { findAccessibilityViolations } from '../test/axe';
import { renderAppAt } from '../test/renderWithRouter';
import { MemoryStorage } from '../test/storage';
import type { PracticeConfig } from '../types';

const config: PracticeConfig = {
  operations: ['multiplication'],
  difficulty: 2,
  sessionLength: 5,
  mode: 'regular',
};

/** Storage with some history, so statistics and review have content. */
function storageWithHistory(): StorageService {
  const storage = createStorageService(new MemoryStorage());
  for (const [index, correct] of [true, false, true].entries()) {
    recordAttempt(
      {
        id: `a-${index}`,
        questionId: `q-${index}`,
        operation: 'multiplication',
        firstOperand: 8,
        secondOperand: 7,
        correctAnswer: 56,
        selectedAnswer: correct ? 56 : 54,
        selfReportedCorrect: correct,
        difficulty: 2,
        source: 'regular',
        attemptedAt: '2026-10-22T10:00:00.000Z',
        sessionId: 's-1',
      },
      storage,
    );
  }
  saveSession(
    {
      id: 's-1',
      startedAt: '2026-10-22T10:00:00.000Z',
      completedAt: '2026-10-22T10:03:00.000Z',
      operations: ['multiplication'],
      difficulty: 2,
      sessionLength: 5,
      mode: 'regular',
      attempted: 3,
      correct: 2,
      incorrect: 1,
    },
    storage,
  );
  return storage;
}

describe('automated accessibility checks', () => {
  it.each([
    ['home', '/'],
    ['practice setup', '/practice/setup'],
    ['statistics', '/statistics'],
    ['settings', '/settings'],
    ['page not found', '/no-such-page'],
  ])('finds no problems on the %s page', async (_name, path) => {
    const { container } = renderAppAt(path, { storage: storageWithHistory() });

    expect(await findAccessibilityViolations(container)).toEqual([]);
  });

  it('finds no problems on the statistics page with no history', async () => {
    const { container } = renderAppAt('/statistics', {
      storage: createStorageService(new MemoryStorage()),
    });

    expect(await findAccessibilityViolations(container)).toEqual([]);
  });

  it('finds no problems on a question card, front and back', async () => {
    const user = userEvent.setup();
    const { container } = renderAppAt('/practice/session', { state: config });
    expect(await findAccessibilityViolations(container)).toEqual([]);

    const choices = screen.getByRole('group', { name: 'Answer choices' });
    await user.click(within(choices).getAllByRole('button')[0]);
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));

    expect(await findAccessibilityViolations(container)).toEqual([]);
  });

  it('finds no problems on the session summary', async () => {
    const user = userEvent.setup();
    const { container } = renderAppAt('/practice/session', { state: config });
    for (let i = 0; i < 5; i += 1) {
      const choices = screen.getByRole('group', { name: 'Answer choices' });
      await user.click(within(choices).getAllByRole('button')[0]);
      await user.click(screen.getByRole('button', { name: 'Flip Card' }));
      await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));
    }

    expect(screen.getByRole('heading', { level: 1, name: 'Session Summary' })).toBeInTheDocument();
    expect(await findAccessibilityViolations(container)).toEqual([]);
  });

  it('finds no problems in an open confirmation dialog', async () => {
    const user = userEvent.setup();
    const { container } = renderAppAt('/statistics', { storage: storageWithHistory() });

    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(await findAccessibilityViolations(container)).toEqual([]);
  });
});

describe('keyboard-only practice', () => {
  it('completes a whole session without a mouse', async () => {
    const user = userEvent.setup();
    renderAppAt('/practice/session', { state: config });

    for (let question = 1; question <= 5; question += 1) {
      expect(screen.getByText(`Question ${question} of 5`)).toBeInTheDocument();
      // Choose the first answer with its number key, then Tab past the
      // other three answers to Flip Card.
      await user.keyboard('1');
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();
      expect(screen.getByRole('button', { name: 'Flip Card' })).toHaveFocus();
      await user.keyboard('{Enter}');
      // Focus is on the revealed answer; the next stop is I Got It Right.
      await user.tab();
      await user.keyboard('{Enter}');
    }

    expect(screen.getByRole('heading', { level: 1, name: 'Session Summary' })).toBeInTheDocument();
  });
});
