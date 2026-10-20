import { useReducer } from 'react';
import {
  createAttempt,
  createSessionState,
  generateNextQuestion,
  getTotalQuestions,
  practiceSessionReducer,
} from '../services/practiceSession';
import type { PracticeConfig } from '../types';
import { createId } from '../utils/ids';

export interface ReportedResult {
  selectedAnswer: number;
  selfReportedCorrect: boolean;
}

/**
 * Runs one practice session for the given setup: the current question,
 * running totals, the recorded attempts, and actions to record a result or
 * end the session early.
 *
 * Remount the component (for example with a new `key`) to start a fresh
 * session with the same setup.
 */
export function usePracticeSession(config: PracticeConfig) {
  const [state, dispatch] = useReducer(practiceSessionReducer, config, (initialConfig) =>
    createSessionState(initialConfig, {
      id: createId('s'),
      startedAt: new Date().toISOString(),
      firstQuestion: generateNextQuestion(initialConfig, null),
    }),
  );

  function recordResult({ selectedAnswer, selfReportedCorrect }: ReportedResult) {
    dispatch({
      type: 'record-attempt',
      attempt: createAttempt({
        id: createId('a'),
        question: state.currentQuestion,
        sessionId: state.session.id,
        selectedAnswer,
        selfReportedCorrect,
        attemptedAt: new Date().toISOString(),
      }),
      nextQuestion: generateNextQuestion(state.config, state.currentQuestion),
    });
  }

  function endSession() {
    dispatch({ type: 'end-session', completedAt: new Date().toISOString() });
  }

  return {
    session: state.session,
    attempts: state.attempts,
    currentQuestion: state.currentQuestion,
    isActive: state.status === 'active',
    /** One-based number of the question being shown. */
    questionNumber: state.session.attempted + 1,
    totalQuestions: getTotalQuestions(state.session.sessionLength),
    recordResult,
    endSession,
  };
}
