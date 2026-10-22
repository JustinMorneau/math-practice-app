/**
 * End-to-end practice flows from the specification's integration test list
 * (section 21.3), starting from the home page as a student would.
 */
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { loadAttempts } from '../services/historyStorage';
import { createStorageService } from '../services/storageService';
import { renderAppAt } from '../test/renderWithRouter';
import { MemoryStorage } from '../test/storage';

type User = ReturnType<typeof userEvent.setup>;

async function answerCard(user: User, gotItRight: boolean) {
  const choices = screen.getByRole('group', { name: 'Answer choices' });
  await user.click(within(choices).getAllByRole('button')[0]);
  await user.click(screen.getByRole('button', { name: 'Flip Card' }));
  await user.click(
    screen.getByRole('button', { name: gotItRight ? 'I Got It Right' : 'I Got It Wrong' }),
  );
}

/** The value shown under a stat label, e.g. "60%" for "Accuracy". */
function getStat(label: string, container: HTMLElement = document.body) {
  return within(container).getByText(label, { selector: 'dt' }).nextElementSibling?.textContent;
}

describe('a full addition session', () => {
  it('goes from the home page through practice to the summary and statistics', async () => {
    const user = userEvent.setup();
    const storage = createStorageService(new MemoryStorage());
    renderAppAt('/', { storage });

    await user.click(screen.getByRole('link', { name: 'Start Practice' }));
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: '5 questions' }));
    await user.click(screen.getByRole('button', { name: 'Start Session' }));

    for (const gotItRight of [true, true, false, true, false]) {
      expect(screen.getByRole('heading', { level: 2, name: /plus/ })).toBeInTheDocument();
      await answerCard(user, gotItRight);
    }

    expect(screen.getByRole('heading', { level: 1, name: 'Session Summary' })).toBeInTheDocument();
    expect(getStat('Accuracy')).toBe('60%');
    expect(loadAttempts(storage).every(({ operation }) => operation === 'addition')).toBe(true);

    await user.click(screen.getByRole('link', { name: 'View Statistics' }));
    const overall = screen.getByRole('region', { name: 'Overall' });
    expect(getStat('Answered', overall)).toBe('5');
    expect(getStat('Got right', overall)).toBe('3');
  });
});

describe('a mixed-operation session', () => {
  it('mixes the selected operations', async () => {
    const user = userEvent.setup();
    const storage = createStorageService(new MemoryStorage());
    renderAppAt('/practice/setup', { storage });

    await user.click(screen.getByRole('button', { name: 'Select all' }));
    await user.click(screen.getByRole('radio', { name: '20 questions' }));
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    expect(
      screen.getByText('Addition, Subtraction, Multiplication, and Division, Beginner level'),
    ).toBeInTheDocument();

    for (let i = 0; i < 20; i += 1) {
      await answerCard(user, true);
    }

    // With four operations chosen at random, twenty questions use several of them.
    const operations = new Set(loadAttempts(storage).map(({ operation }) => operation));
    expect(operations.size).toBeGreaterThan(1);
    expect(getStat('Answered')).toBe('20');
  });
});
