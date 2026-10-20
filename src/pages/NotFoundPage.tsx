import { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import { ROUTES } from '../app/routes';

/** Shown for any URL that doesn't match a route. */
function NotFoundPage() {
  return (
    <PageContainer title="Page not found">
      <EmptyState
        message="We couldn't find that page. Let's head back and keep practicing!"
        action={<ButtonLink to={ROUTES.home}>Back to Home</ButtonLink>}
      />
    </PageContainer>
  );
}

export default NotFoundPage;
