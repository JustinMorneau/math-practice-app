import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderAppAt } from '../test/renderWithRouter';
import type { PracticeConfig } from '../types';

type User = ReturnType<typeof userEvent.setup>;

function renderPracticeWithState(state: unknown) {
  renderAppAt('/practice/session', { state });
  return userEvent.setup();
}

const fiveQuestions: PracticeConfig = {
  operations: ['subtraction'],
  difficulty: 2,
  sessionLength: 5,
};

/** Answer the current card: pick the first choice, flip, and report a result. */
async function answerCard(user: User, gotItRight = true) {
  const choices = screen.getByRole('group', { name: 'Answer choices' });
  await user.click(within(choices).getAllByRole('button')[0]);
  await user.click(screen.getByRole('button', { name: 'Flip Card' }));
  await user.click(
    screen.getByRole('button', { name: gotItRight ? 'I Got It Right' : 'I Got It Wrong' }),
  );
}

/** The value shown under a summary stat label, e.g. "60%" for "Accuracy". */
function getStat(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent;
}

function getProgressBar() {
  return screen.getByRole('progressbar', { name: 'Session progress' });
}

describe('PracticePage: fixed-length sessions', () => {
  it('shows the chosen setup, the progress bar, and the first question', () => {
    renderPracticeWithState(fiveQuestions);

    expect(screen.getByRole('heading', { level: 1, name: 'Practice' })).toBeInTheDocument();
    expect(screen.getByText('Subtraction, Easy level')).toBeInTheDocument();
    expect(getProgressBar()).toHaveAttribute('aria-valuenow', '0');
    expect(getProgressBar()).toHaveAttribute('aria-valuetext', '0 of 5 questions answered');
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^\d+ − \d+ = \?$/);
  });

  it('updates progress and moves to the next question after each result', async () => {
    const user = renderPracticeWithState(fiveQuestions);

    await answerCard(user, false);

    expect(getProgressBar()).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled();
    expect(screen.getByRole('heading', { level: 2, name: /= \?$/ })).toHaveFocus();
  });

  it('shows the summary after the last question', async () => {
    const user = renderPracticeWithState(fiveQuestions);

    for (const gotItRight of [true, false, true, true, false]) {
      await answerCard(user, gotItRight);
    }

    expect(screen.getByRole('heading', { level: 1, name: 'Session Summary' })).toBeInTheDocument();
    expect(getStat('Accuracy')).toBe('60%');
    expect(screen.queryByRole('group', { name: 'Answer choices' })).not.toBeInTheDocument();
  });

  it('starts a fresh session from the summary with Practice Again', async () => {
    const user = renderPracticeWithState(fiveQuestions);
    for (let i = 0; i < 5; i += 1) {
      await answerCard(user);
    }

    await user.click(screen.getByRole('button', { name: 'Practice Again' }));

    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    expect(getProgressBar()).toHaveAttribute('aria-valuenow', '0');
  });
});

describe('PracticePage: continuous practice', () => {
  const continuous: PracticeConfig = { ...fiveQuestions, sessionLength: 'continuous' };

  it('shows a running count instead of a progress bar', async () => {
    const user = renderPracticeWithState(continuous);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('0 answered so far')).toBeInTheDocument();

    for (let i = 0; i < 6; i += 1) {
      await answerCard(user);
    }

    expect(screen.getByText('6 answered so far')).toBeInTheDocument();
    expect(screen.getByText('Question 7')).toBeInTheDocument();
  });

  it('asks before ending a session with answered questions', async () => {
    const user = renderPracticeWithState(continuous);
    await answerCard(user, true);
    await answerCard(user, false);

    await user.click(screen.getByRole('button', { name: 'End Session' }));

    const prompt = screen.getByText('End this session? You have answered 2 questions.');
    expect(prompt).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Yes, End Session' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Session Summary' })).toBeInTheDocument();
    expect(getStat('Answered')).toBe('2');
  });

  it('keeps practicing when the student changes their mind', async () => {
    const user = renderPracticeWithState(continuous);
    await answerCard(user);

    await user.click(screen.getByRole('button', { name: 'End Session' }));
    await user.click(screen.getByRole('button', { name: 'Keep Practicing' }));

    expect(screen.getByText('Question 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End Session' })).toBeInTheDocument();
  });

  it('returns to setup without asking when nothing has been answered', async () => {
    const user = renderPracticeWithState(continuous);

    await user.click(screen.getByRole('button', { name: 'End Session' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument();
  });
});

describe('PracticePage: missing setup', () => {
  it('sends the student to the setup page when opened directly', () => {
    renderAppAt('/practice/session');

    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument();
    expect(screen.getByText("Let's set up your practice first.")).toBeInTheDocument();
  });

  it('treats an invalid setup like a missing one', () => {
    renderPracticeWithState({ operations: [], difficulty: 9, sessionLength: 0 });

    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument();
  });
});
