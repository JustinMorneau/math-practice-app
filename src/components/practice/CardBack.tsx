import { useState, type Ref } from 'react';
import { getExplanation } from '../../services/explanations';
import type { Question } from '../../types';
import { formatSpokenProblem } from '../../utils/format';
import { Button } from '../common/Button';
import styles from './QuestionCard.module.css';

interface CardBackProps {
  question: Question;
  selectedAnswer: number | null;
  /** Show a one-line explanation of the answer. */
  showExplanation: boolean;
  /** Called once with the student's own judgment of their answer. */
  onReport: (selfReportedCorrect: boolean) => void;
  headingRef: Ref<HTMLHeadingElement>;
}

/**
 * The answer side: the question with its correct answer, the student's
 * answer, and buttons for the student to report how they did. After one
 * button is pressed, both are disabled so the attempt is counted only once.
 */
function CardBack({
  question,
  selectedAnswer,
  showExplanation,
  onReport,
  headingRef,
}: CardBackProps) {
  const [hasReported, setHasReported] = useState(false);
  const { operation, firstOperand, secondOperand, correctAnswer } = question;
  // Read by screen readers instead of the symbols, e.g. "7 times 8 equals 56"
  const spokenProblem = formatSpokenProblem(operation, firstOperand, secondOperand);
  const spokenAnswer = `${spokenProblem} equals ${correctAnswer}`;

  function report(selfReportedCorrect: boolean) {
    if (hasReported) {
      return;
    }
    setHasReported(true);
    onReport(selfReportedCorrect);
  }

  return (
    <>
      <p className={styles.meta}>The answer is</p>
      <h2 ref={headingRef} tabIndex={-1} className={`${styles.problem} ${styles.answerProblem}`}>
        <span aria-hidden="true">
          {question.displayText} = {question.correctAnswer}
        </span>
        <span className="visually-hidden">{spokenAnswer}</span>
      </h2>
      {showExplanation ? <p className={styles.explanation}>{getExplanation(question)}</p> : null}
      <p className={styles.yourAnswer}>
        Your answer: <strong>{selectedAnswer}</strong>
      </p>
      <p className={styles.prompt}>How did you do?</p>
      <div className={styles.resultButtons}>
        <Button disabled={hasReported} onClick={() => report(true)}>
          <span aria-hidden="true">✓</span> I Got It Right
        </Button>
        <Button variant="secondary" disabled={hasReported} onClick={() => report(false)}>
          <span aria-hidden="true">↻</span> I Got It Wrong
        </Button>
      </div>
    </>
  );
}

export default CardBack;
