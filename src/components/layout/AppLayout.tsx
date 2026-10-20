import { Outlet } from 'react-router';
import Header from './Header';
import styles from './AppLayout.module.css';

/** Shared shell for every page: skip link, header with navigation, and main content area. */
function AppLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}

export default AppLayout;
