import { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import { ROUTES } from '../app/routes';

/** Placeholder until Phase 7 builds the practice session. */
function PracticePage() {
  return (
    <PageContainer title="Practice">
      <EmptyState
        message="Practice cards are coming soon."
        action={
          <ButtonLink to={ROUTES.home} variant="secondary">
            Back to Home
          </ButtonLink>
        }
      />
    </PageContainer>
  );
}

export default PracticePage;
