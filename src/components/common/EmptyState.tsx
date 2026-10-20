import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  /** What is missing and what the user can do about it. */
  message: ReactNode;
  /** Optional call to action, usually a Button or ButtonLink. */
  action?: ReactNode;
}

/** A friendly placeholder for screens or sections with nothing to show yet. */
function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.message}>{message}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export default EmptyState;
