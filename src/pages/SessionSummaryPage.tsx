import { useLocation, useNavigate } from 'react-router';
import { ROUTES, type PracticeSetupState, type SessionSummaryState } from '../app/routes';
import { Button, ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import { getEncouragement } from '../services/encouragement';
import { getTotalQuestions } from '../services/practiceSession';
import type { PracticeConfig } from '../types';
import { formatDifficulty, formatOperationList } from '../utils/format';
import { calculateAccuracy } from '../utils/math';
import { isPracticeSession } from '../utils/validation';
import styles from './SessionSummaryPage.module.css';

function isSessionSummaryState(value: unknown): value is SessionSummaryState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { session, reviewQuestionCount } = value as Record<string, unknown>;
  return (
    isPracticeSession(session) &&
    Number.isInteger(reviewQuestionCount) &&
    (reviewQuestionCount as number) >= 0
  );
}

/**
 * Results of the session that just ended (specification section 6.5). The
 * finished session arrives as router state from the practice page.
 */
function SessionSummaryPage() {
  const { state } = useLocation();

  if (!isSessionSummaryState(state)) {
    return (
      <PageContainer title="Session Summary">
        <EmptyState
          message="No finished session yet. Start practicing to see your results here!"
          action={<ButtonLink to={ROUTES.practiceSetup}>Start Practice</ButtonLink>}
        />
      </PageContainer>
    );
  }

  return <SessionSummary {...state} />;
}

function SessionSummary({ session, reviewQuestionCount }: SessionSummaryState) {
  const navigate = useNavigate();
  const { attempted, correct, incorrect, operations, difficulty, sessionLength } = session;
  const accuracy = calculateAccuracy(correct, attempted);
  const { headline, message, reviewTip } = getEncouragement({
    attempted,
    correct,
    incorrect,
    accuracy,
  });

  const config: PracticeConfig = { operations, difficulty, sessionLength };
  const total = getTotalQuestions(sessionLength);
  const endedEarly = total !== null && attempted < total;
  const setupState: PracticeSetupState = { config };

  return (
    <PageContainer title="Session Summary">
      <section className={styles.celebration} aria-label="How you did">
        <p className={styles.headline}>{headline}</p>
        <p className={styles.message}>{message}</p>
      </section>

      <dl className={styles.stats}>
        <div className={`${styles.stat} ${styles.accuracy}`}>
          <dt>Accuracy</dt>
          <dd>{accuracy}%</dd>
        </div>
        <div className={styles.stat}>
          <dt>Answered</dt>
          <dd>{attempted}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Got right</dt>
          <dd>{correct}</dd>
        </div>
        <div className={styles.stat}>
          <dt>To practice</dt>
          <dd>{incorrect}</dd>
        </div>
      </dl>

      <div className={styles.notes}>
        <p>{formatOperationList(operations)}, {formatDifficulty(difficulty)} level</p>
        <p>Mistake-review questions completed: {reviewQuestionCount}</p>
        {endedEarly ? <p>{`You ended after ${attempted} of ${total} questions.`}</p> : null}
        {reviewTip ? <p>{reviewTip}</p> : null}
      </div>

      <div className={styles.actions}>
        <Button size="large" onClick={() => navigate(ROUTES.practiceSession, { state: config })}>
          Practice Again
        </Button>
        <ButtonLink to={ROUTES.practiceSetup} state={setupState} variant="secondary">
          Change Settings
        </ButtonLink>
        <ButtonLink to={ROUTES.statistics} variant="secondary">
          View Statistics
        </ButtonLink>
        <ButtonLink to={ROUTES.home} variant="secondary">
          Return Home
        </ButtonLink>
      </div>
    </PageContainer>
  );
}

export default SessionSummaryPage;
