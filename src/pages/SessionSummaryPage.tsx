import { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import { ROUTES } from '../app/routes';

/** Placeholder until Phase 8 builds the session summary. */
function SessionSummaryPage() {
  return (
    <PageContainer title="Session Summary">
      <EmptyState
        message="Your session results will show up here soon."
        action={
          <ButtonLink to={ROUTES.home} variant="secondary">
            Back to Home
          </ButtonLink>
        }
      />
    </PageContainer>
  );
}

export default SessionSummaryPage;
