import { useId } from 'react';
import { OPERATION_DETAILS } from '../../constants/practiceOptions';
import { MATH_OPERATIONS, type MathOperation } from '../../types';
import { Button } from '../common/Button';
import ChoiceTile from '../common/ChoiceTile';
import OperationSymbol from '../common/OperationSymbol';
import SetupFieldset from './SetupFieldset';

interface OperationSelectorProps {
  selected: readonly MathOperation[];
  legend?: string;
  hint?: string;
  legendSize?: 'large' | 'small';
  /** Always called with operations in MATH_OPERATIONS order. */
  onChange: (operations: MathOperation[]) => void;
}

/** Pick one or more operations. Choosing several mixes them in one session. */
function OperationSelector({
  selected,
  legend = 'Choose your problems',
  hint = 'Pick one or more. Pick a few to mix them up!',
  legendSize,
  onChange,
}: OperationSelectorProps) {
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
      legend={legend}
      hint={hint}
      legendSize={legendSize}
      action={
        <Button variant="secondary" onClick={handleToggleAll}>
          {allSelected ? 'Clear all' : 'Select all'}
        </Button>
      }
    >
      {MATH_OPERATIONS.map((operation) => {
        const { label } = OPERATION_DETAILS[operation];
        return (
          <ChoiceTile
            key={operation}
            type="checkbox"
            name={groupName}
            value={operation}
            checked={selected.includes(operation)}
            onChange={(checked) => handleToggle(operation, checked)}
            label={label}
            icon={<OperationSymbol operation={operation} />}
          />
        );
      })}
    </SetupFieldset>
  );
}

export default OperationSelector;
