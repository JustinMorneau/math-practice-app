import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../test/random';
import type { PracticeConfig, Question } from '../types';
import {
  createAttempt,
  createSessionState,
  generateNextQuestion,
  getTotalQuestions,
  hasReachedSessionLength,
  practiceSessionReducer,
  type PracticeSessionState,
} from './practiceSession';
import { createProblem, createQuestion } from './questionGenerator';

const config: PracticeConfig = { operations: ['multiplication'], difficulty: 2, sessionLength: 2 };

let questionCount = 0;
function makeQuestion(first = 7, second = 8): Question {
  questionCount += 1;
  return {
    ...createQuestion(createProblem('multiplication', 2, first, second)),
    id: `q-${questionCount}`,
  };
}

function startSession(overrides: Partial<PracticeConfig> = {}): PracticeSessionState {
  return createSessionState(
    { ...config, ...overrides },
    { id: 's-1', startedAt: '2026-10-20T10:00:00.000Z', firstQuestion: makeQuestion() },
  );
}

/** Records a result for the current question and moves on to a new one. */
function answer(
  state: PracticeSessionState,
  selfReportedCorrect: boolean,
  nextQuestion?: Question,
) {
  return practiceSessionReducer(state, {
    type: 'record-attempt',
    attempt: createAttempt({
      id: `a-${state.attempts.length + 1}`,
      question: state.currentQuestion,
      sessionId: state.session.id,
      selectedAnswer: state.currentQuestion.correctAnswer,
      selfReportedCorrect,
      attemptedAt: '2026-10-20T10:05:00.000Z',
    }),
    nextQuestion: nextQuestion ?? makeQuestion(6, 9),
  });
}

describe('createSessionState', () => {
  it('starts an active session with zero totals', () => {
    const state = startSession();

    expect(state.status).toBe('active');
    expect(state.attempts).toEqual([]);
    expect(state.session).toMatchObject({
      id: 's-1',
      startedAt: '2026-10-20T10:00:00.000Z',
      operations: ['multiplication'],
      difficulty: 2,
      sessionLength: 2,
      mode: 'regular',
      attempted: 0,
      correct: 0,
      incorrect: 0,
    });
    expect(state.session.completedAt).toBeUndefined();
  });

  it('records review mode on the session', () => {
    expect(startSession({ mode: 'mistake-review' }).session.mode).toBe('mistake-review');
  });
});

describe('createAttempt', () => {
  it('links a review attempt to its mistake pattern', () => {
    const question: Question = {
      ...makeQuestion(),
      source: 'mistake-review',
      mistakePatternId: 'm-9',
    };
    const attempt = createAttempt({
      id: 'a-1',
      question,
      sessionId: 's-1',
      selectedAnswer: 56,
      selfReportedCorrect: true,
      attemptedAt: '2026-10-20T10:01:00.000Z',
    });

    expect(attempt).toMatchObject({ source: 'mistake-review', mistakePatternId: 'm-9' });
  });

  it('records the question, the answer, and the self-reported result', () => {
    const question = makeQuestion();
    const attempt = createAttempt({
      id: 'a-1',
      question,
      sessionId: 's-1',
      selectedAnswer: 54,
      selfReportedCorrect: false,
      attemptedAt: '2026-10-20T10:01:00.000Z',
    });

    expect(attempt).toEqual({
      id: 'a-1',
      questionId: question.id,
      operation: 'multiplication',
      firstOperand: 7,
      secondOperand: 8,
      correctAnswer: 56,
      selectedAnswer: 54,
      selfReportedCorrect: false,
      difficulty: 2,
      source: 'regular',
      attemptedAt: '2026-10-20T10:01:00.000Z',
      sessionId: 's-1',
    });
  });
});

