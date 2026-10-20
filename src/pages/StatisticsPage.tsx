import { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import { ROUTES } from '../app/routes';

/** Placeholder until Phase 10 builds the statistics views. */
function StatisticsPage() {
  return (
    <PageContainer title="Statistics">
      <EmptyState
        message="Your practice statistics are coming soon."
        action={
          <ButtonLink to={ROUTES.home} variant="secondary">
            Back to Home
          </ButtonLink>
        }
      />
    </PageContainer>
  );
}

export default StatisticsPage;
