import { useAppData } from '../../app/AppDataContext';
import type { StorageFailure } from '../../services/storageService';
import { Button } from '../common/Button';
import styles from './StorageWarning.module.css';

const MESSAGES: Record<StorageFailure, string> = {
  unavailable:
    "This browser isn't letting the app save your progress, so it will be lost when you close the page. You can still keep practicing!",
  'quota-exceeded':
    "This browser's storage is full, so new progress can't be saved right now. You can still keep practicing!",
  unknown: 'Something went wrong while saving your progress. You can still keep practicing!',
};

/** A friendly, dismissible notice shown when progress cannot be saved (specification 11). */
function StorageWarning() {
  const { storageWarning, dismissStorageWarning } = useAppData();

  return (
    <div role="status" aria-label="Saving progress">
      {storageWarning === null ? null : (
        <div className={styles.warning}>
          <p className={styles.message}>{MESSAGES[storageWarning]}</p>
          <Button variant="secondary" onClick={dismissStorageWarning}>
            Got It
          </Button>
        </div>
      )}
    </div>
  );
}

export default StorageWarning;
