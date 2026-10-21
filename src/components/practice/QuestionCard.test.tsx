import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { playSound } from '../../services/soundEffects';
import type { Question } from '../../types';
import QuestionCard from './QuestionCard';

vi.mock('../../services/soundEffects', () => ({ playSound: vi.fn() }));

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
    expect(screen.getByRole('heading', { name: 'What is 7 times 8?' })).toBeInTheDocument();
    const choices = within(screen.getByRole('group', { name: 'Answer choices' })).getAllByRole(
      'button',
    );
    // Each button is named by its answer; the small key number is hidden from screen readers.
    ['48', '54', '56', '64'].forEach((answer, index) => {
      expect(choices[index]).toHaveAccessibleName(answer);
    });
  });

  it('describes the problem with the question number for screen readers', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: 'What is 7 times 8?' })).toHaveAccessibleDescription(
      'Question 3 of 10',
    );
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

    expect(screen.getByRole('heading', { name: '7 times 8 equals 56' })).toBeInTheDocument();
    expect(screen.getByText(/your answer:/i)).toHaveTextContent('Your answer: 54');
  });

  it('hides the front so its answers can no longer be changed', async () => {
    await selectAndFlip('54');

    expect(screen.queryByRole('group', { name: 'Answer choices' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Flip Card' })).not.toBeInTheDocument();
  });

  it('moves focus to the revealed answer', async () => {
    await selectAndFlip('56');

    expect(screen.getByRole('heading', { name: '7 times 8 equals 56' })).toHaveFocus();
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

  it('works the same with animation turned off', async () => {
    const { user, onResult } = renderCard({ animated: false });

    await user.click(getChoice('48'));
    await user.click(getFlipButton());
    expect(screen.getByRole('heading', { name: '7 times 8 equals 56' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));

    expect(onResult).toHaveBeenCalledWith({ selectedAnswer: 48, selfReportedCorrect: false });
  });

  it('can move focus to the problem when it appears', () => {
    renderCard({ focusOnMount: true });

    expect(screen.getByRole('heading', { name: 'What is 7 times 8?' })).toHaveFocus();
  });

  it('does not move focus on its own by default', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: 'What is 7 times 8?' })).not.toHaveFocus();
  });
});

describe('QuestionCard keyboard shortcuts', () => {
  it('selects an answer with number keys 1 to 4 and focuses it', async () => {
    const { user } = renderCard();

    await user.keyboard('2');
    expect(getChoice('54')).toHaveAttribute('aria-pressed', 'true');
    expect(getChoice('54')).toHaveFocus();
    expect(getFlipButton()).toBeEnabled();

    await user.keyboard('4');
    expect(getChoice('64')).toHaveAttribute('aria-pressed', 'true');
    expect(getChoice('54')).toHaveAttribute('aria-pressed', 'false');
  });

  it('tells assistive technology which key selects each answer', () => {
    renderCard();

    expect(getChoice('48')).toHaveAttribute('aria-keyshortcuts', '1');
    expect(getChoice('64')).toHaveAttribute('aria-keyshortcuts', '4');
  });

  it('ignores keys without an answer, and keys combined with Ctrl, Alt, or Meta', async () => {
    const { user } = renderCard();

    await user.keyboard('5');
    await user.keyboard('0');
    await user.keyboard('{Control>}1{/Control}');

    for (const name of ['48', '54', '56', '64']) {
      expect(getChoice(name)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('does not change the answer after the card is flipped', async () => {
    const { user } = renderCard();

    await user.keyboard('3');
    await user.click(getFlipButton());
    await user.keyboard('1');

    expect(screen.getByText(/your answer:/i)).toHaveTextContent('Your answer: 56');
  });

  it('does not take over number keys typed into a text field', async () => {
    const user = userEvent.setup();
    render(
      <>
        <label>
          Name <input type="text" />
        </label>
        <QuestionCard
          question={question}
          questionNumber={1}
          totalQuestions={5}
          onResult={vi.fn()}
        />
      </>,
    );

    await user.type(screen.getByRole('textbox', { name: 'Name' }), '12');

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('12');
    expect(getChoice('48')).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('QuestionCard screen-reader text', () => {
  it('reads the problem in words, with the symbols shown visually', () => {
    renderCard();

    const heading = screen.getByRole('heading', { name: 'What is 7 times 8?' });
    expect(within(heading).getByText('7 × 8 = ?')).toHaveAttribute('aria-hidden', 'true');
  });

  it('reads the revealed answer in words', async () => {
    const { user } = renderCard();

    await user.click(getChoice('56'));
    await user.click(getFlipButton());

    expect(screen.getByRole('heading', { name: '7 times 8 equals 56' })).toHaveFocus();
  });
});

describe('QuestionCard explanations', () => {
  it('explains the answer on the back by default', async () => {
    const { user } = renderCard();

    await user.click(getChoice('56'));
    await user.click(getFlipButton());

    expect(screen.getByText('7 × 8 means 7 groups of 8, which makes 56.')).toBeInTheDocument();
  });

  it('leaves the explanation out when turned off', async () => {
    const { user } = renderCard({ showExplanation: false });

    await user.click(getChoice('56'));
    await user.click(getFlipButton());

    expect(screen.queryByText(/groups of/)).not.toBeInTheDocument();
  });
});

describe('QuestionCard sound effects', () => {
  beforeEach(() => {
    vi.mocked(playSound).mockClear();
  });

  it('plays a flip sound and a chime for a correct answer when turned on', async () => {
    const { user } = renderCard({ soundEffects: true });

    await user.click(getChoice('56'));
    await user.click(getFlipButton());
    expect(playSound).toHaveBeenLastCalledWith('flip');

    await user.click(screen.getByRole('button', { name: 'I Got It Right' }));
    expect(playSound).toHaveBeenLastCalledWith('correct');
  });

  it('plays no sound for "I Got It Wrong"', async () => {
    const { user } = renderCard({ soundEffects: true });

    await user.click(getChoice('54'));
    await user.click(getFlipButton());
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));

    expect(playSound).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith('flip');
  });

  it('is silent by default', async () => {
    const { user } = renderCard();

    await user.click(getChoice('56'));
    await user.click(getFlipButton());
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }));

    expect(playSound).not.toHaveBeenCalled();
  });
});
