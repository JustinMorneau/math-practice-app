import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderAppAt } from '../test/renderWithRouter';
import type { PracticeSession } from '../types';

const session: PracticeSession = {
  id: 's-1',
  startedAt: '2026-10-21T10:00:00.000Z',
  completedAt: '2026-10-21T10:06:00.000Z',
  operations: ['multiplication', 'division'],
  difficulty: 3,
  sessionLength: 10,
  attempted: 10,
  correct: 7,
  incorrect: 3,
};

function renderSummary(sessionOverrides: Partial<PracticeSession> = {}, reviewQuestionCount = 0) {
  return renderSummaryState({ session: { ...session, ...sessionOverrides }, reviewQuestionCount });
}

function renderSummaryState(state: unknown) {
  renderAppAt('/practice/summary', { state });
  return userEvent.setup();
}

/** The value shown under a stat label, e.g. "70%" for "Accuracy". */
function getStat(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent;
}

describe('SessionSummaryPage', () => {
  it('shows the totals and accuracy', () => {
    renderSummary();

    expect(screen.getByRole('heading', { level: 1, name: 'Session Summary' })).toBeInTheDocument();
    expect(getStat('Answered')).toBe('10');
    expect(getStat('Got right')).toBe('7');
    expect(getStat('To practice')).toBe('3');
    expect(getStat('Accuracy')).toBe('70%');
  });

  it('shows an encouraging message and the practiced setup', () => {
    renderSummary();

    expect(screen.getByText('Good effort!')).toBeInTheDocument();
    expect(screen.getByText('Multiplication and Division, Intermediate level')).toBeInTheDocument();
    expect(screen.getByText(/questions you missed/)).toBeInTheDocument();
  });

  it('celebrates a perfect session without a review tip', () => {
    renderSummary({ correct: 10, incorrect: 0 });

    expect(screen.getByText('Perfect score!')).toBeInTheDocument();
    expect(getStat('Accuracy')).toBe('100%');
    expect(screen.queryByText(/questions you missed/)).not.toBeInTheDocument();
  });

  it('shows how many mistake-review questions were completed', () => {
    renderSummary({}, 2);

    expect(screen.getByText('Mistake-review questions completed: 2')).toBeInTheDocument();
  });

  it('links to statistics and home', () => {
    renderSummary();

    expect(screen.getByRole('link', { name: 'View Statistics' })).toHaveAttribute(
      'href',
      '/statistics',
    );
    expect(screen.getByRole('link', { name: 'Return Home' })).toHaveAttribute('href', '/');
  });

  it('notes when a fixed-length session was ended early', () => {
    renderSummary({ attempted: 6, correct: 5, incorrect: 1 });

    expect(screen.getByText('You ended after 6 of 10 questions.')).toBeInTheDocument();
  });

  it('starts a new session with the same setup from Practice Again', async () => {
    const user = renderSummary();

    await user.click(screen.getByRole('button', { name: 'Practice Again' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Practice' })).toBeInTheDocument();
    expect(screen.getByText('Multiplication and Division, Intermediate level')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
  });

  it('opens setup with the same choices from Change Settings', async () => {
    const user = renderSummary();

    await user.click(screen.getByRole('link', { name: 'Change Settings' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Multiplication' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Addition' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Intermediate' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '10 questions' })).toBeChecked();
  });

  it('explains when there is no finished session to show', () => {
    renderAppAt('/practice/summary');

    expect(screen.getByText(/no finished session yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start Practice' })).toHaveAttribute(
      'href',
      '/practice/setup',
    );
  });

  it.each([
    ['totals that do not add up', { session: { ...session, correct: 99 }, reviewQuestionCount: 0 }],
    ['a missing review count', { session }],
    ['a negative review count', { session, reviewQuestionCount: -1 }],
    ['a bare session without the summary wrapper', session],
  ])('treats a state with %s like a missing session', (_description, state) => {
    renderSummaryState(state);

    expect(screen.getByText(/no finished session yet/i)).toBeInTheDocument();
  });
});
