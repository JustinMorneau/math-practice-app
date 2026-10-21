import type { PracticeConfig, PracticeSession } from '../types';

/**
 * Every route path in one place (specification section 16), so links and
 * the route table cannot drift apart.
 */
export const ROUTES = {
  home: '/',
  practice: '/practice',
  practiceSetup: '/practice/setup',
  practiceSession: '/practice/session',
  practiceSummary: '/practice/summary',
  statistics: '/statistics',
  settings: '/settings',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/** Router state the practice setup page understands. */
export interface PracticeSetupState {
  /** Set when the student was sent back because no valid session was found. */
  notice?: 'session-missing';
  /** Choices to start from, such as the setup of the session just finished. */
  config?: PracticeConfig;
}

/** Router state the session summary page expects. */
export interface SessionSummaryState {
  session: PracticeSession;
  /** How many of the session's questions were mistake-review questions. */
  reviewQuestionCount: number;
}

/** Router state the home page understands. */
export interface HomePageState {
  /** Set after all app data was cleared from the settings page. */
  notice?: 'data-cleared';
}
