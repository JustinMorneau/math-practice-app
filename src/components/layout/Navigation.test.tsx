import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderAppAt } from '../../test/renderWithRouter';

function getMainNav() {
  return screen.getByRole('navigation', { name: 'Main' });
}

describe('Navigation', () => {
  it('links to every main section', () => {
    renderAppAt('/');
    const nav = within(getMainNav());

    expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(nav.getByRole('link', { name: 'Practice' })).toHaveAttribute('href', '/practice/setup');
    expect(nav.getByRole('link', { name: 'Statistics' })).toHaveAttribute('href', '/statistics');
    expect(nav.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
  });

  it('marks only the current page with aria-current', () => {
    renderAppAt('/statistics');
    const nav = within(getMainNav());

    expect(nav.getByRole('link', { name: 'Statistics' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('navigates when a link is clicked', async () => {
    const user = userEvent.setup();
    renderAppAt('/');

    await user.click(within(getMainNav()).getByRole('link', { name: 'Settings' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
  });
});
