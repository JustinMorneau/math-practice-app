import { Navigate, Route, createRoutesFromElements } from 'react-router';
import AppLayout from '../components/layout/AppLayout';
import ErrorPage from '../pages/ErrorPage';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import PracticePage from '../pages/PracticePage';
import PracticeSetupPage from '../pages/PracticeSetupPage';
import SessionSummaryPage from '../pages/SessionSummaryPage';
import SettingsPage from '../pages/SettingsPage';
import StatisticsPage from '../pages/StatisticsPage';
import { ROUTES } from './routes';

/**
 * The application's routes. Every page shares the AppLayout shell.
 *
 * These are used with a data router (createBrowserRouter in the app,
 * createMemoryRouter in tests), which the practice page needs to warn
 * before leaving an active session, including with the browser's Back
 * button.
 *
 * If a page fails while rendering, its error page appears inside the layout,
 * so the header stays usable; if the layout itself fails, the root error
 * page replaces everything.
 */
export const appRoutes = createRoutesFromElements(
  <Route element={<AppLayout />} errorElement={<ErrorPage standalone />}>
    <Route errorElement={<ErrorPage />}>
      <Route index element={<HomePage />} />
      <Route path={ROUTES.practice} element={<Navigate to={ROUTES.practiceSetup} replace />} />
      <Route path={ROUTES.practiceSetup} element={<PracticeSetupPage />} />
      <Route path={ROUTES.practiceSession} element={<PracticePage />} />
      <Route path={ROUTES.practiceSummary} element={<SessionSummaryPage />} />
      <Route path={ROUTES.statistics} element={<StatisticsPage />} />
      <Route path={ROUTES.settings} element={<SettingsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Route>,
);
