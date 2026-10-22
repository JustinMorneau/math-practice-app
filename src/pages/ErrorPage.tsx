import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { ROUTES } from '../app/routes';
import { ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import styles from './ErrorPage.module.css';

interface ErrorPageProps {
  /** True when the whole layout failed, so this page provides its own main area. */
  standalone?: boolean;
}

/**
 * A friendly message for unexpected errors (specification section 17). It
 * never shows technical details or stack traces; in development the error
 * is logged to the console instead. "Go to Home" reloads the app, which
 * clears whatever went wrong while keeping saved progress.
 */
function ErrorPage({ standalone = false }: ErrorPageProps) {
  const error = useRouteError();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error('Unexpected error while showing a page:', error);
    }
  }, [error]);

  const content = (
    <PageContainer title="Something went wrong">
      <EmptyState
        message="Oops! This page had a problem. Your saved progress is safe."
        action={
          <ButtonLink to={ROUTES.home} reloadDocument>
            Go to Home
          </ButtonLink>
        }
      />
    </PageContainer>
  );

  return standalone ? <main className={styles.standalone}>{content}</main> : content;
}

export default ErrorPage;
