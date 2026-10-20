import { useEffect, useId, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ROUTES, type PracticeSetupState } from '../app/routes';
import { Button, ButtonLink } from '../components/common/Button';
import PageContainer from '../components/layout/PageContainer';
import ProgressBar from '../components/practice/ProgressBar';
import QuestionCard from '../components/practice/QuestionCard';
import { usePracticeSession } from '../hooks/usePracticeSession';
import type { PracticeConfig, PracticeSession } from '../types';
import { formatDifficulty, formatOperationList, formatQuestionCount } from '../utils/format';
import { isPracticeConfig } from '../utils/validation';
import styles from './PracticePage.module.css';

/**
 * Runs a practice session for the setup chosen on the practice setup page.
 * Without a valid setup (for example, after typing the URL directly), the
 * student is sent to the setup page with a short explanation.
 */
function PracticePage() {
  const { state } = useLocation();
  const [round, setRound] = useState(0);

  if (!isPracticeConfig(state)) {
    const setupState: PracticeSetupState = { notice: 'session-missing' };
    return <Navigate to={ROUTES.practiceSetup} replace state={setupState} />;
  }

  // A new key remounts the session, which starts a fresh one with the same setup.
  return (
    <PracticeSessionView
      key={round}
      config={state}
      onPracticeAgain={() => setRound((current) => current + 1)}
    />
  );
}

interface PracticeSessionViewProps {
  config: PracticeConfig;
  onPracticeAgain: () => void;
}

function PracticeSessionView({ config, onPracticeAgain }: PracticeSessionViewProps) {
  const navigate = useNavigate();
  const { session, currentQuestion, isActive, questionNumber, totalQuestions, ...actions } =
    usePracticeSession(config);
  const [isConfirmingEnd, setIsConfirmingEnd] = useState(false);

  function handleEndClick() {
    // Nothing would be lost yet, so there is no need to confirm.
    if (session.attempted === 0) {
      navigate(ROUTES.practiceSetup);
      return;
    }
    setIsConfirmingEnd(true);
  }

  function handleConfirmEnd() {
    setIsConfirmingEnd(false);
    actions.endSession();
  }

  return (
    <PageContainer title="Practice" showTitle={false}>
      <h1 className="visually-hidden">Practice</h1>
      <p className={styles.details}>
        {formatOperationList(config.operations)}, {formatDifficulty(config.difficulty)} level
      </p>

      {totalQuestions === null ? (
        <p className={styles.details}>{session.attempted} answered so far</p>
      ) : (
        <ProgressBar
          value={session.attempted}
          max={totalQuestions}
          label="Session progress"
          valueText={`${session.attempted} of ${totalQuestions} questions answered`}
        />
      )}

      {isActive ? (
        <>
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            onResult={actions.recordResult}
            focusOnMount={questionNumber > 1}
          />
          <div className={styles.footer}>
            {isConfirmingEnd ? (
              <EndSessionConfirmation
                answered={session.attempted}
                onConfirm={handleConfirmEnd}
                onCancel={() => setIsConfirmingEnd(false)}
              />
            ) : (
              <Button variant="secondary" onClick={handleEndClick}>
                End Session
              </Button>
            )}
          </div>
        </>
      ) : (
        <SessionComplete session={session} onPracticeAgain={onPracticeAgain} />
      )}
    </PageContainer>
  );
}

interface EndSessionConfirmationProps {
  answered: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Inline confirmation shown in place of the End Session button. */
function EndSessionConfirmation({ answered, onConfirm, onCancel }: EndSessionConfirmationProps) {
  const promptId = useId();
  const promptRef = useRef<HTMLParagraphElement>(null);

  // Move focus to the question so keyboard and screen-reader users hear it.
  useEffect(() => {
    promptRef.current?.focus();
  }, []);

  return (
    <div className={styles.confirm} role="group" aria-labelledby={promptId}>
      <p id={promptId} ref={promptRef} tabIndex={-1} className={styles.confirmPrompt}>
        End this session? You have answered {formatQuestionCount(answered)}.
      </p>
      <div className={styles.confirmActions}>
        <Button onClick={onConfirm}>Yes, End Session</Button>
        <Button variant="secondary" onClick={onCancel}>
          Keep Practicing
        </Button>
      </div>
    </div>
  );
}

interface SessionCompleteProps {
  session: PracticeSession;
  onPracticeAgain: () => void;
}

/** Shown when the session ends. Phase 8 replaces this with the full summary page. */
function SessionComplete({ session, onPracticeAgain }: SessionCompleteProps) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className={styles.complete} aria-labelledby={headingId}>
      <h2 id={headingId} ref={headingRef} tabIndex={-1}>
        Session complete!
      </h2>
      <p className={styles.completeTotals}>
        {`You answered ${formatQuestionCount(session.attempted)}: ${session.correct} right ` +
          `and ${session.incorrect} to keep practicing.`}
      </p>
      <div className={styles.confirmActions}>
        <Button onClick={onPracticeAgain}>Practice Again</Button>
        <ButtonLink to={ROUTES.practiceSetup} variant="secondary">
          Change Setup
        </ButtonLink>
      </div>
    </section>
  );
}

export default PracticePage;
