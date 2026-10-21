import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import AppRoutes from '../app/AppRoutes';
import { renderAppAt } from '../test/renderWithRouter';

function getStartButton() {
  return screen.getByRole('button', { name: 'Start Session' });
}

describe('PracticeSetupPage', () => {
  it('shows the operation, difficulty, and session-length choices', () => {
    renderAppAt('/practice/setup');

    expect(screen.getByRole('group', { name: 'Choose your problems' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Choose your level' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'How many questions?' })).toBeInTheDocument();
  });

  it('shows no notice when opened normally', () => {
    renderAppAt('/practice/setup');

    expect(screen.queryByText("Let's set up your practice first.")).not.toBeInTheDocument();
  });

  it('starts from previous choices passed in router state', () => {
    const state = { config: { operations: ['division'], difficulty: 4, sessionLength: 5 } };
    render(
      <MemoryRouter initialEntries={[{ pathname: '/practice/setup', state }]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Addition' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Advanced' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '5 questions' })).toBeChecked();
  });

  it('starts with sensible defaults so a session can begin right away', () => {
    renderAppAt('/practice/setup');

    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Beginner' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '10 questions' })).toBeChecked();
    expect(getStartButton()).toBeEnabled();
  });

  it('disables Start Session and explains why when no operation is selected', async () => {
    const user = userEvent.setup();
    renderAppAt('/practice/setup');

    await user.click(screen.getByRole('checkbox', { name: 'Addition' }));

    expect(getStartButton()).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Pick at least one kind of problem to start.',
    );
    expect(getStartButton()).toHaveAccessibleDescription(/pick at least one kind of problem/i);
  });

  it('re-enables Start Session once an operation is selected again', async () => {
    const user = userEvent.setup();
    renderAppAt('/practice/setup');

    await user.click(screen.getByRole('checkbox', { name: 'Addition' }));
    await user.click(screen.getByRole('checkbox', { name: 'Division' }));

    expect(getStartButton()).toBeEnabled();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('passes the chosen setup to the practice session', async () => {
    const user = userEvent.setup();
    renderAppAt('/practice/setup');

    await user.click(screen.getByRole('checkbox', { name: 'Multiplication' }));
    await user.click(screen.getByRole('radio', { name: 'Intermediate' }));
    await user.click(screen.getByRole('radio', { name: '20 questions' }));
    await user.click(getStartButton());

    expect(screen.getByRole('heading', { level: 1, name: 'Practice' })).toBeInTheDocument();
    expect(screen.getByText('Addition and Multiplication, Intermediate level')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 20')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '20');
  });

  it('passes mixed operations and continuous practice', async () => {
    const user = userEvent.setup();
    renderAppAt('/practice/setup');

    await user.click(screen.getByRole('button', { name: 'Select all' }));
    await user.click(screen.getByRole('radio', { name: 'Keep going' }));
    await user.click(getStartButton());

    expect(
      screen.getByText('Addition, Subtraction, Multiplication, and Division, Beginner level'),
    ).toBeInTheDocument();
    expect(screen.getByText('Question 1')).toBeInTheDocument();
  });
});
