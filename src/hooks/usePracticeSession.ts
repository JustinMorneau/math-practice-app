import { useEffect, useReducer, useRef, useState } from 'react';
import { useAppData } from '../app/AppDataContext';
import {
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
  type CardProgress,
} from '../services/activeSessionStorage';
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

const NO_CARD_PROGRESS: CardProgress = { selectedAnswer: null, isFlipped: false };

/** Whether two setups describe the same session. */
function isSameSetup(a: PracticeConfig, b: PracticeConfig): boolean {
  const normalize = ({ operations, difficulty, sessionLength, mode }: PracticeConfig) =>
    JSON.stringify([operations, difficulty, sessionLength, mode ?? 'regular']);
  return normalize(a) === normalize(b);
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
 * The session in progress, including the current card's selected answer,
 * is also saved under `locationKey` (the browser history entry). A page
 * refresh keeps the same entry, so the session is restored exactly where it
 * was; starting practice again creates a new entry and a fresh session. The
 * saved copy is cleared when the session ends.
 *
 * Remount the component (for example with a new `key`) to start a fresh
 * session with the same setup.
 */
export function usePracticeSession(
  config: PracticeConfig,
  { locationKey }: { locationKey: string },
) {
  const { storage, settings, reportStorageResult } = useAppData();
  const { masteryThreshold } = settings;

  // A session saved for this same history entry is one interrupted by a refresh.
  const [restored] = useState(() => {
    const record = loadActiveSession(storage);
    const matches = record?.locationKey === locationKey && isSameSetup(record.state.config, config);
    return matches ? record : null;
  });

  function createInitialState(initialConfig: PracticeConfig) {
    if (restored) {
      return restored.state;
    }
    const choiceContext = { attempts: [], storage, masteryThreshold };
    return createSessionState(initialConfig, {
      id: createId('s'),
      startedAt: new Date().toISOString(),
      firstQuestion:
        chooseNextQuestion(initialConfig, null, choiceContext) ??
        generateNextQuestion(initialConfig, null),
    });
  }

  const [state, dispatch] = useReducer(practiceSessionReducer, config, createInitialState);
  // The current card's progress only needs saving, not displaying, so it is
  // kept in a ref: selecting an answer or flipping the card re-renders just
  // the card, not the whole practice page.
  const cardProgress = useRef<CardProgress>(restored?.card ?? NO_CARD_PROGRESS);

  // Keep the saved copy of the session in progress up to date, and forget it
  // once the session ends.
  useEffect(() => {
    if (state.status === 'active') {
      const record = { locationKey, state, card: cardProgress.current };
      reportStorageResult(saveActiveSession(record, storage));
    } else {
      clearActiveSession(storage);
    }
  }, [state, locationKey, storage, reportStorageResult]);

  function updateCardProgress(progress: CardProgress) {
    cardProgress.current = progress;
    reportStorageResult(saveActiveSession({ locationKey, state, card: progress }, storage));
  }

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

    cardProgress.current = NO_CARD_PROGRESS;
    dispatch({ type: 'record-attempt', attempt, nextQuestion });
  }

  function endSession() {
    dispatch({ type: 'end-session', completedAt: new Date().toISOString() });
  }

  /**
   * Ends the session while leaving the practice page: it is saved as ended
   * right away, since the page closes before effects would run.
   */
  function leaveSession() {
    if (state.session.attempted > 0) {
      const ended = { ...state.session, completedAt: new Date().toISOString() };
      reportStorageResult(saveSession(ended, storage));
    }
    clearActiveSession(storage);
  }

  return {
    session: state.session,
    attempts: state.attempts,
    currentQuestion: state.currentQuestion,
    isActive: state.status === 'active',
    /** One-based number of the question being shown. */
    questionNumber: state.session.attempted + 1,
    totalQuestions: getTotalQuestions(state.session.sessionLength),
    /** Where the current card starts: its saved progress if it was restored after a refresh. */
    initialCardProgress:
      restored?.state.currentQuestion.id === state.currentQuestion.id ? restored.card : undefined,
    updateCardProgress,
    recordResult,
    endSession,
    leaveSession,
  };
}
