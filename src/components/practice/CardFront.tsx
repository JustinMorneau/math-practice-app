import { useId, type Ref } from 'react';
import type { Question } from '../../types';
import { formatSpokenProblem } from '../../utils/format';
import { Button } from '../common/Button';
import AnswerChoice from './AnswerChoice';
import styles from './QuestionCard.module.css';

interface CardFrontProps {
  question: Question;
  questionNumber: number;
  /** Null for continuous practice, which has no fixed total. */
  totalQuestions: number | null;
  selectedAnswer: number | null;
  /** True once the card is flipped; answers can no longer change. */
  isLocked: boolean;
  onSelect: (answer: number) => void;
  onFlip: () => void;
  headingRef: Ref<HTMLHeadingElement>;
  /** Receives each answer button, so number-key selection can move focus to it. */
  choiceRef: (index: number, button: HTMLButtonElement | null) => void;
}

/** The question side: problem, four answer choices, and the Flip Card button. */
function CardFront({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  isLocked,
  onSelect,
  onFlip,
  headingRef,
  choiceRef,
}: CardFrontProps) {
  const progressId = useId();
  const { operation, firstOperand, secondOperand } = question;
  // Read by screen readers instead of the symbols, e.g. "What is 7 times 8?"
  const spokenQuestion = `What is ${formatSpokenProblem(operation, firstOperand, secondOperand)}?`;
  const progressLabel =
    totalQuestions === null
      ? `Question ${questionNumber}`
      : `Question ${questionNumber} of ${totalQuestions}`;

  return (
    <>
      <p id={progressId} className={styles.meta}>
        {progressLabel}
      </p>
      {/* Described by the question number, so it is read when focus moves here.
          Screen readers hear the spoken version; sighted students see the symbols. */}
      <h2 ref={headingRef} tabIndex={-1} className={styles.problem} aria-describedby={progressId}>
        <span aria-hidden="true">{question.displayText} = ?</span>
        <span className="visually-hidden">{spokenQuestion}</span>
      </h2>
      <div className={styles.choices} role="group" aria-label="Answer choices">
        {question.choices.map((choice, index) => (
          <AnswerChoice
            key={choice}
            ref={(button) => choiceRef(index, button)}
            value={choice}
            shortcut={index + 1}
            isSelected={choice === selectedAnswer}
            disabled={isLocked}
            onSelect={onSelect}
          />
        ))}
      </div>
      <p className={styles.keyHint}>Tip: press 1, 2, 3, or 4 to choose an answer.</p>
      <Button
        className={styles.wideButton}
        size="large"
        disabled={selectedAnswer === null || isLocked}
        onClick={onFlip}
      >
        Flip Card
      </Button>
    </>
  );
}

export default CardFront;
