import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import AppRoutes from '../app/AppRoutes';
import { renderAppAt } from '../test/renderWithRouter';
import type { PracticeConfig } from '../types';

function renderPracticeWithState(state: unknown) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/practice/session', state }]}>
      <AppRoutes />
    </MemoryRouter>,
  );
  return userEvent.setup();
}

const fiveQuestions: PracticeConfig = {
  operations: ['subtraction'],
  difficulty: 2,
  sessionLength: 5,
};

/** Answer the current card: pick the first choice, flip, and report a result. */
async function answerCard(user: ReturnType<typeof userEvent.setup>, gotItRight = true) {
  const choices = screen.getByRole('group', { name: 'Answer choices' });
  await user.click(within(choices).getAllByRole('button')[0]);
  await user.click(screen.getByRole('button', { name: 'Flip Card' }));
  await user.click(
    screen.getByRole('button', { name: gotItRight ? 'I Got It Right' : 'I Got It Wrong' }),
  );
}

describe('PracticePage', () => {
  it('shows the chosen setup and the first question card', () => {
    renderPracticeWithState(fiveQuestions);

    expect(screen.getByRole('heading', { level: 1, name: 'Practice' })).toBeInTheDocument();
    expect(screen.getByText('Subtraction, Easy level')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
    const problem = screen.getByRole('heading', { level: 2 });
    expect(problem).toHaveTextContent(/^\d+ − \d+ = \?$/);
  });

  it('moves to the next question after the student reports a result', async () => {
    const user = renderPracticeWithState(fiveQuestions);

    await answerCard(user, false);

    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled();
    expect(screen.getByRole('heading', { level: 2, name: /= \?$/ })).toHaveFocus();
  });

  it('finishes after the last question and can start again', async () => {
    const user = renderPracticeWithState(fiveQuestions);

    for (let i = 0; i < 5; i += 1) {
      await answerCard(user);
    }

    expect(screen.getByText('Nice work! You finished all 5 questions.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Practice Again' }));
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
  });

  it('keeps going in continuous practice', async () => {
    const user = renderPracticeWithState({ ...fiveQuestions, sessionLength: 'continuous' });

    for (let i = 0; i < 6; i += 1) {
      await answerCard(user);
    }

    expect(screen.getByText('Question 7')).toBeInTheDocument();
  });

  it('asks the student to set up practice when opened directly', () => {
    renderAppAt('/practice/session');

    expect(screen.getByText("Let's set up your practice first.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Set Up Practice' })).toHaveAttribute(
      'href',
      '/practice/setup',
    );
  });

  it('treats an invalid setup like a missing one', () => {
    renderPracticeWithState({ operations: [], difficulty: 9, sessionLength: 0 });

    expect(screen.getByText("Let's set up your practice first.")).toBeInTheDocument();
  });
});
