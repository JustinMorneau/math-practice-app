import { Navigate, Route, createRoutesFromElements, type PathRouteProps } from 'react-router';
import AppLayout from '../components/layout/AppLayout';
import ErrorPage from '../pages/ErrorPage';
import HomePage from '../pages/HomePage';
import LoadingPage from '../pages/LoadingPage';
import NotFoundPage from '../pages/NotFoundPage';
import PracticePage from '../pages/PracticePage';
import PracticeSetupPage from '../pages/PracticeSetupPage';
import SessionSummaryPage from '../pages/SessionSummaryPage';
import { ROUTES } from './routes';

/**
 * How a page's route provides it: right away (`element`) or on first visit
 * (`lazy`). Typed from the <Route> component's own props, since these are
 * spread onto <Route>.
 */
export type PageRoute = Pick<PathRouteProps, 'element' | 'lazy'>;

export interface LazyPages {
  statistics: PageRoute;
  settings: PageRoute;
}

/**
 * The statistics and settings pages are downloaded the first time they are
 * visited, keeping the initial download small; practice pages load right
 * away so a session can start instantly.
 */
const LAZY_PAGES: LazyPages = {
  statistics: {
    lazy: () => import('../pages/StatisticsPage').then((page) => ({ Component: page.default })),
  },
  settings: {
    lazy: () => import('../pages/SettingsPage').then((page) => ({ Component: page.default })),
  },
};

/**
 * The application's routes. Every page shares the AppLayout shell.
 *
 * These are used with a data router (createBrowserRouter in the app,
 * createMemoryRouter in tests), which the practice page needs to warn
 * before leaving an active session, including with the browser's Back
 * button. Tests pass the lazy pages in already loaded.
 *
 * If a page fails while rendering, its error page appears inside the layout,
 * so the header stays usable; if the layout itself fails, the root error
 * page replaces everything.
 */
export function createAppRoutes(lazyPages: LazyPages = LAZY_PAGES) {
  return createRoutesFromElements(
    <Route
      element={<AppLayout />}
      errorElement={<ErrorPage standalone />}
      hydrateFallbackElement={<LoadingPage />}
    >
      <Route errorElement={<ErrorPage />}>
        <Route index element={<HomePage />} />
        <Route path={ROUTES.practice} element={<Navigate to={ROUTES.practiceSetup} replace />} />
        <Route path={ROUTES.practiceSetup} element={<PracticeSetupPage />} />
        <Route path={ROUTES.practiceSession} element={<PracticePage />} />
        <Route path={ROUTES.practiceSummary} element={<SessionSummaryPage />} />
        <Route path={ROUTES.statistics} {...lazyPages.statistics} />
        <Route path={ROUTES.settings} {...lazyPages.settings} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>,
  );
}
