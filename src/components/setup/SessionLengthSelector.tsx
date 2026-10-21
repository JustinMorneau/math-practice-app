import { useId } from 'react';
import { SESSION_LENGTH_OPTIONS } from '../../constants/practiceOptions';
import type { SessionLength } from '../../types';
import ChoiceTile from '../common/ChoiceTile';
import SetupFieldset from './SetupFieldset';

interface SessionLengthSelectorProps {
  value: SessionLength;
  legend?: string;
  legendSize?: 'large' | 'small';
  onChange: (length: SessionLength) => void;
}

/** Pick how many questions to answer, or continuous practice. */
function SessionLengthSelector({
  value,
  legend = 'How many questions?',
  legendSize,
  onChange,
}: SessionLengthSelectorProps) {
  const groupName = useId();

  return (
    <SetupFieldset legend={legend} legendSize={legendSize} layout="compact">
      {SESSION_LENGTH_OPTIONS.map((option) => (
        <ChoiceTile
          key={option.value}
          type="radio"
          name={groupName}
          value={String(option.value)}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
          label={option.label}
          description={option.description}
        />
      ))}
    </SetupFieldset>
  );
}

export default SessionLengthSelector;
