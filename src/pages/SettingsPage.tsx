import { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import { ROUTES } from '../app/routes';

/** Placeholder until Phase 11 builds the settings controls. */
function SettingsPage() {
  return (
    <PageContainer title="Settings">
      <EmptyState
        message="Settings are coming soon."
        action={
          <ButtonLink to={ROUTES.home} variant="secondary">
            Back to Home
          </ButtonLink>
        }
      />
    </PageContainer>
  );
}

export default SettingsPage;
