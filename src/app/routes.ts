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
