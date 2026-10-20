import { Link } from 'react-router';
import { APP_NAME } from '../../app/constants';
import { ROUTES } from '../../app/routes';
import Navigation from './Navigation';
import styles from './Header.module.css';

/** Site header with the application title (linking home) and main navigation. */
function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to={ROUTES.home} className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            <span className={styles.plus}>+</span>
            <span className={styles.minus}>−</span>
            <span className={styles.times}>×</span>
            <span className={styles.divide}>÷</span>
          </span>
          {APP_NAME}
        </Link>
        <Navigation />
      </div>
    </header>
  );
}

export default Header;
