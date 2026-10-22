import { useEffect, useId, useRef, useState } from 'react';
import { Navigate, useBlocker, useLocation, useNavigate, type BlockerFunction } from 'react-router';
import { useAppData } from '../app/AppDataContext';
import { ROUTES, type PracticeSetupState, type SessionSummaryState } from '../app/routes';
import { Button, ButtonLink } from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import ProgressBar from '../components/practice/ProgressBar';
import QuestionCard, { type CardResult } from '../components/practice/QuestionCard';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { pickFeedback } from '../services/feedbackMessages';
import { getActivePatterns } from '../services/mistakeReview';
import { loadMistakePatterns } from '../services/mistakeStorage';
import type { PracticeConfig } from '../types';
import { formatPracticeSetup, formatQuestionCount } from '../utils/format';
import { isPracticeConfig } from '../utils/validation';
import styles from './PracticePage.module.css';

/**
 * Runs a practice session for the setup chosen on the practice setup page.
 * Without a valid setup (for example, after typing the URL directly), the
 * student is sent to the setup page with a short explanation. A review
 * session with no mistakes left to review explains that instead.
 */
function PracticePage() {
  const location = useLocation();
  const { storage } = useAppData();

  if (!isPracticeConfig(location.state)) {
    const setupState: PracticeSetupState = { notice: 'session-missing' };
    return <Navigate to={ROUTES.practiceSetup} replace state={setupState} />;
  }

  const isReview = location.state.mode === 'mistake-review';
  if (isReview && getActivePatterns(loadMistakePatterns(storage).patterns).length === 0) {
    return (
      <PageContainer title="Practice">
        <EmptyState
          message="There are no mistakes to review right now. Nice work!"
          action={<ButtonLink to={ROUTES.practiceSetup}>Start Practice</ButtonLink>}
        />
      </PageContainer>
    );
  }

  // Keyed by the history entry: every navigation here starts a fresh session,
  // while a refresh (same entry) restores the session in progress.
  return (
    <PracticeSessionView key={location.key} config={location.state} locationKey={location.key} />
  );
}

interface PracticeSessionViewProps {
  config: PracticeConfig;
  locationKey: string;
}

function PracticeSessionView({ config, locationKey }: PracticeSessionViewProps) {
  const navigate = useNavigate();
  const { settings } = useAppData();
  const practice = usePracticeSession(config, { locationKey });
  const { session, attempts, currentQuestion, isActive, questionNumber, totalQuestions } = practice;
  const [isConfirmingEnd, setIsConfirmingEnd] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Warn before leaving a session with answered questions, whether by a link
  // or the browser's Back button. Finished sessions and sessions with nothing
  // answered yet leave without a warning.
  const shouldWarnBeforeLeaving: BlockerFunction = ({ currentLocation, nextLocation }) =>
    isActive && session.attempted > 0 && currentLocation.pathname !== nextLocation.pathname;
  const blocker = useBlocker(shouldWarnBeforeLeaving);

  function handleLeave() {
    practice.leaveSession();
    blocker.proceed?.();
  }

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

  function handleResult(result: CardResult) {
    if (settings.feedbackMessagesEnabled) {
      setFeedback(pickFeedback(result.selfReportedCorrect, feedback));
    }
    practice.recordResult(result);
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
      <p className={`${styles.details} ${styles.setup}`}>{formatPracticeSetup(config)}</p>

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

      {settings.feedbackMessagesEnabled ? (
        <p role="status" aria-label="Feedback" className={styles.feedback}>
          {feedback}
        </p>
      ) : null}

      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        onResult={handleResult}
        initialProgress={practice.initialCardProgress}
        onProgressChange={practice.updateCardProgress}
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

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Leave this session?"
        message={
          <p>
            You have answered {formatQuestionCount(session.attempted)}. Your answers so far are
            saved, but this session will end.
          </p>
        }
        confirmLabel="End Session and Leave"
        cancelLabel="Keep Practicing"
        onConfirm={handleLeave}
        onCancel={() => blocker.reset?.()}
      />
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
