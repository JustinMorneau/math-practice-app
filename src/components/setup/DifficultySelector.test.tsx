import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DifficultySelector from './DifficultySelector';

describe('DifficultySelector', () => {
  it('shows the four levels as radio buttons in a labeled group', () => {
    render(<DifficultySelector value={1} onChange={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Choose your level' })).toBeInTheDocument();
    const values = screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'));
    expect(values).toEqual(['1', '2', '3', '4']);
    for (const name of ['Beginner', 'Easy', 'Intermediate', 'Advanced']) {
      expect(screen.getByRole('radio', { name })).toBeInTheDocument();
    }
  });

  it('marks only the selected level as checked', () => {
    render(<DifficultySelector value={3} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'Intermediate' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Beginner' })).not.toBeChecked();
  });

  it('gives each level a short description', () => {
    render(<DifficultySelector value={1} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'Beginner' })).toHaveAccessibleDescription(
      'Numbers up to 10',
    );
  });

  it('reports the chosen level', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DifficultySelector value={1} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Advanced' }));

    expect(onChange).toHaveBeenCalledWith(4);
  });
});
