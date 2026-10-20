import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import AppRoutes from '../app/AppRoutes';
import { renderAppAt } from '../test/renderWithRouter';
import type { PracticeConfig } from '../types';

function renderPracticeWithState(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/practice/session', state }]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('PracticePage', () => {
  it('shows the setup it received', () => {
    const config: PracticeConfig = {
      operations: ['subtraction'],
      difficulty: 2,
      sessionLength: 5,
    };
    renderPracticeWithState(config);

    expect(screen.getByText('Subtraction')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('5 questions')).toBeInTheDocument();
  });

  it('asks the student to set up practice when opened directly', () => {
    renderAppAt('/practice/session');

    expect(screen.getByText("Let's set up your practice first.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Set Up Practice' })).toHaveAttribute(
      'href',
      '/practice/setup',
    );
  });

  it('treats an invalid setup like a missing one', () => {
    renderPracticeWithState({ operations: [], difficulty: 9, sessionLength: 0 });

    expect(screen.getByText("Let's set up your practice first.")).toBeInTheDocument();
  });
});
