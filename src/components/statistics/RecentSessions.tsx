import type { PracticeSession } from '../../types';
import { formatDateTime, formatDifficulty, formatOperationList } from '../../utils/format';
import { calculateAccuracy } from '../../utils/math';
import styles from './RecentSessions.module.css';

/** Recent sessions, in the order given (newest first). */
function RecentSessions({ sessions }: { sessions: readonly PracticeSession[] }) {
  return (
    <ol className={styles.list}>
      {sessions.map((session) => (
        <li key={session.id} className={styles.session}>
          <p className={styles.when}>
            <time dateTime={session.startedAt}>{formatDateTime(session.startedAt)}</time>
            {session.completedAt ? null : <span className={styles.badge}>Not finished</span>}
          </p>
          <p className={styles.setup}>
            {formatOperationList(session.operations)}, {formatDifficulty(session.difficulty)} level
          </p>
          <dl className={styles.counts}>
            <div>
              <dt>Answered</dt>
              <dd>{session.attempted}</dd>
            </div>
            <div>
              <dt>Got right</dt>
              <dd>{session.correct}</dd>
            </div>
            <div>
              <dt>To practice</dt>
              <dd>{session.incorrect}</dd>
            </div>
            <div>
              <dt>Accuracy</dt>
              <dd>{calculateAccuracy(session.correct, session.attempted)}%</dd>
            </div>
          </dl>
        </li>
      ))}
    </ol>
  );
}

export default RecentSessions;
