import { useEffect, useReducer } from 'react';
import { useAppData } from '../app/AppDataContext';
import { saveAttempt, saveSession } from '../services/historyStorage';
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
 * The session and every attempt are saved as they happen, so progress
 * survives closing the browser. A session is saved once its first question
 * is answered, so setups that were opened and abandoned are not stored.
 *
 * Remount the component (for example with a new `key`) to start a fresh
 * session with the same setup.
 */
export function usePracticeSession(config: PracticeConfig) {
  const { storage, reportStorageResult } = useAppData();
  const [state, dispatch] = useReducer(practiceSessionReducer, config, (initialConfig) =>
    createSessionState(initialConfig, {
      id: createId('s'),
      startedAt: new Date().toISOString(),
      firstQuestion: generateNextQuestion(initialConfig, null),
    }),
  );

  // Saving is idempotent, so effects running twice in development are harmless.
  useEffect(() => {
    if (state.session.attempted > 0) {
      reportStorageResult(saveSession(state.session, storage));
    }
  }, [state.session, storage, reportStorageResult]);

  useEffect(() => {
    const latestAttempt = state.attempts.at(-1);
    if (latestAttempt) {
      reportStorageResult(saveAttempt(latestAttempt, storage));
    }
  }, [state.attempts, storage, reportStorageResult]);

  function recordResult({ selectedAnswer, selfReportedCorrect }: ReportedResult) {
    // After the last question of a fixed-length session there is nothing to
    // show next, so skip generating one.
    const total = getTotalQuestions(state.session.sessionLength);
    const isLastQuestion = total !== null && state.session.attempted + 1 >= total;

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
      nextQuestion: isLastQuestion
        ? state.currentQuestion
        : generateNextQuestion(state.config, state.currentQuestion),
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
