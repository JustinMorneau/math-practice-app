/**
 * Restoring a session after a page refresh, and warning before leaving an
 * active session (specification sections 11 and 16).
 */
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { loadActiveSession } from '../services/activeSessionStorage';
import { loadSessions } from '../services/historyStorage';
import { STORAGE_KEYS, createStorageService } from '../services/storageService';
import { renderAppAt } from '../test/renderWithRouter';
import { MemoryStorage } from '../test/storage';
import type { PracticeConfig } from '../types';

type User = ReturnType<typeof userEvent.setup>;

const config: PracticeConfig = {
  operations: ['addition'],
  difficulty: 1,
  sessionLength: 10,
  mode: 'regular',
};

function getChoices() {
  return within(screen.getByRole('group', { name: 'Answer choices' })).getAllByRole('button');
}

async function answerCard(user: User, gotItRight = true) {
  await user.click(getChoices()[0]);
  await user.click(screen.getByRole('button', { name: 'Flip Card' }));
  await user.click(
    screen.getByRole('button', { name: gotItRight ? 'I Got It Right' : 'I Got It Wrong' }),
  );
}

function getProblemHeading() {
  return screen.getByRole('heading', { level: 2 });
}

describe('restoring a session after a refresh', () => {
  it('returns to the same question with the same selected answer', async () => {
    const storage = createStorageService(new MemoryStorage());
    const user = userEvent.setup();
    const first = renderAppAt('/practice/session', { state: config, storage });
    await answerCard(user, true);
    await answerCard(user, false);
    await user.click(getChoices()[2]);
    const problem = getProblemHeading().textContent;
    const selected = getChoices()[2].textContent;

    // Refresh: the page goes away and loads again at the same history entry.
    first.unmount();
    renderAppAt('/practice/session', { state: config, storage });

    expect(screen.getByText('Question 3 of 10')).toBeInTheDocument();
    expect(getProblemHeading().textContent).toBe(problem);
    expect(getChoices()[2]).toHaveAttribute('aria-pressed', 'true');
    expect(getChoices()[2].textContent).toBe(selected);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
  });

  it('restores a card that was already flipped', async () => {
    const storage = createStorageService(new MemoryStorage());
    const user = userEvent.setup();
    const first = renderAppAt('/practice/session', { state: config, storage });
    await user.click(getChoices()[1]);
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));

    first.unmount();
    renderAppAt('/practice/session', { state: config, storage });

    expect(screen.getByRole('button', { name: 'I Got It Right' })).toBeInTheDocument();
  });

  it('starts a fresh session when practice is started again', async () => {
    const storage = createStorageService(new MemoryStorage());
    const user = userEvent.setup();
    const first = renderAppAt('/practice/session', { state: config, storage });
    await answerCard(user);
    await answerCard(user);
    first.unmount();

    // Same setup (the default settings), but a new start from the setup page.
    renderAppAt('/practice/setup', { storage });
    await user.click(screen.getByRole('button', { name: 'Start Session' }));

    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
  });

  it('forgets the saved session once it ends', async () => {
    const storage = createStorageService(new MemoryStorage());
    const user = userEvent.setup();
    renderAppAt('/practice/session', { state: { ...config, sessionLength: 5 }, storage });
    expect(loadActiveSession(storage)).not.toBeNull();

    for (let i = 0; i < 5; i += 1) {
      await answerCard(user);
    }

    expect(screen.getByRole('heading', { level: 1, name: 'Session Summary' })).toBeInTheDocument();
    expect(loadActiveSession(storage)).toBeNull();
  });

  it('starts fresh, without crashing, when the saved session is damaged', () => {
    const storage = createStorageService(
      new MemoryStorage({ [STORAGE_KEYS.activeSession]: '{"locationKey":"default","state":7}' }),
    );

    renderAppAt('/practice/session', { state: config, storage });

    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument();
  });
});

describe('leaving an active session', () => {
  async function startAndAnswerOne() {
    const storage = createStorageService(new MemoryStorage());
    const user = userEvent.setup();
    const rendered = renderAppAt('/practice/session', { state: config, storage });
    await answerCard(user);
    return { storage, user, router: rendered.router };
  }

  function getMainNav() {
    return within(screen.getByRole('navigation', { name: 'Main' }));
  }

  it('asks before leaving through the navigation', async () => {
    const { user } = await startAndAnswerOne();

    await user.click(getMainNav().getByRole('link', { name: 'Statistics' }));

    const dialog = within(screen.getByRole('dialog', { name: 'Leave this session?' }));
    expect(dialog.getByText(/you have answered 1 question/i)).toBeInTheDocument();
  });

  it('keeps practicing when the student changes their mind', async () => {
    const { user } = await startAndAnswerOne();

    await user.click(getMainNav().getByRole('link', { name: 'Statistics' }));
    await user.click(screen.getByRole('button', { name: 'Keep Practicing' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Question 2 of 10')).toBeInTheDocument();
  });

  it('ends the session and leaves when confirmed', async () => {
    const { storage, user } = await startAndAnswerOne();

    await user.click(getMainNav().getByRole('link', { name: 'Statistics' }));
    await user.click(screen.getByRole('button', { name: 'End Session and Leave' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Statistics' })).toBeInTheDocument();
    expect(loadSessions(storage)[0]).toMatchObject({ attempted: 1 });
    expect(loadSessions(storage)[0].completedAt).toEqual(expect.any(String));
    expect(loadActiveSession(storage)).toBeNull();
  });

  it("asks before leaving with the browser's Back button", async () => {
    const storage = createStorageService(new MemoryStorage());
    const user = userEvent.setup();
    const { router } = renderAppAt('/practice/setup', { storage });
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    await answerCard(user);

    await act(async () => {
      await router.navigate(-1);
    });

    expect(screen.getByRole('dialog', { name: 'Leave this session?' })).toBeInTheDocument();
    expect(screen.getByText('Question 2 of 10')).toBeInTheDocument();
  });

  it('leaves without asking when nothing has been answered yet', async () => {
    const user = userEvent.setup();
    renderAppAt('/practice/session', { state: config });

    await user.click(getMainNav().getByRole('link', { name: 'Statistics' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Statistics' })).toBeInTheDocument();
  });

  it('does not warn after the session is finished', async () => {
    const user = userEvent.setup();
    renderAppAt('/practice/session', { state: { ...config, sessionLength: 5 } });
    for (let i = 0; i < 5; i += 1) {
      await answerCard(user);
    }

    await user.click(getMainNav().getByRole('link', { name: 'Statistics' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Statistics' })).toBeInTheDocument();
  });
});
