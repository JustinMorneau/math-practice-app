/**
 * Records a finished attempt everywhere it matters: the attempt history,
 * the aggregate statistics, and (for incorrect answers) the mistake
 * patterns used for review.
 */
import { DEFAULT_MASTERY_THRESHOLD } from '../constants/defaultSettings';
import type { PracticeAttempt } from '../types';
import { createId } from '../utils/ids';
import { loadAttempts, saveAttempts } from './historyStorage';
import { limitMistakePatterns, recordIncorrectAnswer, recordReviewAnswer } from './mistakePatterns';
import { loadMistakePatterns, saveMistakePatterns } from './mistakeStorage';
import { addAttemptToStatistics } from './statisticsService';
import { loadStatistics, saveStatistics } from './statisticsStorage';
import { appStorage, type StorageService, type WriteResult } from './storageService';

export interface RecordAttemptOptions {
  /** Correct review answers needed to master a mistake (from settings). */
  masteryThreshold?: number;
}

/**
 * Saves an attempt, adds it to the statistics, and updates mistake
 * patterns:
 * - an incorrect answer creates or updates the pattern for that fact
 * - a mistake-review answer moves its original pattern toward mastery when
 *   correct, or one step back when incorrect
 *
 * Recording the same attempt again does nothing, so nothing is ever
 * counted twice.
 */
export function recordAttempt(
  attempt: PracticeAttempt,
  storage: StorageService = appStorage,
  { masteryThreshold = DEFAULT_MASTERY_THRESHOLD }: RecordAttemptOptions = {},
): WriteResult {
  // The attempt list is read once and written once: it is the largest piece
  // of saved data, so this keeps recording an answer fast.
  const attempts = loadAttempts(storage);
  if (attempts.some(({ id }) => id === attempt.id)) {
    return { ok: true };
  }

  // Load first: if statistics must be rebuilt from attempts, this attempt
  // must not be in the list yet, or it would be counted twice.
  const statistics = loadStatistics(storage, attempts);
  const saved = saveAttempts([...attempts, attempt], storage);
  if (!saved.ok) {
    return saved;
  }

  const statisticsSaved = saveStatistics(addAttemptToStatistics(statistics, attempt), storage);
  const affectsMistakes = !attempt.selfReportedCorrect || attempt.mistakePatternId !== undefined;
  if (!statisticsSaved.ok || !affectsMistakes) {
    return statisticsSaved;
  }

  let { patterns } = loadMistakePatterns(storage);
  if (attempt.mistakePatternId !== undefined) {
    patterns = recordReviewAnswer(
      patterns,
      attempt.mistakePatternId,
      attempt.selfReportedCorrect,
      masteryThreshold,
    );
  }
  if (!attempt.selfReportedCorrect) {
    patterns = recordIncorrectAnswer(patterns, attempt, createId('m'));
  }
  return saveMistakePatterns(limitMistakePatterns(patterns), storage);
}
