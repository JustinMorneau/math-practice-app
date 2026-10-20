import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../app/routes';
import { Button } from '../components/common/Button';
import PageContainer from '../components/layout/PageContainer';
import DifficultySelector from '../components/setup/DifficultySelector';
import OperationSelector from '../components/setup/OperationSelector';
import SessionLengthSelector from '../components/setup/SessionLengthSelector';
import { DEFAULT_PRACTICE_CONFIG } from '../constants/practiceOptions';
import type { PracticeConfig } from '../types';
import styles from './PracticeSetupPage.module.css';

/**
 * Lets the student choose operations, difficulty, and session length, then
 * starts a session. The chosen PracticeConfig is passed to the practice page
 * as router state; later phases move it into app-wide state and storage.
 */
function PracticeSetupPage() {
  const navigate = useNavigate();
  const messageId = useId();
  const [config, setConfig] = useState<PracticeConfig>(DEFAULT_PRACTICE_CONFIG);

  // A difficulty and session length are always selected, so only the
  // operations can be missing.
  const canStart = config.operations.length > 0;

  function handleStart() {
    if (canStart) {
      navigate(ROUTES.practiceSession, { state: config });
    }
  }

  return (
    <PageContainer title="Practice Setup">
      <p className={styles.intro}>Choose what to practice, then press Start Session.</p>

      <div className={styles.sections}>
        <OperationSelector
          selected={config.operations}
          onChange={(operations) => setConfig((current) => ({ ...current, operations }))}
        />
        <DifficultySelector
          value={config.difficulty}
          onChange={(difficulty) => setConfig((current) => ({ ...current, difficulty }))}
        />
        <SessionLengthSelector
          value={config.sessionLength}
          onChange={(sessionLength) => setConfig((current) => ({ ...current, sessionLength }))}
        />
      </div>

      <div className={styles.footer}>
        <Button
          size="large"
          onClick={handleStart}
          disabled={!canStart}
          aria-describedby={canStart ? undefined : messageId}
        >
          Start Session
        </Button>
        {/* Always rendered so screen readers announce the message when it appears */}
        <p id={messageId} role="status" className={styles.message}>
          {canStart ? null : (
            <>
              <span className={styles.messageIcon} aria-hidden="true">
                !
              </span>
              Pick at least one kind of problem to start.
            </>
          )}
        </p>
      </div>
    </PageContainer>
  );
}

export default PracticeSetupPage;
