import { fireEvent, screen, within } from '@testing-library/react';
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

describe('Navigation menu on narrow screens', () => {
  // The Menu button is shown only on narrow screens; the test environment is
  // wide, so it is found with `hidden: true` and clicked directly.
  function getMenuButton() {
    return within(getMainNav()).getByRole('button', { name: 'Menu', hidden: true });
  }

  it('reports whether the menu is open and which list it controls', () => {
    renderAppAt('/');
    const menuButton = getMenuButton();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute('aria-controls', within(getMainNav()).getByRole('list').id);

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes after choosing a page', async () => {
    const user = userEvent.setup();
    renderAppAt('/');
    fireEvent.click(getMenuButton());

    await user.click(within(getMainNav()).getByRole('link', { name: 'Statistics' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Statistics' })).toBeInTheDocument();
    expect(getMenuButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes with Escape and returns focus to the Menu button', () => {
    renderAppAt('/');
    fireEvent.click(getMenuButton());

    fireEvent.keyDown(within(getMainNav()).getByRole('link', { name: 'Home' }), { key: 'Escape' });

    expect(getMenuButton()).toHaveAttribute('aria-expanded', 'false');
    expect(getMenuButton()).toHaveFocus();
  });
});
