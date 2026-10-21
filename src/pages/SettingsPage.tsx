import { useId, useState } from 'react';
import { useAppData } from '../app/AppDataContext';
import ChoiceTile from '../components/common/ChoiceTile';
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
  const { settings, updateSettings } = useAppData();
  const masteryGroupName = useId();
  const [statusMessage, setStatusMessage] = useState('');
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

    </PageContainer>
  );
}

export default SettingsPage;
