/**
 * Records a finished attempt everywhere it matters: the attempt history,
 * the aggregate statistics, and (for incorrect answers) the mistake
 * patterns used for review.
 */
import type { PracticeAttempt } from '../types';
import { createId } from '../utils/ids';
import { loadAttempts, saveAttempt } from './historyStorage';
import { limitMistakePatterns, recordIncorrectAnswer } from './mistakePatterns';
import { loadMistakePatterns, saveMistakePatterns } from './mistakeStorage';
import { addAttemptToStatistics } from './statisticsService';
import { loadStatistics, saveStatistics } from './statisticsStorage';
import { appStorage, type StorageService, type WriteResult } from './storageService';

/**
 * Saves an attempt, adds it to the statistics, and records a mistake
 * pattern when the student reported it as incorrect. Recording the same
 * attempt again does nothing, so nothing is ever counted twice.
 */
export function recordAttempt(
  attempt: PracticeAttempt,
  storage: StorageService = appStorage,
): WriteResult {
  if (loadAttempts(storage).some(({ id }) => id === attempt.id)) {
    return { ok: true };
  }

  // Load first: if statistics must be rebuilt from attempts, this attempt
  // must not be in the list yet, or it would be counted twice.
  const statistics = loadStatistics(storage);
  const saved = saveAttempt(attempt, storage);
  if (!saved.ok) {
    return saved;
  }

  const statisticsSaved = saveStatistics(addAttemptToStatistics(statistics, attempt), storage);
  if (!statisticsSaved.ok || attempt.selfReportedCorrect) {
    return statisticsSaved;
  }

  const { patterns } = loadMistakePatterns(storage);
  const updated = recordIncorrectAnswer(patterns, attempt, createId('m'));
  return saveMistakePatterns(limitMistakePatterns(updated), storage);
}
