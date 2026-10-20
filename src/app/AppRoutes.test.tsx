import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderAppAt } from '../test/renderWithRouter';
import { ROUTES } from './routes';

describe('AppRoutes', () => {
  it.each([
    [ROUTES.home, 'Welcome to Math Practice!'],
    [ROUTES.practiceSetup, 'Practice Setup'],
    [ROUTES.practiceSummary, 'Session Summary'],
    [ROUTES.statistics, 'Statistics'],
    [ROUTES.settings, 'Settings'],
  ])('renders the page for %s', (path, heading) => {
    renderAppAt(path);

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('sends /practice/session to setup when no session was started', () => {
    renderAppAt(ROUTES.practiceSession);

    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument();
  });

  it('redirects /practice to the practice setup page', () => {
    renderAppAt(ROUTES.practice);

    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument();
  });

  it('shows a not-found page with a way home for unknown URLs', () => {
    renderAppAt('/this-page-does-not-exist');

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/');
  });

  it('shows the shared header and navigation on every page', () => {
    renderAppAt(ROUTES.settings);

    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: /math practice/i })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('provides a skip link to the main content', () => {
    renderAppAt(ROUTES.home);

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('sets the browser tab title for each page', () => {
    renderAppAt(ROUTES.statistics);

    expect(document.title).toBe('Statistics | Math Practice');
  });
});
