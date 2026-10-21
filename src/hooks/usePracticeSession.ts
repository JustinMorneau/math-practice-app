import { useEffect, useReducer } from 'react';
import { useAppData } from '../app/AppDataContext';
import { recordAttempt } from '../services/attemptRecorder';
import { saveSession } from '../services/historyStorage';
import { generateReviewQuestion } from '../services/mistakeReview';
import { loadMistakePatterns } from '../services/mistakeStorage';
import {
  createAttempt,
  createSessionState,
  generateNextQuestion,
  getTotalQuestions,
  practiceSessionReducer,
} from '../services/practiceSession';
import type { StorageService } from '../services/storageService';
import type { PracticeAttempt, PracticeConfig, Question } from '../types';
import { formatProblemText } from '../utils/format';
import { createId } from '../utils/ids';

export interface ReportedResult {
  selectedAnswer: number;
  selfReportedCorrect: boolean;
}

/** How many recent questions a review session avoids repeating. */
const RECENT_REVIEW_QUESTIONS = 5;

/**
 * The next question for a session. Regular sessions generate a new
 * question; review sessions build one from the highest-priority mistakes
 * still to review, and return null when none are left.
 */
interface ChoiceContext {
  attempts: readonly PracticeAttempt[];
  storage: StorageService;
  masteryThreshold: number;
}

function chooseNextQuestion(
  config: PracticeConfig,
  previous: Question | null,
  { attempts, storage, masteryThreshold }: ChoiceContext,
): Question | null {
  if (config.mode !== 'mistake-review') {
    return generateNextQuestion(config, previous);
  }
  const recentDisplayTexts = attempts
    .slice(-RECENT_REVIEW_QUESTIONS)
    .map(({ operation, firstOperand, secondOperand }) =>
      formatProblemText(operation, firstOperand, secondOperand),
    );
  return generateReviewQuestion(loadMistakePatterns(storage).patterns, {
    masteryThreshold,
    previousPatternId: previous?.mistakePatternId,
    recentDisplayTexts,
  });
}

/**
 * Runs one practice session for the given setup: the current question,
 * running totals, the recorded attempts, and actions to record a result or
 * end the session early.
 *
 * Each attempt is saved the moment the student reports it, along with its
 * statistics and mistake-pattern updates, before the next question is
 * chosen, so review sessions always see current mastery progress. The
 * session record is saved once its first question is answered, so setups
 * that were opened and abandoned are not stored.
 *
 * Review sessions need at least one active mistake to start (the practice
 * page checks this), and end early once every mistake is mastered.
 *
 * Remount the component (for example with a new `key`) to start a fresh
 * session with the same setup.
 */
export function usePracticeSession(config: PracticeConfig) {
  const { storage, settings, reportStorageResult } = useAppData();
  const { masteryThreshold } = settings;

  const [state, dispatch] = useReducer(practiceSessionReducer, config, (initialConfig) =>
    createSessionState(initialConfig, {
      id: createId('s'),
      startedAt: new Date().toISOString(),
      firstQuestion:
        chooseNextQuestion(initialConfig, null, { attempts: [], storage, masteryThreshold }) ??
        generateNextQuestion(initialConfig, null),
    }),
  );

  // Saving is idempotent, so effects running twice in development are harmless.
  useEffect(() => {
    if (state.session.attempted > 0) {
      reportStorageResult(saveSession(state.session, storage));
    }
  }, [state.session, storage, reportStorageResult]);

  function recordResult({ selectedAnswer, selfReportedCorrect }: ReportedResult) {
    const attempt = createAttempt({
      id: createId('a'),
      question: state.currentQuestion,
      sessionId: state.session.id,
      selectedAnswer,
      selfReportedCorrect,
      attemptedAt: new Date().toISOString(),
    });
    reportStorageResult(recordAttempt(attempt, storage, { masteryThreshold }));

    // After the last question of a fixed-length session there is nothing to
    // show next, so skip choosing one.
    const total = getTotalQuestions(state.session.sessionLength);
    const isLastQuestion = total !== null && state.session.attempted + 1 >= total;
    const context = { attempts: [...state.attempts, attempt], storage, masteryThreshold };
    const nextQuestion = isLastQuestion
      ? state.currentQuestion
      : chooseNextQuestion(state.config, state.currentQuestion, context);

    dispatch({ type: 'record-attempt', attempt, nextQuestion });
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
