import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { NavLink, useLocation } from 'react-router';
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
 *
 * On narrow screens the links collapse behind a Menu button (specification
 * section 15), which reports its state with aria-expanded. The menu closes
 * after navigating or when Escape is pressed.
 */
function Navigation() {
  const { pathname } = useLocation();
  const listId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Close the menu whenever the page changes.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && isOpen) {
      setIsOpen(false);
      menuButtonRef.current?.focus();
    }
  }

  return (
    <nav aria-label="Main" className={styles.nav} onKeyDown={handleKeyDown}>
      <button
        ref={menuButtonRef}
        type="button"
        className={styles.menuButton}
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={styles.menuIcon} aria-hidden="true" />
        Menu
      </button>
      <ul id={listId} className={isOpen ? `${styles.list} ${styles.open}` : styles.list}>
        {NAV_ITEMS.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
              onClick={() => setIsOpen(false)}
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
