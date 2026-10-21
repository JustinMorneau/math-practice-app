import type { ReactNode } from 'react';
import { getAccuracy } from '../../services/statisticsService';
import type { OperationStatistics } from '../../types';
import styles from './PerformanceCard.module.css';

interface PerformanceCardProps {
  title: string;
  /** Extra context under the title, such as a level's number range. */
  subtitle?: string;
  /** Decorative content beside the title, such as an operation symbol. */
  icon?: ReactNode;
  counts: OperationStatistics;
}

/** Attempted, right, to-practice, and accuracy for one operation or level. */
function PerformanceCard({ title, subtitle, icon, counts }: PerformanceCardProps) {
  const hasPracticed = counts.attempted > 0;
  const accuracy = getAccuracy(counts);

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        {icon ? (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <div>
          <h3 className={styles.title}>{title}</h3>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
      </header>

      {hasPracticed ? (
        <>
          <p className={styles.accuracy}>
            {accuracy}% <span className={styles.accuracyLabel}>accuracy</span>
          </p>
          <div className={styles.meter} aria-hidden="true">
            <div className={styles.meterFill} style={{ width: `${accuracy}%` }} />
          </div>
          <dl className={styles.counts}>
            <div>
              <dt>Answered</dt>
              <dd>{counts.attempted}</dd>
            </div>
            <div>
              <dt>Got right</dt>
              <dd>{counts.correct}</dd>
            </div>
            <div>
              <dt>To practice</dt>
              <dd>{counts.incorrect}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className={styles.empty}>Not practiced yet</p>
      )}
    </article>
  );
}

export default PerformanceCard;
