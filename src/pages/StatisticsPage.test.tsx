import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';
import { loadAttempts, saveAttempt, saveSession } from '../services/historyStorage';
import { saveMistakePatterns } from '../services/mistakeStorage';
import { loadSettings, saveSettings } from '../services/settingsStorage';
import { recordAttempt } from '../services/attemptRecorder';
import { createStorageService, type StorageService } from '../services/storageService';
import { renderAppAt } from '../test/renderWithRouter';
import { MemoryStorage } from '../test/storage';
import type { MistakePattern, PracticeAttempt, PracticeConfig, PracticeSession } from '../types';

let attemptCount = 0;
function attempt(overrides: Partial<PracticeAttempt>): PracticeAttempt {
  attemptCount += 1;
  return {
    id: `a-${attemptCount}`,
    questionId: `q-${attemptCount}`,
    operation: 'addition',
    firstOperand: 3,
    secondOperand: 4,
    correctAnswer: 7,
    selectedAnswer: 7,
    selfReportedCorrect: true,
    difficulty: 1,
    source: 'regular',
    attemptedAt: '2026-10-22T10:00:00.000Z',
    sessionId: 's-1',
    ...overrides,
  };
}

function session(id: string, startedAt: string, overrides: Partial<PracticeSession> = {}) {
  const value: PracticeSession = {
    id,
    startedAt,
    completedAt: startedAt,
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 5,
    attempted: 5,
    correct: 4,
    incorrect: 1,
    ...overrides,
  };
  return value;
}

/** Storage with 4 addition (3 right) at level 1 and 1 missed division at level 3. */
function storageWithHistory(): StorageService {
  const storage = createStorageService(new MemoryStorage());
  for (const correct of [true, true, true, false]) {
    recordAttempt(attempt({ selfReportedCorrect: correct }), storage);
  }
  const missedDivision = attempt({
    operation: 'division',
    difficulty: 3,
    selfReportedCorrect: false,
  });
  recordAttempt(missedDivision, storage);
  saveSession(session('older', '2026-10-20T09:00:00.000Z'), storage);
  saveSession(
    session('newer', '2026-10-22T09:00:00.000Z', {
      operations: ['division'],
      difficulty: 3,
      completedAt: undefined,
      attempted: 2,
      correct: 1,
      incorrect: 1,
    }),
    storage,
  );
  return storage;
}

type Scope = ReturnType<typeof within>;

function getSection(name: string): Scope {
  return within(screen.getByRole('region', { name }));
}

/** The performance card with the given heading inside a section. */
function getCard(section: Scope, heading: string): Scope {
  const card = section.getByRole('heading', { name: heading }).closest('article');
  if (!card) {
    throw new Error(`No card found for "${heading}".`);
  }
  return within(card);
}

/** The value shown under a stat label inside a container. */
function statIn(container: Scope, label: string) {
  return container.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent;
}

