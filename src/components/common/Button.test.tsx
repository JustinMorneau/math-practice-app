import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithRouter } from '../../test/renderWithRouter';
import { Button, ButtonLink } from './Button';

describe('Button', () => {
  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Flip Card</Button>);

    await user.click(screen.getByRole('button', { name: 'Flip Card' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can be activated with the keyboard', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Next</Button>);

    screen.getByRole('button', { name: 'Next' }).focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Start Session
      </Button>,
    );

    await user.click(screen.getByRole('button', { name: 'Start Session' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('ButtonLink', () => {
  it('renders a link to the given route', () => {
    renderWithRouter(<ButtonLink to="/statistics">View Statistics</ButtonLink>);

    expect(screen.getByRole('link', { name: 'View Statistics' })).toHaveAttribute(
      'href',
      '/statistics',
    );
  });
});
