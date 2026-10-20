import { useId, type ReactNode } from 'react';
import styles from './ChoiceTile.module.css';

interface ChoiceTileProps {
  /** `checkbox` for pick-many groups, `radio` for pick-one groups. */
  type: 'checkbox' | 'radio';
  /** Shared by every tile in the same group. */
  name: string;
  value: string;
  checked: boolean;
  /** Called with the input's new checked state. Radios only report `true`. */
  onChange: (checked: boolean) => void;
  /** The control's accessible name. */
  label: string;
  /** Extra detail, exposed to screen readers as the control's description. */
  description?: string;
  /** Decorative content shown before the label, such as an operation symbol. */
  icon?: ReactNode;
}

/**
 * A native checkbox or radio styled as a large, tappable tile.
 *
 * The real input stays in the page (visually hidden) so keyboard behavior
 * and screen-reader announcements work as normal: Tab to focus, Space to
 * toggle, and arrow keys to move between radios. The checked state is shown
 * with a ✓ or filled dot and a "pressed" tile, not by color alone.
 */
function ChoiceTile({
  type,
  name,
  value,
  checked,
  onChange,
  label,
  description,
  icon,
}: ChoiceTileProps) {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <label className={styles.tile}>
      <input
        className={`visually-hidden ${styles.input}`}
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
      />
      <span className={styles.indicator} aria-hidden="true" />
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
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
    </label>
  );
}

export default ChoiceTile;
