import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import AppProvider from '../app/AppProvider';
import AppRoutes from '../app/AppRoutes';
import type { StorageService } from '../services/storageService';

interface RenderAppOptions {
  /** Router state for the starting page, as passed with navigate(). */
  state?: unknown;
  /** Storage for the app to use; defaults to the test environment's localStorage. */
  storage?: StorageService;
}

/** Render the full app (provider and route table), starting at the given URL path. */
export function renderAppAt(path: string, { state, storage }: RenderAppOptions = {}) {
  return render(
    <AppProvider storage={storage}>
      <MemoryRouter initialEntries={[{ pathname: path, state }]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProvider>,
  );
}

/** Render a single component that uses router hooks or links. */
export function renderWithRouter(ui: ReactElement, initialPath = '/') {
  return render(<MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>);
}
