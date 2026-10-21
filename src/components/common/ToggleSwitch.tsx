import { useId } from 'react';
import styles from './ToggleSwitch.module.css';

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * An on/off setting. It is a native checkbox with `role="switch"`, so
 * screen readers announce it as "on" or "off", and Space toggles it. The
 * state is shown by the knob position and an On/Off label, not color alone.
 */
function ToggleSwitch({ label, description, checked, onChange }: ToggleSwitchProps) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <label className={styles.row}>
      <span className={styles.text}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        {description ? (
          <span id={descriptionId} className={styles.description}>
            {description}
          </span>
        ) : null}
      </span>
      <input
        className={`visually-hidden ${styles.input}`}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
      />
      <span className={styles.switch} aria-hidden="true">
        <span className={styles.state}>{checked ? 'On' : 'Off'}</span>
        <span className={styles.track}>
          <span className={styles.knob} />
        </span>
      </span>
    </label>
  );
}

export default ToggleSwitch;
