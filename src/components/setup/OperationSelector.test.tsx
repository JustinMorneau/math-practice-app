import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { MathOperation } from '../../types';
import OperationSelector from './OperationSelector';

/** Holds the selection in state so tests can click through real interactions. */
function StatefulOperationSelector({ initial }: { initial: MathOperation[] }) {
  const [selected, setSelected] = useState(initial);
  return <OperationSelector selected={selected} onChange={setSelected} />;
}

describe('OperationSelector', () => {
  it('shows a checkbox for each operation inside a labeled group', () => {
    render(<OperationSelector selected={[]} onChange={vi.fn()} />);

    const group = screen.getByRole('group', { name: 'Choose your problems' });
    expect(group).toBeInTheDocument();
    for (const name of ['Addition', 'Subtraction', 'Multiplication', 'Division']) {
      expect(screen.getByRole('checkbox', { name })).toBeInTheDocument();
    }
  });

  it('reflects the selected operations', () => {
    render(<OperationSelector selected={['subtraction', 'division']} onChange={vi.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Addition' })).not.toBeChecked();
  });

  it('reports selections in a consistent order', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OperationSelector selected={['division']} onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Addition' }));

    expect(onChange).toHaveBeenCalledWith(['addition', 'division']);
  });

  it('allows more than one operation to be selected', async () => {
    const user = userEvent.setup();
    render(<StatefulOperationSelector initial={[]} />);

    await user.click(screen.getByRole('checkbox', { name: 'Addition' }));
    await user.click(screen.getByRole('checkbox', { name: 'Multiplication' }));

    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Multiplication' })).toBeChecked();
  });

  it('selects every operation with "Select all", then clears them with "Clear all"', async () => {
    const user = userEvent.setup();
    render(<StatefulOperationSelector initial={['addition']} />);

    await user.click(screen.getByRole('button', { name: 'Select all' }));
    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).toBeChecked();
    }

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).not.toBeChecked();
    }
  });

  it('can be toggled with the keyboard', async () => {
    const user = userEvent.setup();
    render(<StatefulOperationSelector initial={[]} />);
    const subtraction = screen.getByRole('checkbox', { name: 'Subtraction' });

    subtraction.focus();
    await user.keyboard(' ');

    expect(subtraction).toBeChecked();
  });
});
