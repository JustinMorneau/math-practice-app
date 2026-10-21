import { Outlet } from 'react-router';
import Header from './Header';
import StorageWarning from './StorageWarning';
import styles from './AppLayout.module.css';

/**
 * Shared shell for every page: skip link, header with navigation, any
 * storage warning, and the main content area.
 */
function AppLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header />
      <StorageWarning />
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}

export default AppLayout;
