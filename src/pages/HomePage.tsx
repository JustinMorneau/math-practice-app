import { useLocation } from 'react-router';
import { ButtonLink } from '../components/common/Button';
import PageContainer from '../components/layout/PageContainer';
import { APP_NAME } from '../app/constants';
import { ROUTES, type HomePageState } from '../app/routes';
import styles from './HomePage.module.css';

const OPERATION_BLOCKS = [
  { symbol: '+', className: styles.addition },
  { symbol: '−', className: styles.subtraction },
  { symbol: '×', className: styles.multiplication },
  { symbol: '÷', className: styles.division },
];

/** Landing page: a short welcome and the three main ways into the app. */
function HomePage() {
  const homeState = useLocation().state as HomePageState | null;

  return (
    <PageContainer title={APP_NAME} showTitle={false}>
      {homeState?.notice === 'data-cleared' ? (
        <p className={styles.notice}>
          All app data was cleared, and the settings are back to how they started.
        </p>
      ) : null}
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.blocks} aria-hidden="true">
          {OPERATION_BLOCKS.map(({ symbol, className }) => (
            <span key={symbol} className={`${styles.block} ${className}`}>
              {symbol}
            </span>
          ))}
        </div>
        <h1 id="home-title" className={styles.title}>
          Welcome to {APP_NAME}!
        </h1>
        <p className={styles.welcome}>
          Ready to practice? Pick an answer, flip the card to check it, and see how much you know.
        </p>
      </section>

      <div className={styles.actions}>
        <ButtonLink to={ROUTES.practiceSetup} size="large">
          Start Practice
        </ButtonLink>
        <ButtonLink to={ROUTES.statistics} variant="secondary">
          View Statistics
        </ButtonLink>
        <ButtonLink to={ROUTES.settings} variant="secondary">
          Settings
        </ButtonLink>
      </div>
    </PageContainer>
  );
}

export default HomePage;
