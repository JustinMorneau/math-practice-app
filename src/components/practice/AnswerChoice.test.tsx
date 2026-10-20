import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AnswerChoice from './AnswerChoice';

describe('AnswerChoice', () => {
  it('shows the answer as a button', () => {
    render(<AnswerChoice value={56} isSelected={false} disabled={false} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: '56' })).toBeInTheDocument();
  });

  it('tells assistive technology whether it is selected', () => {
    const { rerender } = render(
      <AnswerChoice value={56} isSelected={false} disabled={false} onSelect={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: '56' })).toHaveAttribute('aria-pressed', 'false');

    rerender(<AnswerChoice value={56} isSelected disabled={false} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: '56' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('reports its value when chosen', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AnswerChoice value={56} isSelected={false} disabled={false} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: '56' }));

    expect(onSelect).toHaveBeenCalledWith(56);
  });

  it('cannot be chosen when disabled', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AnswerChoice value={56} isSelected={false} disabled onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: '56' }));

    expect(onSelect).not.toHaveBeenCalled();
  });
});
