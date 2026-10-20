import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Question } from '../../types';
import QuestionCard from './QuestionCard';

const question: Question = {
  id: 'q-test',
  operation: 'multiplication',
  firstOperand: 7,
  secondOperand: 8,
  displayText: '7 × 8',
  correctAnswer: 56,
  choices: [48, 54, 56, 64],
  difficulty: 2,
  source: 'regular',
};

function renderCard(props: Partial<Parameters<typeof QuestionCard>[0]> = {}) {
  const onResult = vi.fn();
  render(
    <QuestionCard
      question={question}
      questionNumber={3}
      totalQuestions={10}
      onResult={onResult}
      {...props}
    />,
  );
  return { onResult, user: userEvent.setup() };
}

function getChoice(name: string) {
  return within(screen.getByRole('group', { name: 'Answer choices' })).getByRole('button', {
    name,
  });
}

function getFlipButton() {
  return screen.getByRole('button', { name: 'Flip Card' });
}

describe('QuestionCard front', () => {
  it('shows the question number, the problem, and four answer choices', () => {
    renderCard();

    expect(screen.getByText('Question 3 of 10')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '7 × 8 = ?' })).toBeInTheDocument();
    const choices = within(screen.getByRole('group', { name: 'Answer choices' })).getAllByRole(
      'button',
    );
    expect(choices.map((choice) => choice.textContent)).toEqual(['48', '54', '56', '64']);
  });

  it('shows only the question number in continuous practice', () => {
    renderCard({ totalQuestions: null });

    expect(screen.getByText('Question 3')).toBeInTheDocument();
    expect(screen.queryByText(/of/)).not.toBeInTheDocument();
  });

  it('keeps Flip Card disabled until an answer is selected', async () => {
    const { user } = renderCard();
    expect(getFlipButton()).toBeDisabled();

    await user.click(getChoice('54'));

    expect(getFlipButton()).toBeEnabled();
  });

  it('highlights the selected answer and lets it change before flipping', async () => {
    const { user } = renderCard();

    await user.click(getChoice('54'));
    expect(getChoice('54')).toHaveAttribute('aria-pressed', 'true');

    await user.click(getChoice('56'));
    expect(getChoice('56')).toHaveAttribute('aria-pressed', 'true');
    expect(getChoice('54')).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not count anything before the student reports a result', async () => {
    const { user, onResult } = renderCard();

    await user.click(getChoice('54'));
    await user.click(getFlipButton());

    expect(onResult).not.toHaveBeenCalled();
  });
});

describe('QuestionCard back', () => {
  async function selectAndFlip(answer: string) {
    const result = renderCard();
    await result.user.click(getChoice(answer));
    await result.user.click(getFlipButton());
    return result;
  }

  it('reveals the correct answer and the student answer', async () => {
    await selectAndFlip('54');

    expect(screen.getByRole('heading', { name: '7 × 8 = 56' })).toBeInTheDocument();
    expect(screen.getByText(/your answer:/i)).toHaveTextContent('Your answer: 54');
  });

  it('hides the front so its answers can no longer be changed', async () => {
    await selectAndFlip('54');

    expect(screen.queryByRole('group', { name: 'Answer choices' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Flip Card' })).not.toBeInTheDocument();
  });

  it('moves focus to the revealed answer', async () => {
    await selectAndFlip('56');

    expect(screen.getByRole('heading', { name: '7 × 8 = 56' })).toHaveFocus();
  });

  it('reports a correct result', async () => {
    const { user, onResult } = await selectAndFlip('56');

    await user.click(screen.getByRole('button', { name: 'I Got It Right' }));

    expect(onResult).toHaveBeenCalledWith({ selectedAnswer: 56, selfReportedCorrect: true });
  });

  it('reports an incorrect result', async () => {
    const { user, onResult } = await selectAndFlip('54');

    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));

    expect(onResult).toHaveBeenCalledWith({ selectedAnswer: 54, selfReportedCorrect: false });
  });

  it('counts only the first report for an attempt', async () => {
    const { user, onResult } = await selectAndFlip('54');

    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }));
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));

    expect(onResult).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'I Got It Right' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'I Got It Wrong' })).toBeDisabled();
  });
});

describe('QuestionCard behavior', () => {
  it('can be completed with the keyboard alone', async () => {
    const { user, onResult } = renderCard();

    getChoice('56').focus();
    await user.keyboard('{Enter}');
    await user.tab(); // to the next answer choice
    await user.tab(); // to Flip Card
    expect(getFlipButton()).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('button', { name: 'I Got It Right' })).toHaveFocus();
    await user.keyboard(' ');

    expect(onResult).toHaveBeenCalledWith({ selectedAnswer: 56, selfReportedCorrect: true });
  });

  it('can move focus to the problem when it appears', () => {
    renderCard({ focusOnMount: true });

    expect(screen.getByRole('heading', { name: '7 × 8 = ?' })).toHaveFocus();
  });

  it('does not move focus on its own by default', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: '7 × 8 = ?' })).not.toHaveFocus();
  });
});
