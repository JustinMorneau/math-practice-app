import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  it('exposes its progress to assistive technology', () => {
    render(
      <ProgressBar value={3} max={10} label="Session progress" valueText="3 of 10 answered" />,
    );

    const bar = screen.getByRole('progressbar', { name: 'Session progress' });
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuetext', '3 of 10 answered');
  });

  it('fills in proportion to the value', () => {
    render(<ProgressBar value={3} max={10} label="Progress" valueText="3 of 10" />);

    const fill = screen.getByRole('progressbar').firstElementChild;
    expect(fill).toHaveStyle({ width: '30%' });
  });

  it('never fills past the ends', () => {
    render(<ProgressBar value={12} max={10} label="Progress" valueText="12 of 10" />);

    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '100%' });
  });
});
