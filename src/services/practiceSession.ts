/**
 * Practice-session state and the rules for updating it (specification
 * sections 6.3, 6.5, and 18). Everything here is pure, so it can be tested
 * without React; usePracticeSession connects it to components.
 */
import type {
  PracticeAttempt,
  PracticeConfig,
  PracticeSession,
  Question,
  SessionLength,
} from '../types';
import type { RandomSource } from '../utils/math';
import { generateQuestionForOperations } from './questionGenerator';

/** How many times to regenerate rather than show the same problem twice in a row. */
export const MAX_REPEAT_AVOIDANCE_ATTEMPTS = 10;

export type SessionStatus = 'active' | 'completed';

export interface PracticeSessionState {
  config: PracticeConfig;
  /** Running totals; `attempted` is also the zero-based index of the current question. */
  session: PracticeSession;
  attempts: PracticeAttempt[];
  currentQuestion: Question;
  status: SessionStatus;
}

export type PracticeSessionAction =
  /** `nextQuestion` is ignored when this attempt completes the session. */
  | { type: 'record-attempt'; attempt: PracticeAttempt; nextQuestion: Question }
  | { type: 'end-session'; completedAt: string };

interface NewSessionDetails {
  id: string;
  /** ISO 8601 timestamp. */
  startedAt: string;
  firstQuestion: Question;
}

export function createSessionState(
  config: PracticeConfig,
  { id, startedAt, firstQuestion }: NewSessionDetails,
): PracticeSessionState {
  return {
    config,
    session: {
      id,
      startedAt,
      operations: [...config.operations],
      difficulty: config.difficulty,
      sessionLength: config.sessionLength,
      attempted: 0,
      correct: 0,
      incorrect: 0,
    },
    attempts: [],
    currentQuestion: firstQuestion,
    status: 'active',
  };
}

/** The fixed number of questions, or null for continuous practice. */
export function getTotalQuestions(sessionLength: SessionLength): number | null {
  return sessionLength === 'continuous' ? null : sessionLength;
}

/** Whether a fixed-length session has answered all of its questions. */
export function hasReachedSessionLength({ sessionLength, attempted }: PracticeSession): boolean {
  const total = getTotalQuestions(sessionLength);
  return total !== null && attempted >= total;
}

interface AttemptDetails {
  id: string;
  question: Question;
  sessionId: string;
  selectedAnswer: number;
  selfReportedCorrect: boolean;
  /** ISO 8601 timestamp. */
  attemptedAt: string;
}

/** A record of one answered question (specification section 10.1). */
export function createAttempt({
  id,
  question,
  sessionId,
  selectedAnswer,
  selfReportedCorrect,
  attemptedAt,
}: AttemptDetails): PracticeAttempt {
  return {
    id,
    questionId: question.id,
    operation: question.operation,
    firstOperand: question.firstOperand,
    secondOperand: question.secondOperand,
    correctAnswer: question.correctAnswer,
    selectedAnswer,
    selfReportedCorrect,
    difficulty: question.difficulty,
    source: question.source,
    attemptedAt,
    sessionId,
  };
}

/**
 * Applies an action to the session. Attempts are ignored when the session
 * has ended, when they are for a question other than the current one, or
 * when that question was already recorded, so every question counts once.
 */
export function practiceSessionReducer(
  state: PracticeSessionState,
  action: PracticeSessionAction,
): PracticeSessionState {
  switch (action.type) {
    case 'record-attempt': {
      const { attempt, nextQuestion } = action;
      const isDuplicate = state.attempts.some(
        ({ questionId }) => questionId === attempt.questionId,
      );
      if (
        state.status !== 'active' ||
        attempt.questionId !== state.currentQuestion.id ||
        isDuplicate
      ) {
        return state;
      }

      const session: PracticeSession = {
        ...state.session,
        attempted: state.session.attempted + 1,
        correct: state.session.correct + (attempt.selfReportedCorrect ? 1 : 0),
        incorrect: state.session.incorrect + (attempt.selfReportedCorrect ? 0 : 1),
      };
      const attempts = [...state.attempts, attempt];

      if (hasReachedSessionLength(session)) {
        return {
          ...state,
          session: { ...session, completedAt: attempt.attemptedAt },
          attempts,
          status: 'completed',
        };
      }
      return { ...state, session, attempts, currentQuestion: nextQuestion };
    }
    case 'end-session': {
      if (state.status !== 'active') {
        return state;
      }
      return {
        ...state,
        session: { ...state.session, completedAt: action.completedAt },
        status: 'completed',
      };
    }
  }
}

/**
 * The next question for the session, regenerated when it would repeat the
 * previous problem exactly.
 */
export function generateNextQuestion(
  config: PracticeConfig,
  previous: Question | null,
  random: RandomSource = Math.random,
): Question {
  const generate = () =>
    generateQuestionForOperations(config.operations, config.difficulty, random);

  let question = generate();
  let attempts = 1;
  while (
    previous !== null &&
    question.displayText === previous.displayText &&
    attempts < MAX_REPEAT_AVOIDANCE_ATTEMPTS
  ) {
    question = generate();
    attempts += 1;
  }
  return question;
}
