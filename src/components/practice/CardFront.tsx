import { useId, type Ref } from 'react';
import type { Question } from '../../types';
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
}: CardFrontProps) {
  const progressId = useId();
  const progressLabel =
    totalQuestions === null
      ? `Question ${questionNumber}`
      : `Question ${questionNumber} of ${totalQuestions}`;

  return (
    <>
      <p id={progressId} className={styles.meta}>
        {progressLabel}
      </p>
      {/* Described by the question number, so it is read when focus moves here */}
      <h2 ref={headingRef} tabIndex={-1} className={styles.problem} aria-describedby={progressId}>
        {question.displayText} = ?
      </h2>
      <div className={styles.choices} role="group" aria-label="Answer choices">
        {question.choices.map((choice) => (
          <AnswerChoice
            key={choice}
            value={choice}
            isSelected={choice === selectedAnswer}
            disabled={isLocked}
            onSelect={onSelect}
          />
        ))}
      </div>
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
