import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderAppAt } from '../test/renderWithRouter';

describe('HomePage', () => {
  it('shows the app title and a welcome message', () => {
    renderAppAt('/');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome to Math Practice!' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/flip the card to check it/i)).toBeInTheDocument();
  });

  it.each([
    ['Start Practice', '/practice/setup'],
    ['View Statistics', '/statistics'],
    ['Settings', '/settings'],
  ])('has a "%s" button linking to %s', (name, href) => {
    renderAppAt('/');

    // Scoped to <main> because the header navigation also has a "Settings" link.
    const main = within(screen.getByRole('main'));
    expect(main.getByRole('link', { name })).toHaveAttribute('href', href);
  });

  it('opens the practice setup page when Start Practice is clicked', async () => {
    const user = userEvent.setup();
    renderAppAt('/');

    await user.click(screen.getByRole('link', { name: 'Start Practice' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument();
  });

  it('opens the statistics page with the keyboard', async () => {
    const user = userEvent.setup();
    renderAppAt('/');

    screen.getByRole('link', { name: 'View Statistics' }).focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('heading', { level: 1, name: 'Statistics' })).toBeInTheDocument();
  });
});
