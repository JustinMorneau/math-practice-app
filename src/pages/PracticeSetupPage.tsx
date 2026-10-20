import { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import { ROUTES } from '../app/routes';

/** Placeholder until Phase 3 builds the setup controls. */
function PracticeSetupPage() {
  return (
    <PageContainer title="Practice Setup">
      <EmptyState
        message="Choosing your problems is coming soon."
        action={
          <ButtonLink to={ROUTES.home} variant="secondary">
            Back to Home
          </ButtonLink>
        }
      />
    </PageContainer>
  );
}

export default PracticeSetupPage;
