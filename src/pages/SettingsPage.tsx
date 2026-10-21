import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppData } from '../app/AppDataContext';
import { ROUTES, type HomePageState } from '../app/routes';
import { Button } from '../components/common/Button';
import ChoiceTile from '../components/common/ChoiceTile';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ToggleSwitch from '../components/common/ToggleSwitch';
import PageContainer from '../components/layout/PageContainer';
import DifficultySelector from '../components/setup/DifficultySelector';
import OperationSelector from '../components/setup/OperationSelector';
import SessionLengthSelector from '../components/setup/SessionLengthSelector';
import SetupFieldset from '../components/setup/SetupFieldset';
import type { AppSettings, MathOperation } from '../types';
import styles from './SettingsPage.module.css';

/** Choices offered for how many similar questions master a mistake. */
const MASTERY_OPTIONS = [2, 3, 4, 5] as const;

/**
 * Application-wide preferences (specification section 6.7). Every change is
 * saved as soon as it is made.
 */
function SettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSettings, clearAllData } = useAppData();
  const masteryGroupName = useId();
  const [statusMessage, setStatusMessage] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  // Shown while no operation is selected; the saved default stays unchanged.
  const [operationsDraft, setOperationsDraft] = useState<MathOperation[]>(
    settings.defaultOperations,
  );

  function save(changes: Partial<AppSettings>) {
    updateSettings(changes);
    setStatusMessage('Your settings were saved.');
  }

  function handleOperationsChange(operations: MathOperation[]) {
    setOperationsDraft(operations);
    if (operations.length > 0) {
      save({ defaultOperations: operations });
    } else {
      setStatusMessage('Pick at least one kind of problem. Your last choice is still saved.');
    }
  }

  function handleClearAll() {
    clearAllData();
    const homeState: HomePageState = { notice: 'data-cleared' };
    navigate(ROUTES.home, { state: homeState });
  }

  return (
    <PageContainer title="Settings">
      <p className={styles.intro}>Changes are saved automatically.</p>
      <p role="status" aria-label="Settings updates" className={styles.status}>
        {statusMessage}
      </p>

      <section aria-labelledby="defaults-heading" className={styles.section}>
        <h2 id="defaults-heading">Practice defaults</h2>
        <p className={styles.sectionHint}>
          These are picked for you when you set up practice. You can still change them each time.
        </p>
        <OperationSelector
          legend="Default problems"
          hint="Pick one or more."
          legendSize="small"
          selected={operationsDraft}
          onChange={handleOperationsChange}
        />
        <DifficultySelector
          legend="Default level"
          legendSize="small"
          value={settings.defaultDifficulty}
          onChange={(defaultDifficulty) => save({ defaultDifficulty })}
        />
        <SessionLengthSelector
          legend="Default number of questions"
          legendSize="small"
          value={settings.defaultSessionLength}
          onChange={(defaultSessionLength) => save({ defaultSessionLength })}
        />
      </section>

      <section aria-labelledby="cards-heading" className={styles.section}>
        <h2 id="cards-heading">Cards</h2>
        <div className={styles.toggles}>
          <ToggleSwitch
            label="Card animation"
            description="Flip the card over. When off, the answer appears right away."
            checked={settings.cardAnimationsEnabled}
            onChange={(cardAnimationsEnabled) => save({ cardAnimationsEnabled })}
          />
          <ToggleSwitch
            label="Show explanations"
            description="Show a short explanation of the answer on the back of each card."
            checked={settings.showExplanations}
            onChange={(showExplanations) => save({ showExplanations })}
          />
          <ToggleSwitch
            label="Encouraging messages"
            description='Show a short message like "Nice work!" after each answer.'
            checked={settings.feedbackMessagesEnabled}
            onChange={(feedbackMessagesEnabled) => save({ feedbackMessagesEnabled })}
          />
          <ToggleSwitch
            label="Sound effects"
            description="Play a soft sound when a card flips and when you get it right."
            checked={settings.soundEffectsEnabled}
            onChange={(soundEffectsEnabled) => save({ soundEffectsEnabled })}
          />
        </div>
      </section>

      <section aria-labelledby="mistakes-heading" className={styles.section}>
        <h2 id="mistakes-heading">Mistake review</h2>
        <SetupFieldset
          legend="Questions to master a mistake"
          hint="How many similar questions to get right before a missed problem counts as learned."
          layout="compact"
          legendSize="small"
        >
          {MASTERY_OPTIONS.map((count) => (
            <ChoiceTile
              key={count}
              type="radio"
              name={masteryGroupName}
              value={String(count)}
              checked={settings.masteryThreshold === count}
              onChange={() => save({ masteryThreshold: count })}
              label={`${count} questions`}
              description={count === 3 ? 'Recommended' : undefined}
            />
          ))}
        </SetupFieldset>
      </section>

      <section aria-labelledby="clear-heading" className={styles.section}>
        <h2 id="clear-heading">Clear all data</h2>
        <p>
          Erase all practice history, statistics, mistakes, and settings from this browser, and
          start over as if the app were brand new.
        </p>
        <div>
          <Button variant="danger" onClick={() => setIsConfirmingClear(true)}>
            Clear All Application Data
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={isConfirmingClear}
        title="Clear all application data?"
        message={
          <>
            <p>
              This permanently erases <strong>everything</strong> saved in this browser:
            </p>
            <ul>
              <li>all practice history and statistics</li>
              <li>all saved mistakes</li>
              <li>all of these settings</li>
            </ul>
            <p>This can't be undone.</p>
          </>
        }
        confirmLabel="Erase All Data"
        cancelLabel="Keep My Data"
        tone="danger"
        onConfirm={handleClearAll}
        onCancel={() => setIsConfirmingClear(false)}
      />
    </PageContainer>
  );
}

export default SettingsPage;
