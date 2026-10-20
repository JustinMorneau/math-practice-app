import { Navigate, Route, Routes } from 'react-router';
import AppLayout from '../components/layout/AppLayout';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import PracticePage from '../pages/PracticePage';
import PracticeSetupPage from '../pages/PracticeSetupPage';
import SessionSummaryPage from '../pages/SessionSummaryPage';
import SettingsPage from '../pages/SettingsPage';
import StatisticsPage from '../pages/StatisticsPage';
import { ROUTES } from './routes';

/** The application's route table. Every page shares the AppLayout shell. */
function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path={ROUTES.practice} element={<Navigate to={ROUTES.practiceSetup} replace />} />
        <Route path={ROUTES.practiceSetup} element={<PracticeSetupPage />} />
        <Route path={ROUTES.practiceSession} element={<PracticePage />} />
        <Route path={ROUTES.practiceSummary} element={<SessionSummaryPage />} />
        <Route path={ROUTES.statistics} element={<StatisticsPage />} />
        <Route path={ROUTES.settings} element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