describe('practiceSessionReducer: recording attempts', () => {
  it('counts a correct answer and moves to the next question', () => {
    const next = makeQuestion(6, 9);
    const state = answer(startSession(), true, next);

    expect(state.session).toMatchObject({ attempted: 1, correct: 1, incorrect: 0 });
    expect(state.attempts).toHaveLength(1);
    expect(state.currentQuestion).toBe(next);
  });

  it('counts an incorrect answer', () => {
    const state = answer(startSession(), false);

    expect(state.session).toMatchObject({ attempted: 1, correct: 0, incorrect: 1 });
    expect(state.attempts[0].selfReportedCorrect).toBe(false);
  });

  it('ignores an attempt for a question that is no longer current', () => {
    const start = startSession();
    const afterFirst = answer(start, true);
    const stale = practiceSessionReducer(afterFirst, {
      type: 'record-attempt',
      attempt: afterFirst.attempts[0],
      nextQuestion: makeQuestion(),
    });

    expect(stale).toBe(afterFirst);
  });

  it('never counts the same question twice', () => {
    const start = startSession({ sessionLength: 10 });
    // Pretend the "next" question is the same one, then try to record it again.
    const afterFirst = answer(start, true, start.currentQuestion);
    const afterRepeat = answer(afterFirst, true, start.currentQuestion);

    expect(afterRepeat).toBe(afterFirst);
    expect(afterRepeat.session.attempted).toBe(1);
  });

  it('completes a fixed-length session after the last question', () => {
    const afterFirst = answer(startSession(), true);
    const lastQuestion = afterFirst.currentQuestion;
    const finished = answer(afterFirst, false);

    expect(finished.status).toBe('completed');
    expect(finished.session).toMatchObject({ attempted: 2, correct: 1, incorrect: 1 });
    expect(finished.session.completedAt).toBe('2026-10-20T10:05:00.000Z');
    expect(finished.currentQuestion).toBe(lastQuestion);
  });

  it('ends the session when there is no next question', () => {
    const start = startSession({ sessionLength: 10 });
    const state = practiceSessionReducer(start, {
      type: 'record-attempt',
      attempt: createAttempt({
        id: 'a-1',
        question: start.currentQuestion,
        sessionId: start.session.id,
        selectedAnswer: 56,
        selfReportedCorrect: true,
        attemptedAt: '2026-10-20T10:05:00.000Z',
      }),
      nextQuestion: null,
    });

    expect(state.status).toBe('completed');
    expect(state.session).toMatchObject({ attempted: 1, completedAt: '2026-10-20T10:05:00.000Z' });
  });

  it('ignores attempts after the session has completed', () => {
    const finished = answer(answer(startSession(), true), true);

    expect(answer(finished, true)).toBe(finished);
  });

  it('never completes continuous practice on its own', () => {
    let state = startSession({ sessionLength: 'continuous' });
    for (let i = 0; i < 50; i += 1) {
      state = answer(state, i % 2 === 0);
    }

    expect(state.status).toBe('active');
    expect(state.session).toMatchObject({ attempted: 50, correct: 25, incorrect: 25 });
  });
});

describe('practiceSessionReducer: ending a session', () => {
  it('ends an active session early', () => {
    const state = practiceSessionReducer(answer(startSession({ sessionLength: 10 }), true), {
      type: 'end-session',
      completedAt: '2026-10-20T10:09:00.000Z',
    });

    expect(state.status).toBe('completed');
    expect(state.session.completedAt).toBe('2026-10-20T10:09:00.000Z');
    expect(state.session.attempted).toBe(1);
  });

  it('keeps the original completion time if already completed', () => {
    const finished = answer(answer(startSession(), true), true);
    const state = practiceSessionReducer(finished, {
      type: 'end-session',
      completedAt: '2026-10-20T11:00:00.000Z',
    });

    expect(state).toBe(finished);
  });
});

describe('session length helpers', () => {
  it('returns the total for fixed sessions and null for continuous practice', () => {
    expect(getTotalQuestions(10)).toBe(10);
    expect(getTotalQuestions('continuous')).toBeNull();
  });

  it('detects when a fixed session has answered every question', () => {
    const { session } = startSession({ sessionLength: 5 });

    expect(hasReachedSessionLength({ ...session, attempted: 4 })).toBe(false);
    expect(hasReachedSessionLength({ ...session, attempted: 5 })).toBe(true);
    const continuousSession = { ...session, sessionLength: 'continuous' as const, attempted: 99 };
    expect(hasReachedSessionLength(continuousSession)).toBe(false);
  });
});

describe('generateNextQuestion', () => {
  it('uses the selected operations and level', () => {
    const question = generateNextQuestion(config, null, createSeededRandom(1));

    expect(question.operation).toBe('multiplication');
    expect(question.difficulty).toBe(2);
  });

  it('does not show the same problem twice in a row', () => {
    // Level 1 multiplication has only 36 problems, so repeats would be common.
    const smallConfig: PracticeConfig = { ...config, difficulty: 1 };
    const random = createSeededRandom(2);
    let previous = generateNextQuestion(smallConfig, null, random);
    for (let i = 0; i < 500; i += 1) {
      const next = generateNextQuestion(smallConfig, previous, random);
      expect(next.displayText).not.toBe(previous.displayText);
      previous = next;
    }
  });
});