describe('StatisticsPage with no practice yet', () => {
  it('shows a friendly empty state with a way to start', () => {
    renderAppAt('/statistics', { storage: createStorageService(new MemoryStorage()) });

    expect(screen.getByText(/no practice yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start Practice' })).toHaveAttribute(
      'href',
      '/practice/setup',
    );
    expect(screen.queryByRole('button', { name: 'Reset Statistics' })).not.toBeInTheDocument();
  });
});

describe('StatisticsPage with practice history', () => {
  it('shows overall totals and accuracy', () => {
    renderAppAt('/statistics', { storage: storageWithHistory() });
    const overall = getSection('Overall');

    expect(statIn(overall, 'Answered')).toBe('5');
    expect(statIn(overall, 'Got right')).toBe('3');
    expect(statIn(overall, 'To practice')).toBe('2');
    expect(statIn(overall, 'Accuracy')).toBe('60%');
  });

  it('shows one card per operation, including operations not practiced yet', () => {
    renderAppAt('/statistics', { storage: storageWithHistory() });
    const byOperation = getSection('By operation');

    const cards = byOperation.getAllByRole('article');
    expect(cards).toHaveLength(4);
    const addition = getCard(byOperation, 'Addition');
    expect(addition.getByText('75%')).toBeInTheDocument();
    expect(statIn(addition, 'Answered')).toBe('4');
    expect(statIn(addition, 'Got right')).toBe('3');
    expect(statIn(addition, 'To practice')).toBe('1');
    expect(getCard(byOperation, 'Subtraction').getByText('Not practiced yet')).toBeInTheDocument();
  });

  it('shows one clearly labeled card per level', () => {
    renderAppAt('/statistics', { storage: storageWithHistory() });
    const byLevel = getSection('By level');

    const levelNames = [
      'Level 1: Beginner',
      'Level 2: Easy',
      'Level 3: Intermediate',
      'Level 4: Advanced',
    ];
    for (const name of levelNames) {
      expect(byLevel.getByRole('heading', { name })).toBeInTheDocument();
    }
    expect(statIn(getCard(byLevel, 'Level 3: Intermediate'), 'To practice')).toBe('1');
  });

  it('lists recent sessions from newest to oldest', () => {
    renderAppAt('/statistics', { storage: storageWithHistory() });
    const recent = getSection('Recent sessions');

    const items = recent.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0].querySelector('time')).toHaveAttribute('dateTime', '2026-10-22T09:00:00.000Z');
    expect(within(items[0]).getByText('Division, Intermediate level')).toBeInTheDocument();
    expect(within(items[0]).getByText('Not finished')).toBeInTheDocument();
    expect(statIn(within(items[0]), 'Accuracy')).toBe('50%');
    expect(items[1].querySelector('time')).toHaveAttribute('dateTime', '2026-10-20T09:00:00.000Z');
    expect(statIn(within(items[1]), 'Accuracy')).toBe('80%');
  });
});

describe('Resetting statistics', () => {
  it("asks for confirmation with the specification's wording", async () => {
    const user = userEvent.setup();
    renderAppAt('/statistics', { storage: storageWithHistory() });

    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }));

    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Are you sure you want to erase all practice history and statistics?',
    );
  });

  it('keeps everything when the student changes their mind', async () => {
    const user = userEvent.setup();
    const storage = storageWithHistory();
    renderAppAt('/statistics', { storage });

    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }));
    await user.click(screen.getByRole('button', { name: 'Keep My Progress' }));

    expect(statIn(getSection('Overall'), 'Answered')).toBe('5');
    expect(loadAttempts(storage)).toHaveLength(5);
  });

  it('erases history after confirmation, keeps settings, and refreshes the page', async () => {
    const user = userEvent.setup();
    const storage = storageWithHistory();
    saveSettings({ ...DEFAULT_SETTINGS, masteryThreshold: 6 }, storage);
    renderAppAt('/statistics', { storage });

    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }));
    await user.click(screen.getByRole('button', { name: 'Erase Everything' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/no practice yet/i)).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Statistics updates' })).toHaveTextContent(
      'Your practice history and statistics were erased.',
    );
    expect(loadAttempts(storage)).toEqual([]);
    expect(loadSettings(storage).settings.masteryThreshold).toBe(6);
  });
});

describe('Statistics after practicing', () => {
  it('updates when a practiced answer is marked incorrect', async () => {
    const user = userEvent.setup();
    const config: PracticeConfig = {
      operations: ['multiplication'],
      difficulty: 2,
      sessionLength: 5,
    };
    renderAppAt('/practice/session', { state: config });

    const choices = screen.getByRole('group', { name: 'Answer choices' });
    await user.click(within(choices).getAllByRole('button')[0]);
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));
    await user.click(screen.getByRole('link', { name: 'Statistics' }));

    expect(statIn(getSection('Overall'), 'Answered')).toBe('1');
    expect(statIn(getSection('Overall'), 'To practice')).toBe('1');
    expect(statIn(getCard(getSection('By operation'), 'Multiplication'), 'To practice')).toBe('1');
  });
});

