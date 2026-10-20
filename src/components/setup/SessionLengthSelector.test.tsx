import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SessionLengthSelector from './SessionLengthSelector';

describe('SessionLengthSelector', () => {
  it('offers 5, 10, and 20 questions and continuous practice', () => {
    render(<SessionLengthSelector value={10} onChange={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'How many questions?' })).toBeInTheDocument();
    for (const name of ['5 questions', '10 questions', '20 questions', 'Keep going']) {
      expect(screen.getByRole('radio', { name })).toBeInTheDocument();
    }
  });

  it('marks the selected length as checked', () => {
    render(<SessionLengthSelector value={20} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: '20 questions' })).toBeChecked();
  });

  it('reports a numeric length', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SessionLengthSelector value={10} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: '5 questions' }));

    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('reports continuous practice', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SessionLengthSelector value={10} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Keep going' }));

    expect(onChange).toHaveBeenCalledWith('continuous');
  });
});
