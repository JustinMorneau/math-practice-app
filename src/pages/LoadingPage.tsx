import styles from './LoadingPage.module.css';

/** Shown briefly while a page's code downloads when the app is opened directly on it. */
function LoadingPage() {
  return (
    <main className={styles.loading}>
      <p role="status">Loading…</p>
    </main>
  );
}

export default LoadingPage;
