import { useId } from 'react';
import { OPERATION_DETAILS } from '../../constants/practiceOptions';
import { MATH_OPERATIONS, type MathOperation } from '../../types';
import { Button } from '../common/Button';
import ChoiceTile from '../common/ChoiceTile';
import SetupFieldset from './SetupFieldset';
import styles from './OperationSelector.module.css';

interface OperationSelectorProps {
  selected: readonly MathOperation[];
  /** Always called with operations in MATH_OPERATIONS order. */
  onChange: (operations: MathOperation[]) => void;
}

/** Pick one or more operations. Choosing several mixes them in one session. */
function OperationSelector({ selected, onChange }: OperationSelectorProps) {
  const groupName = useId();
  const allSelected = MATH_OPERATIONS.every((operation) => selected.includes(operation));

  function handleToggle(toggled: MathOperation, checked: boolean) {
    onChange(
      MATH_OPERATIONS.filter((operation) =>
        operation === toggled ? checked : selected.includes(operation),
      ),
    );
  }

  function handleToggleAll() {
    onChange(allSelected ? [] : [...MATH_OPERATIONS]);
  }

  return (
    <SetupFieldset
      legend="Choose your problems"
      hint="Pick one or more. Pick a few to mix them up!"
      action={
        <Button variant="secondary" onClick={handleToggleAll}>
          {allSelected ? 'Clear all' : 'Select all'}
        </Button>
      }
    >
      {MATH_OPERATIONS.map((operation) => {
        const { label, symbol } = OPERATION_DETAILS[operation];
        return (
          <ChoiceTile
            key={operation}
            type="checkbox"
            name={groupName}
            value={operation}
            checked={selected.includes(operation)}
            onChange={(checked) => handleToggle(operation, checked)}
            label={label}
            icon={<span className={`${styles.symbol} ${styles[operation]}`}>{symbol}</span>}
          />
        );
      })}
    </SetupFieldset>
  );
}

export default OperationSelector;
