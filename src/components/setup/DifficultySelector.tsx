import { useId } from 'react';
import { DIFFICULTY_DETAILS } from '../../constants/practiceOptions';
import { DIFFICULTY_LEVELS, type DifficultyLevel } from '../../types';
import ChoiceTile from '../common/ChoiceTile';
import SetupFieldset from './SetupFieldset';

interface DifficultySelectorProps {
  value: DifficultyLevel;
  onChange: (difficulty: DifficultyLevel) => void;
}

/** Pick exactly one difficulty level. Each option describes its number range. */
function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  const groupName = useId();

  return (
    <SetupFieldset legend="Choose your level">
      {DIFFICULTY_LEVELS.map((level) => {
        const { name, description } = DIFFICULTY_DETAILS[level];
        return (
          <ChoiceTile
            key={level}
            type="radio"
            name={groupName}
            value={String(level)}
            checked={value === level}
            onChange={() => onChange(level)}
            label={name}
            description={description}
          />
        );
      })}
    </SetupFieldset>
  );
}

export default DifficultySelector;
