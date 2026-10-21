import type { ReactNode } from 'react';
import styles from './StatGrid.module.css';

export interface StatItem {
  label: string;
  value: ReactNode;
  /** Draws attention to the most important number, such as accuracy. */
  highlight?: boolean;
}

/**
 * Chunky stat tiles: 2 × 2 on phones, one row on wider screens. Built as a
 * description list, so each value is read together with its label.
 */
function StatGrid({ items }: { items: readonly StatItem[] }) {
  return (
    <dl className={styles.grid}>
      {items.map(({ label, value, highlight }) => (
        <div key={label} className={highlight ? `${styles.stat} ${styles.highlight}` : styles.stat}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default StatGrid;
