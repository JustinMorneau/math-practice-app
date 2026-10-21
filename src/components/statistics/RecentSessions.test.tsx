import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PracticeSession } from '../../types';
import RecentSessions from './RecentSessions';

const base: PracticeSession = {
  id: 's-1',
  startedAt: '2026-10-22T10:00:00.000Z',
  completedAt: '2026-10-22T10:05:00.000Z',
  operations: ['subtraction'],
  difficulty: 2,
  sessionLength: 5,
  attempted: 5,
  correct: 4,
  incorrect: 1,
};

describe('RecentSessions', () => {
  it('describes regular sessions, including ones saved before review mode existed', () => {
    render(<RecentSessions sessions={[base]} />);

    expect(screen.getByText('Subtraction, Easy level')).toBeInTheDocument();
  });

  it('labels mistake-review sessions', () => {
    render(
      <RecentSessions sessions={[{ ...base, operations: ['division'], mode: 'mistake-review' }]} />,
    );

    expect(screen.getByText('Mistake review: Division')).toBeInTheDocument();
  });
});
