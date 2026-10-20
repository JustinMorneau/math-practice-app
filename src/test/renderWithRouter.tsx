import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import AppRoutes from '../app/AppRoutes';

/** Render the full route table, starting at the given URL path. */
export function renderAppAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

/** Render a single component that uses router hooks or links. */
export function renderWithRouter(ui: ReactElement, initialPath = '/') {
  return render(<MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>);
}
