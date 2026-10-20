import { NavLink } from 'react-router';
import { ROUTES } from '../../app/routes';
import styles from './Navigation.module.css';

const NAV_ITEMS = [
  { to: ROUTES.home, label: 'Home', end: true },
  { to: ROUTES.practiceSetup, label: 'Practice', end: false },
  { to: ROUTES.statistics, label: 'Statistics', end: false },
  { to: ROUTES.settings, label: 'Settings', end: false },
] as const;

/**
 * Main site navigation. NavLink sets aria-current="page" on the active link,
 * and the active style uses an underline and bold text, not just color.
 */
function Navigation() {
  return (
    <nav aria-label="Main">
      <ul className={styles.list}>
        {NAV_ITEMS.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navigation;
