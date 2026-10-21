import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAppData } from '../app/AppDataContext';
import { ROUTES, type PracticeSetupState, type SessionSummaryState } from '../app/routes';
import { Button, ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import StatGrid from '../components/statistics/StatGrid';
import { getEncouragement } from '../services/encouragement';
import { getActivePatterns, getPatternOperations } from '../services/mistakeReview';
import { loadMistakePatterns } from '../services/mistakeStorage';
import { getTotalQuestions } from '../services/practiceSession';
import type { PracticeConfig } from '../types';
import { formatPracticeSetup } from '../utils/format';
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
  const { storage } = useAppData();
  const [activeMistakes] = useState(() => getActivePatterns(loadMistakePatterns(storage).patterns));
  const { attempted, correct, incorrect, operations, difficulty, sessionLength } = session;
  const accuracy = calculateAccuracy(correct, attempted);
  const { headline, message, reviewTip } = getEncouragement({
    attempted,
    correct,
    incorrect,
    accuracy,
  });

  const mode = session.mode ?? 'regular';
  const config: PracticeConfig = { operations, difficulty, sessionLength, mode };
  const total = getTotalQuestions(sessionLength);
  // A review session also ends early when every mistake has been mastered.
  const masteredEverything = mode === 'mistake-review' && activeMistakes.length === 0;
  const endedEarly = total !== null && attempted < total && !masteredEverything;
  const setupState: PracticeSetupState = { config };
  const reviewConfig: PracticeConfig = {
    operations: getPatternOperations(activeMistakes),
    difficulty,
    sessionLength,
    mode: 'mistake-review',
  };

  return (
    <PageContainer title="Session Summary">
      <section className={styles.celebration} aria-label="How you did">
        <p className={styles.headline}>{headline}</p>
        <p className={styles.message}>{message}</p>
      </section>

      <StatGrid
        items={[
          { label: 'Accuracy', value: `${accuracy}%`, highlight: true },
          { label: 'Answered', value: attempted },
          { label: 'Got right', value: correct },
          { label: 'To practice', value: incorrect },
        ]}
      />

      <div className={styles.notes}>
        <p>{formatPracticeSetup(config)}</p>
        <p>Mistake-review questions completed: {reviewQuestionCount}</p>
        {masteredEverything ? <p>You mastered every mistake on your list. Amazing!</p> : null}
        {endedEarly ? <p>{`You ended after ${attempted} of ${total} questions.`}</p> : null}
        {reviewTip ? <p>{reviewTip}</p> : null}
      </div>

      <div className={styles.actions}>
        <Button size="large" onClick={() => navigate(ROUTES.practiceSession, { state: config })}>
          Practice Again
        </Button>
        {activeMistakes.length > 0 ? (
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.practiceSession, { state: reviewConfig })}
          >
            Practice Mistakes
          </Button>
        ) : null}
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
