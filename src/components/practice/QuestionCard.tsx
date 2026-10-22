import { useEffect, useRef, useState } from 'react';
import type { CardProgress } from '../../services/activeSessionStorage';
import { playSound } from '../../services/soundEffects';
import type { Question } from '../../types';
import CardBack from './CardBack';
import CardFront from './CardFront';
import styles from './QuestionCard.module.css';

export interface CardResult {
  selectedAnswer: number;
  selfReportedCorrect: boolean;
}

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  /** Null for continuous practice. */
  totalQuestions: number | null;
  /** Called once, after the student reports whether they got it right. */
  onResult: (result: CardResult) => void;
  /** Animate the flip. When false (or with reduced motion), faces switch instantly. */
  animated?: boolean;
  /** Show a short explanation on the back of the card. */
  showExplanation?: boolean;
  /** Play a tick on flipping and a chime for "I Got It Right". */
  soundEffects?: boolean;
  /** Move keyboard focus to the problem when the card appears (for every card after the first). */
  focusOnMount?: boolean;
  /** Where to start, such as a card restored after a page refresh. */
  initialProgress?: CardProgress;
  /** Called when the student selects an answer or flips the card, so it can be saved. */
  onProgressChange?: (progress: CardProgress) => void;
}

/**
 * A flashcard: answer on the front, flip, then self-report on the back.
 *
 * Give each question its own `key` so the selected answer and flip state
 * reset automatically for the next question.
 *
 * The face turned away is `inert` and `aria-hidden`, so it can't be focused,
 * clicked, or read by screen readers. Flipping moves focus to the back's
 * heading so the revealed answer is announced. Number keys 1–4 choose an
 * answer while the front is showing.
 */
/** Whether a key event comes from a field the student types or chooses in. */
function isFormControl(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onResult,
  animated = true,
  showExplanation = true,
  soundEffects = false,
  focusOnMount = false,
  initialProgress,
  onProgressChange,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(
    initialProgress?.selectedAnswer ?? null,
  );
  const [isFlipped, setIsFlipped] = useState(initialProgress?.isFlipped ?? false);
  const frontHeadingRef = useRef<HTMLHeadingElement>(null);
  const backHeadingRef = useRef<HTMLHeadingElement>(null);
  const choiceButtons = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (focusOnMount) {
      frontHeadingRef.current?.focus();
    }
  }, [focusOnMount]);

  useEffect(() => {
    if (isFlipped) {
      backHeadingRef.current?.focus();
    }
  }, [isFlipped]);

  // Number keys 1–4 choose an answer until the card is flipped.
  useEffect(() => {
    if (isFlipped) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      // Never take over keys typed into a text field or other form control.
      if (isFormControl(event.target)) {
        return;
      }
      if (!/^[1-9]$/.test(event.key)) {
        return;
      }
      const index = Number(event.key) - 1;
      if (index >= question.choices.length) {
        return;
      }
      event.preventDefault();
      setSelectedAnswer(question.choices[index]);
      onProgressChange?.({ selectedAnswer: question.choices[index], isFlipped: false });
      // Move focus to the chosen answer so screen readers announce it.
      choiceButtons.current[index]?.focus();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, question.choices, onProgressChange]);

  function handleSelect(answer: number) {
    if (!isFlipped) {
      setSelectedAnswer(answer);
      onProgressChange?.({ selectedAnswer: answer, isFlipped: false });
    }
  }

  function handleFlip() {
    if (selectedAnswer !== null) {
      setIsFlipped(true);
      onProgressChange?.({ selectedAnswer, isFlipped: true });
      if (soundEffects) {
        playSound('flip');
      }
    }
  }

  function handleReport(selfReportedCorrect: boolean) {
    if (selectedAnswer !== null) {
      if (soundEffects && selfReportedCorrect) {
        playSound('correct');
      }
      onResult({ selectedAnswer, selfReportedCorrect });
    }
  }

  const sceneClassName = animated ? styles.scene : `${styles.scene} ${styles.static}`;
  const cardClassName = isFlipped ? `${styles.card} ${styles.flipped}` : styles.card;

  return (
    <div className={sceneClassName}>
      <div className={cardClassName} data-flipped={isFlipped}>
        <section
          className={`${styles.face} ${styles.front}`}
          aria-label="Question"
          aria-hidden={isFlipped}
          inert={isFlipped}
        >
          <CardFront
            question={question}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            selectedAnswer={selectedAnswer}
            isLocked={isFlipped}
            onSelect={handleSelect}
            onFlip={handleFlip}
            headingRef={frontHeadingRef}
            choiceRef={(index, button) => {
              choiceButtons.current[index] = button;
            }}
          />
        </section>
        <section
          className={`${styles.face} ${styles.back}`}
          aria-label="Answer"
          aria-hidden={!isFlipped}
          inert={!isFlipped}
        >
          {isFlipped ? (
            <CardBack
              question={question}
              selectedAnswer={selectedAnswer}
              showExplanation={showExplanation}
              onReport={handleReport}
              headingRef={backHeadingRef}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default QuestionCard;
