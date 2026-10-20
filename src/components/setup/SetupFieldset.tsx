import { useId, type ReactNode } from 'react';
import styles from './SetupFieldset.module.css';

interface SetupFieldsetProps {
  /** The group's heading, announced when a control inside it receives focus. */
  legend: string;
  /** Short instructions shown under the legend. */
  hint?: string;
  /** Optional control shown beside the hint, such as a "Select all" button. */
  action?: ReactNode;
  /** `wide` for tiles with descriptions, `compact` for short options. */
  layout?: 'wide' | 'compact';
  children: ReactNode;
}

/** A labeled group of setup choices laid out as a responsive grid of tiles. */
function SetupFieldset({ legend, hint, action, layout = 'wide', children }: SetupFieldsetProps) {
  const hintId = useId();

  return (
    <fieldset className={styles.fieldset} aria-describedby={hint ? hintId : undefined}>
      <legend className={styles.legend}>{legend}</legend>
      {hint || action ? (
        <div className={styles.intro}>
          {hint ? (
            <p id={hintId} className={styles.hint}>
              {hint}
            </p>
          ) : null}
          {action}
        </div>
      ) : null}
      <div className={`${styles.options} ${styles[layout]}`}>{children}</div>
    </fieldset>
  );
}

export default SetupFieldset;
