import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ToggleSwitch from './ToggleSwitch';

function StatefulToggle({ initial }: { initial: boolean }) {
  const [checked, setChecked] = useState(initial);
  return (
    <ToggleSwitch
      label="Sound effects"
      description="Play a soft sound."
      checked={checked}
      onChange={setChecked}
    />
  );
}

describe('ToggleSwitch', () => {
  it('is announced as a labeled, described switch', () => {
    render(<StatefulToggle initial={false} />);

    const toggle = screen.getByRole('switch', { name: 'Sound effects' });
    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAccessibleDescription('Play a soft sound.');
  });

  it('turns on and off when clicked, showing its state in words', async () => {
    const user = userEvent.setup();
    render(<StatefulToggle initial={false} />);
    expect(screen.getByText('Off')).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Sound effects' }));
    expect(screen.getByRole('switch', { name: 'Sound effects' })).toBeChecked();
    expect(screen.getByText('On')).toBeInTheDocument();

    await user.click(screen.getByText('Sound effects'));
    expect(screen.getByRole('switch', { name: 'Sound effects' })).not.toBeChecked();
  });

  it('toggles with the Space key', async () => {
    const user = userEvent.setup();
    render(<StatefulToggle initial />);
    const toggle = screen.getByRole('switch', { name: 'Sound effects' });

    toggle.focus();
    await user.keyboard(' ');

    expect(toggle).not.toBeChecked();
  });
});
