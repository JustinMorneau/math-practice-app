import { useLocation } from 'react-router';
import { ROUTES } from '../app/routes';
import { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import { formatDifficulty, formatOperationList, formatSessionLength } from '../utils/format';
import { isPracticeConfig } from '../utils/validation';
import styles from './PracticePage.module.css';

/**
 * Placeholder until Phase 7 builds the practice session. For now it confirms
 * the setup page passed a valid configuration, and sends the student back to
 * setup when it didn't (for example, after typing the URL directly).
 */
function PracticePage() {
  const { state } = useLocation();

  if (!isPracticeConfig(state)) {
    return (
      <PageContainer title="Practice">
        <EmptyState
          message="Let's set up your practice first."
          action={<ButtonLink to={ROUTES.practiceSetup}>Set Up Practice</ButtonLink>}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Practice">
      <dl className={styles.summary} aria-label="Your practice setup">
        <div>
          <dt>Problems</dt>
          <dd>{formatOperationList(state.operations)}</dd>
        </div>
        <div>
          <dt>Level</dt>
          <dd>{formatDifficulty(state.difficulty)}</dd>
        </div>
        <div>
          <dt>Questions</dt>
          <dd>{formatSessionLength(state.sessionLength)}</dd>
        </div>
      </dl>
      <EmptyState
        message="Practice cards are coming soon."
        action={
          <ButtonLink to={ROUTES.practiceSetup} variant="secondary">
            Change Setup
          </ButtonLink>
        }
      />
    </PageContainer>
  );
}

export default PracticePage;
