import { useId, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAppData } from '../app/AppDataContext';
import { ROUTES, type PracticeSetupState } from '../app/routes';
import { Button } from '../components/common/Button';
import ChoiceTile from '../components/common/ChoiceTile';
import PageContainer from '../components/layout/PageContainer';
import DifficultySelector from '../components/setup/DifficultySelector';
import OperationSelector from '../components/setup/OperationSelector';
import SessionLengthSelector from '../components/setup/SessionLengthSelector';
import SetupFieldset from '../components/setup/SetupFieldset';
import { getActivePatterns, getPatternOperations } from '../services/mistakeReview';
import { loadMistakePatterns } from '../services/mistakeStorage';
import type { PracticeConfig, PracticeMode } from '../types';
import { isPracticeConfig } from '../utils/validation';
import styles from './PracticeSetupPage.module.css';

/**
 * Lets the student choose operations, difficulty, and session length, then
 * starts a session by passing the chosen PracticeConfig to the practice page
 * as router state.
 *
 * Opens with the previous choices when router state carries a `config` (as
 * when returning from a session summary), and with the student's saved
 * default settings otherwise. Changes here apply to this session only.
 */
/** "1 mistake" or "4 mistakes". */
function formatMistakeCount(count: number): string {
  return count === 1 ? '1 mistake' : `${count} mistakes`;
}

function PracticeSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, storage } = useAppData();
  const messageId = useId();
  const modeGroupName = useId();
  const [activeMistakes] = useState(() => getActivePatterns(loadMistakePatterns(storage).patterns));
  const hasMistakes = activeMistakes.length > 0;
  const setupState = location.state as PracticeSetupState | null;
  const showMissingSessionNotice = setupState?.notice === 'session-missing';
  // Start from the previous session's choices when returning from a summary.
  const previousConfig = setupState?.config;
  const [config, setConfig] = useState<PracticeConfig>(() =>
    isPracticeConfig(previousConfig)
      ? previousConfig
      : {
          operations: settings.defaultOperations,
          difficulty: settings.defaultDifficulty,
          sessionLength: settings.defaultSessionLength,
        },
  );

  const [mode, setMode] = useState<PracticeMode>(() =>
    previousConfig?.mode === 'mistake-review' && hasMistakes ? 'mistake-review' : 'regular',
  );
  const isReview = mode === 'mistake-review';

  // A difficulty and session length are always selected, so only the
  // operations (or, for review, the mistakes) can be missing.
  const canStart = isReview ? hasMistakes : config.operations.length > 0;

  function handleStart() {
    if (!canStart) {
      return;
    }
    // Review questions come from the student's mistakes, so the session
    // records the operations those mistakes use.
    const sessionConfig: PracticeConfig = isReview
      ? { ...config, operations: getPatternOperations(activeMistakes), mode }
      : { ...config, mode };
    navigate(ROUTES.practiceSession, { state: sessionConfig });
  }

  return (
    <PageContainer title="Practice Setup">
      {showMissingSessionNotice ? (
        <p className={styles.notice}>Let's set up your practice first.</p>
      ) : null}
      <p className={styles.intro}>Choose what to practice, then press Start Session.</p>

      <div className={styles.sections}>
        <SetupFieldset legend="What do you want to practice?">
          <ChoiceTile
            type="radio"
            name={modeGroupName}
            value="regular"
            checked={!isReview}
            onChange={() => setMode('regular')}
            label="Regular practice"
            description="New questions from the problems and level you pick"
          />
          <ChoiceTile
            type="radio"
            name={modeGroupName}
            value="mistake-review"
            checked={isReview}
            onChange={() => setMode('mistake-review')}
            disabled={!hasMistakes}
            label="Review my mistakes"
            description={
              hasMistakes
                ? `${formatMistakeCount(activeMistakes.length)} to review`
                : 'No mistakes to review yet. Problems you mark "I Got It Wrong" will show up here.'
            }
          />
        </SetupFieldset>
        {isReview ? (
          <p className={styles.reviewNote}>
            Review mixes questions similar to the problems you missed, at the level you missed them.
          </p>
        ) : (
          <>
            <OperationSelector
              selected={config.operations}
              onChange={(operations) => setConfig((current) => ({ ...current, operations }))}
            />
            <DifficultySelector
              value={config.difficulty}
              onChange={(difficulty) => setConfig((current) => ({ ...current, difficulty }))}
            />
          </>
        )}
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
