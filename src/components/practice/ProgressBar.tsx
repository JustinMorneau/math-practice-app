import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number;
  max: number;
  /** Names the bar for screen readers, e.g. "Session progress". */
  label: string;
  /** Spoken value, e.g. "3 of 10 questions answered". */
  valueText: string;
}

/** A chunky progress bar exposed to assistive technology as a `progressbar`. */
function ProgressBar({ value, max, label, valueText }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );
}

export default ProgressBar;
