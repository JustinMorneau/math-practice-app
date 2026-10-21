import { useState } from 'react';
import { useAppData } from '../app/AppDataContext';
import { ROUTES } from '../app/routes';
import { Button, ButtonLink } from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import OperationSymbol from '../components/common/OperationSymbol';
import PageContainer from '../components/layout/PageContainer';
import PerformanceCard from '../components/statistics/PerformanceCard';
import RecentSessions from '../components/statistics/RecentSessions';
import StatGrid from '../components/statistics/StatGrid';
import { DIFFICULTY_DETAILS, OPERATION_DETAILS } from '../constants/practiceOptions';
import { loadRecentSessions } from '../services/historyStorage';
import { getAccuracy } from '../services/statisticsService';
import { clearPracticeHistory, loadStatistics } from '../services/statisticsStorage';
import type { StorageService } from '../services/storageService';
import { DIFFICULTY_LEVELS, MATH_OPERATIONS } from '../types';
import styles from './StatisticsPage.module.css';

/** How many recent sessions to list. */
const RECENT_SESSION_COUNT = 10;

function loadPageData(storage: StorageService) {
  return {
    statistics: loadStatistics(storage),
    recentSessions: loadRecentSessions(RECENT_SESSION_COUNT, storage),
  };
}

/** Overall, per-operation, and per-level performance plus recent sessions (specification 6.6). */
function StatisticsPage() {
  const { storage, reportStorageResult } = useAppData();
  const [{ statistics, recentSessions }, setData] = useState(() => loadPageData(storage));
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const hasHistory = statistics.attempted > 0 || recentSessions.length > 0;

  function handleReset() {
    const result = clearPracticeHistory(storage);
    reportStorageResult(result);
    setIsConfirmingReset(false);
    setData(loadPageData(storage));
    setStatusMessage(
      result.ok
        ? 'Your practice history and statistics were erased.'
        : 'Something went wrong, so not everything could be erased.',
    );
  }

  return (
    <PageContainer title="Statistics">
      <p role="status" aria-label="Statistics updates" className={styles.status}>{statusMessage}</p>

      {hasHistory ? (
        <>
          <section aria-labelledby="overall-heading" className={styles.section}>
            <h2 id="overall-heading">Overall</h2>
            <StatGrid
              items={[
                { label: 'Accuracy', value: `${getAccuracy(statistics)}%`, highlight: true },
                { label: 'Answered', value: statistics.attempted },
                { label: 'Got right', value: statistics.correct },
                { label: 'To practice', value: statistics.incorrect },
              ]}
            />
          </section>

          <section aria-labelledby="operation-heading" className={styles.section}>
            <h2 id="operation-heading">By operation</h2>
            <div className={styles.cards}>
              {MATH_OPERATIONS.map((operation) => (
                <PerformanceCard
                  key={operation}
                  title={OPERATION_DETAILS[operation].label}
                  icon={<OperationSymbol operation={operation} />}
                  counts={statistics.byOperation[operation]}
                />
              ))}
            </div>
          </section>

          <section aria-labelledby="level-heading" className={styles.section}>
            <h2 id="level-heading">By level</h2>
            <div className={styles.cards}>
              {DIFFICULTY_LEVELS.map((level) => (
                <PerformanceCard
                  key={level}
                  title={`Level ${level}: ${DIFFICULTY_DETAILS[level].name}`}
                  subtitle={DIFFICULTY_DETAILS[level].description}
                  counts={statistics.byDifficulty[level]}
                />
              ))}
            </div>
          </section>

          <section aria-labelledby="recent-heading" className={styles.section}>
            <h2 id="recent-heading">Recent sessions</h2>
            {recentSessions.length > 0 ? (
              <RecentSessions sessions={recentSessions} />
            ) : (
              <p>No sessions to show yet.</p>
            )}
          </section>

          <section aria-labelledby="reset-heading" className={styles.section}>
            <h2 id="reset-heading">Start fresh</h2>
            <p>
              Your progress is saved only in this browser. Clearing your browser data erases it.
            </p>
            <div>
              <Button variant="danger" onClick={() => setIsConfirmingReset(true)}>
                Reset Statistics
              </Button>
            </div>
          </section>
        </>
      ) : (
        <EmptyState
          message="No practice yet! Answer a few questions and your progress will show up here."
          action={<ButtonLink to={ROUTES.practiceSetup}>Start Practice</ButtonLink>}
        />
      )}

      <ConfirmDialog
        open={isConfirmingReset}
        title="Reset statistics?"
        message={
          <>
            <p>Are you sure you want to erase all practice history and statistics?</p>
            <p>This can't be undone. Your settings will be kept.</p>
          </>
        }
        confirmLabel="Erase Everything"
        cancelLabel="Keep My Progress"
        tone="danger"
        onConfirm={handleReset}
        onCancel={() => setIsConfirmingReset(false)}
      />
    </PageContainer>
  );
}

export default StatisticsPage;
