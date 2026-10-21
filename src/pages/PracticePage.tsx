import { useEffect, useId, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAppData } from '../app/AppDataContext';
import { ROUTES, type PracticeSetupState, type SessionSummaryState } from '../app/routes';
import { Button } from '../components/common/Button';
import PageContainer from '../components/layout/PageContainer';
import ProgressBar from '../components/practice/ProgressBar';
import QuestionCard from '../components/practice/QuestionCard';
import { usePracticeSession } from '../hooks/usePracticeSession';
import type { PracticeConfig } from '../types';
import { formatDifficulty, formatOperationList, formatQuestionCount } from '../utils/format';
import { isPracticeConfig } from '../utils/validation';
import styles from './PracticePage.module.css';

/**
 * Runs a practice session for the setup chosen on the practice setup page.
 * Without a valid setup (for example, after typing the URL directly), the
 * student is sent to the setup page with a short explanation.
 */
function PracticePage() {
  const location = useLocation();

  if (!isPracticeConfig(location.state)) {
    const setupState: PracticeSetupState = { notice: 'session-missing' };
    return <Navigate to={ROUTES.practiceSetup} replace state={setupState} />;
  }

  // Keyed by the history entry, so every navigation here starts a fresh session.
  return <PracticeSessionView key={location.key} config={location.state} />;
}

function PracticeSessionView({ config }: { config: PracticeConfig }) {
  const navigate = useNavigate();
  const { settings } = useAppData();
  const practice = usePracticeSession(config);
  const { session, attempts, currentQuestion, isActive, questionNumber, totalQuestions } = practice;
  const [isConfirmingEnd, setIsConfirmingEnd] = useState(false);

  // When the session ends, show its summary. Replacing this history entry
  // means the browser's Back button won't return to a finished session.
  useEffect(() => {
    if (!isActive) {
      const summaryState: SessionSummaryState = {
        session,
        reviewQuestionCount: attempts.filter(({ source }) => source === 'mistake-review').length,
      };
      navigate(ROUTES.practiceSummary, { replace: true, state: summaryState });
    }
  }, [isActive, navigate, session, attempts]);

  if (!isActive) {
    return null;
  }

  function handleEndClick() {
    // Nothing would be lost yet, so there is no need to confirm.
    if (session.attempted === 0) {
      navigate(ROUTES.practiceSetup);
      return;
    }
    setIsConfirmingEnd(true);
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

      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        onResult={practice.recordResult}
        animated={settings.cardAnimationsEnabled}
        showExplanation={settings.showExplanations}
        soundEffects={settings.soundEffectsEnabled}
        focusOnMount={questionNumber > 1}
      />

      <div className={styles.footer}>
        {isConfirmingEnd ? (
          <EndSessionConfirmation
            answered={session.attempted}
            onConfirm={practice.endSession}
            onCancel={() => setIsConfirmingEnd(false)}
          />
        ) : (
          <Button variant="secondary" onClick={handleEndClick}>
            End Session
          </Button>
        )}
      </div>
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

export default PracticePage;
