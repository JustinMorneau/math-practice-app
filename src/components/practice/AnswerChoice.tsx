import type { Ref } from 'react';
import styles from './AnswerChoice.module.css';

interface AnswerChoiceProps {
  value: number;
  isSelected: boolean;
  /** True once the card is flipped, so the answer can no longer change. */
  disabled: boolean;
  onSelect: (value: number) => void;
  /** The number key (1–4) that also selects this answer. */
  shortcut?: number;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * One multiple-choice answer. It is a toggle button: `aria-pressed` tells
 * screen readers which answer is selected, and the selected answer shows a
 * check mark and a pressed look rather than relying on color. A small
 * number shows which key selects it; `aria-keyshortcuts` announces the same.
 */
function AnswerChoice({ value, isSelected, disabled, onSelect, shortcut, ref }: AnswerChoiceProps) {
  const className = isSelected ? `${styles.choice} ${styles.selected}` : styles.choice;

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      aria-pressed={isSelected}
      aria-keyshortcuts={shortcut === undefined ? undefined : String(shortcut)}
      disabled={disabled}
      onClick={() => onSelect(value)}
    >
      {shortcut === undefined ? null : (
        <span className={styles.shortcut} aria-hidden="true">
          {shortcut}
        </span>
      )}
      {value}
      {isSelected ? (
        <span className={styles.check} aria-hidden="true">
          ✓
        </span>
      ) : null}
    </button>
  );
}

export default AnswerChoice;
