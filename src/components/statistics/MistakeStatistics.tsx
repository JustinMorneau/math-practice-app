import { useMemo } from 'react';
import {
  formatMistakeFact,
  getMostMissedOperations,
  sortByMostMissed,
  summarizeMistakes,
} from '../../services/mistakeStatistics';
import type { AppStatistics, MistakePattern, PracticeAttempt } from '../../types';
import { formatDateTime, formatOperationList } from '../../utils/format';
import StatGrid from './StatGrid';
import styles from './MistakeStatistics.module.css';

interface MistakeStatisticsProps {
  patterns: readonly MistakePattern[];
  attempts: readonly PracticeAttempt[];
  statistics: AppStatistics;
  masteryThreshold: number;
}

/** How many of the most missed facts to list. */
const MOST_MISSED_FACTS_SHOWN = 5;

/** "Mastered", or review progress such as "1 of 3 right". */
function formatProgress(pattern: MistakePattern, masteryThreshold: number): string {
  if (pattern.mastered) {
    return 'Mastered';
  }
  return `${Math.min(pattern.similarCorrectCount, masteryThreshold)} of ${masteryThreshold} right`;
}

/** "1 time" or "3 times". */
function formatTimes(count: number): string {
  return count === 1 ? '1 time' : `${count} times`;
}

/**
 * Mistake review statistics (specification section 6.6): totals, the most
 * missed operation and facts, and every mistake with its progress.
 */
function MistakeStatistics({
  patterns,
  attempts,
  statistics,
  masteryThreshold,
}: MistakeStatisticsProps) {
  // Sorting and summarizing hundreds of mistakes is only redone when the
  // underlying data changes, not on every re-render of the page.
  const summary = useMemo(() => summarizeMistakes(patterns, attempts), [patterns, attempts]);
  const mostMissedOperations = useMemo(() => getMostMissedOperations(statistics), [statistics]);
  const sorted = useMemo(() => sortByMostMissed(patterns), [patterns]);

  if (patterns.length === 0) {
    return (
      <p className={styles.empty}>
        No mistakes yet! Questions you mark "I Got It Wrong" will show up here so you can review
        them.
      </p>
    );
  }

  const active = sorted.filter(({ mastered }) => !mastered);
  const mastered = sorted.filter((pattern) => pattern.mastered);

  return (
    <div className={styles.mistakes}>
      <StatGrid
        items={[
          { label: 'To review', value: summary.activeCount, highlight: true },
          { label: 'Mastered', value: summary.masteredCount },
          { label: 'Review questions', value: summary.reviewAttempted },
          { label: 'Review answers right', value: summary.reviewCorrect },
        ]}
      />

      {mostMissedOperations.length > 0 ? (
        <p className={styles.mostMissed}>
          Most often missed: <strong>{formatOperationList(mostMissedOperations)}</strong>
        </p>
      ) : null}

      <div className={styles.group}>
        <h3>Most missed facts</h3>
        <ol className={styles.topFacts}>
          {sorted.slice(0, MOST_MISSED_FACTS_SHOWN).map((pattern) => (
            <li key={pattern.id}>
              <span className={styles.fact}>{formatMistakeFact(pattern)}</span>
              <span className={styles.detail}>missed {formatTimes(pattern.incorrectCount)}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.group}>
        <h3>Mistakes to review</h3>
        {active.length > 0 ? (
          <MistakeList patterns={active} masteryThreshold={masteryThreshold} />
        ) : (
          <p>Every mistake is mastered. Great work!</p>
        )}
      </div>

      {mastered.length > 0 ? (
        <details className={styles.mastered}>
          <summary>Mastered mistakes ({mastered.length})</summary>
          <MistakeList patterns={mastered} masteryThreshold={masteryThreshold} />
        </details>
      ) : null}
    </div>
  );
}

interface MistakeListProps {
  patterns: readonly MistakePattern[];
  masteryThreshold: number;
}

/** Each mistake with how often it was missed, its mastery progress, and when it was last missed. */
function MistakeList({ patterns, masteryThreshold }: MistakeListProps) {
  return (
    <ul className={styles.list}>
      {patterns.map((pattern) => {
        const progress = Math.min(pattern.similarCorrectCount, masteryThreshold);
        const progressText = formatProgress(pattern, masteryThreshold);
        return (
          <li key={pattern.id} className={styles.item}>
            <span className={styles.fact}>{formatMistakeFact(pattern)}</span>
            <dl className={styles.details}>
              <div>
                <dt>Missed</dt>
                <dd>{formatTimes(pattern.incorrectCount)}</dd>
              </div>
              <div>
                <dt>Progress</dt>
                <dd>{progressText}</dd>
              </div>
              <div>
                <dt>Last missed</dt>
                <dd>
                  <time dateTime={pattern.lastIncorrectAt}>
                    {formatDateTime(pattern.lastIncorrectAt)}
                  </time>
                </dd>
              </div>
            </dl>
            {pattern.mastered ? null : (
              <div className={styles.meter} aria-hidden="true">
                <div
                  className={styles.meterFill}
                  style={{ width: `${(progress / masteryThreshold) * 100}%` }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default MistakeStatistics;
