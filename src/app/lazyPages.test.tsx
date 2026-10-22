/**
 * The real app loads the statistics and settings pages on first visit
 * (other tests load every page up front).
 */
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { createStorageService } from '../services/storageService';
import { MemoryStorage } from '../test/storage';
import AppProvider from './AppProvider';
import { createAppRoutes } from './routeTable';

function renderLazyAppAt(path: string) {
  const router = createMemoryRouter(createAppRoutes(), { initialEntries: [path] });
  render(
    <AppProvider storage={createStorageService(new MemoryStorage())}>
      <RouterProvider router={router} />
    </AppProvider>,
  );
}

describe('lazily loaded pages', () => {
  it.each([
    ['/statistics', 'Statistics'],
    ['/settings', 'Settings'],
  ])('loads %s when it is first opened', async (path, heading) => {
    renderLazyAppAt(path);

    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('shows the home page right away', () => {
    renderLazyAppAt('/');

    expect(screen.getByRole('heading', { level: 1, name: /welcome/i })).toBeInTheDocument();
  });
});
