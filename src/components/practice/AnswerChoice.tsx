import styles from './AnswerChoice.module.css';

interface AnswerChoiceProps {
  value: number;
  isSelected: boolean;
  /** True once the card is flipped, so the answer can no longer change. */
  disabled: boolean;
  onSelect: (value: number) => void;
}

/**
 * One multiple-choice answer. It is a toggle button: `aria-pressed` tells
 * screen readers which answer is selected, and the selected answer shows a
 * check mark and a pressed look rather than relying on color.
 */
function AnswerChoice({ value, isSelected, disabled, onSelect }: AnswerChoiceProps) {
  const className = isSelected ? `${styles.choice} ${styles.selected}` : styles.choice;

  return (
    <button
      type="button"
      className={className}
      aria-pressed={isSelected}
      disabled={disabled}
      onClick={() => onSelect(value)}
    >
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
