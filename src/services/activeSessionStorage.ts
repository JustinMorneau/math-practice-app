/**
 * Saves the session in progress so a page refresh can restore it
 * (specification section 11): the session and its attempts, the current
 * question, and the answer selected on the current card.
 */
import type { PracticeAttempt, Question } from '../types';
import { isPracticeAttempt, isPracticeConfig, isPracticeSession } from '../utils/validation';
import type { PracticeSessionState } from './practiceSession';
import { getQuestionErrors } from './questionValidation';
import { STORAGE_KEYS, appStorage, type StorageService, type WriteResult } from './storageService';

/** The current card's progress: the selected answer and whether it was flipped. */
export interface CardProgress {
  selectedAnswer: number | null;
  isFlipped: boolean;
}

export interface ActiveSessionRecord {
  /**
   * The browser history entry the session belongs to. A refresh keeps the
   * same entry, so the session is restored; starting practice again creates
   * a new entry, so a fresh session starts.
   */
  locationKey: string;
  state: PracticeSessionState;
  card: CardProgress;
}

function isQuestion(value: unknown): value is Question {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const question = value as Question;
  return (
    typeof question.id === 'string' &&
    (question.source === 'regular' || question.source === 'mistake-review') &&
    // Review questions may use numbers slightly outside the level's ranges.
    getQuestionErrors(question, { enforceDifficultyRanges: false }).length === 0
  );
}

/** A saved record that is complete and consistent, or null. */
export function parseActiveSession(value: unknown): ActiveSessionRecord | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { locationKey, state, card } = value as Record<string, unknown>;
  if (typeof locationKey !== 'string' || typeof state !== 'object' || state === null) {
    return null;
  }

  const { config, session, attempts, currentQuestion, status } = state as Record<string, unknown>;
  const validState =
    status === 'active' &&
    isPracticeConfig(config) &&
    isPracticeSession(session) &&
    Array.isArray(attempts) &&
    attempts.every(isPracticeAttempt) &&
    attempts.length === session.attempted &&
    attempts.every(({ sessionId }: PracticeAttempt) => sessionId === session.id) &&
    isQuestion(currentQuestion);
  if (!validState || typeof card !== 'object' || card === null) {
    return null;
  }

  const { selectedAnswer, isFlipped } = card as Record<string, unknown>;
  const { choices } = currentQuestion as Question;
  const validCard =
    (selectedAnswer === null ||
      (typeof selectedAnswer === 'number' && choices.includes(selectedAnswer))) &&
    typeof isFlipped === 'boolean' &&
    (!isFlipped || selectedAnswer !== null);
  return validCard ? (value as ActiveSessionRecord) : null;
}

/** The saved session in progress, or null when there is none or it is invalid. */
export function loadActiveSession(
  storage: StorageService = appStorage,
): ActiveSessionRecord | null {
  return storage.read(STORAGE_KEYS.activeSession, parseActiveSession, null).value;
}

export function saveActiveSession(
  record: ActiveSessionRecord,
  storage: StorageService = appStorage,
): WriteResult {
  return storage.write(STORAGE_KEYS.activeSession, record);
}

/** Forgets the session in progress, once it has ended or been left. */
export function clearActiveSession(storage: StorageService = appStorage): WriteResult {
  return storage.remove(STORAGE_KEYS.activeSession);
}
