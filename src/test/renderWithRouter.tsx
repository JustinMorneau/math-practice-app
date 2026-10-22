import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router';
import AppProvider from '../app/AppProvider';
import { createAppRoutes } from '../app/routeTable';
import SettingsPage from '../pages/SettingsPage';
import StatisticsPage from '../pages/StatisticsPage';
import type { StorageService } from '../services/storageService';

interface RenderAppOptions {
  /** Router state for the starting page, as passed with navigate(). */
  state?: unknown;
  /** Storage for the app to use; defaults to the test environment's localStorage. */
  storage?: StorageService;
}

/** The app's routes with every page loaded up front, so tests render synchronously. */
const appRoutes = createAppRoutes({
  statistics: { element: <StatisticsPage /> },
  settings: { element: <SettingsPage /> },
});

/**
 * Render the full app (provider and routes), starting at the given URL path.
 * The starting page always has the history key "default", as after a browser
 * refresh, so rendering the same path again simulates reloading the page.
 */
export function renderAppAt(path: string, { state, storage }: RenderAppOptions = {}) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [{ pathname: path, state }] });
  const result = render(
    <AppProvider storage={storage}>
      <RouterProvider router={router} />
    </AppProvider>,
  );
  return { ...result, router };
}

/** Render a single component that uses router hooks or links. */
export function renderWithRouter(ui: ReactElement, initialPath = '/') {
  return render(<MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>);
}