describe('Mistake statistics', () => {
  function mistake(id: string, overrides: Partial<MistakePattern> = {}): MistakePattern {
    return {
      id,
      operation: 'multiplication',
      firstOperand: 8,
      secondOperand: 7,
      correctAnswer: 56,
      difficulty: 2,
      incorrectCount: 1,
      similarCorrectCount: 0,
      lastIncorrectAt: '2026-10-20T10:00:00.000Z',
      mastered: false,
      ...overrides,
    };
  }

  /** Storage with practice history, three mistakes (one mastered), and three review answers. */
  function storageWithMistakes(): StorageService {
    const storage = createStorageService(new MemoryStorage());
    recordAttempt(attempt({ operation: 'multiplication', selfReportedCorrect: false }), storage);
    recordAttempt(attempt({ operation: 'multiplication', selfReportedCorrect: false }), storage);
    recordAttempt(attempt({ operation: 'addition', selfReportedCorrect: false }), storage);
    saveMistakePatterns(
      [
        mistake('eight-sevens', { incorrectCount: 3, similarCorrectCount: 1 }),
        mistake('nine-plus-six', {
          operation: 'addition',
          firstOperand: 9,
          secondOperand: 6,
          correctAnswer: 15,
          lastIncorrectAt: '2026-10-21T10:00:00.000Z',
        }),
        mistake('six-sixes', {
          firstOperand: 6,
          secondOperand: 6,
          correctAnswer: 36,
          incorrectCount: 2,
          similarCorrectCount: 3,
          mastered: true,
        }),
      ],
      storage,
    );
    for (const correct of [true, true, false]) {
      saveAttempt(attempt({ source: 'mistake-review', selfReportedCorrect: correct }), storage);
    }
    return storage;
  }

  it('shows mistake totals and review answers', () => {
    renderAppAt('/statistics', { storage: storageWithMistakes() });
    const mistakes = getSection('Mistakes');

    expect(statIn(mistakes, 'To review')).toBe('2');
    expect(statIn(mistakes, 'Mastered')).toBe('1');
    expect(statIn(mistakes, 'Review questions')).toBe('3');
    expect(statIn(mistakes, 'Review answers right')).toBe('2');
  });

  it('names the most often missed operation', () => {
    renderAppAt('/statistics', { storage: storageWithMistakes() });

    expect(getSection('Mistakes').getByText(/most often missed/i)).toHaveTextContent(
      'Most often missed: Multiplication',
    );
  });

  it('lists the most missed facts first', () => {
    renderAppAt('/statistics', { storage: storageWithMistakes() });
    const heading = getSection('Mistakes').getByRole('heading', { name: 'Most missed facts' });
    const topFacts = within(heading.nextElementSibling as HTMLElement);

    const facts = topFacts.getAllByRole('listitem').map((item) => item.textContent);
    expect(facts).toEqual([
      '8 × 7 = 56missed 3 times',
      '6 × 6 = 36missed 2 times',
      '9 + 6 = 15missed 1 time',
    ]);
  });

  it('shows each mistake to review with its progress and last missed date', () => {
    renderAppAt('/statistics', { storage: storageWithMistakes() });
    const toReview = getSection('Mistakes').getByRole('heading', { name: 'Mistakes to review' });
    const list = within(toReview.nextElementSibling as HTMLElement);

    const items = list.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('8 × 7 = 56')).toBeInTheDocument();
    expect(statIn(within(items[0]), 'Missed')).toBe('3 times');
    expect(statIn(within(items[0]), 'Progress')).toBe('1 of 3 right');
    expect(items[1].querySelector('time')).toHaveAttribute('dateTime', '2026-10-21T10:00:00.000Z');
  });

  it('keeps mastered mistakes in a separate, collapsed section', () => {
    renderAppAt('/statistics', { storage: storageWithMistakes() });

    // A native <details> element, which the student opens with its summary.
    const details = screen.getByText('Mastered mistakes (1)').closest('details') as HTMLElement;
    expect(details).not.toHaveAttribute('open');
    expect(within(details).getByText('6 × 6 = 36')).toBeInTheDocument();
    expect(within(details).getByText('Mastered')).toBeInTheDocument();
  });

  it('shows an empty state when there are no mistakes', () => {
    const storage = createStorageService(new MemoryStorage());
    recordAttempt(attempt({ selfReportedCorrect: true }), storage);
    renderAppAt('/statistics', { storage });

    expect(getSection('Mistakes').getByText(/no mistakes yet/i)).toBeInTheDocument();
  });
});
