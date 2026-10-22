/**
 * Data-schema versioning (specification section 11). The stored version is
 * compared with the version this code expects, and migrations upgrade older
 * data one version at a time.
 */
import { loadAttempts, saveAttempts } from './historyStorage';
import { STORAGE_KEYS, appStorage, type StorageService } from './storageService';

/** The data format this version of the app reads and writes. */
export const CURRENT_SCHEMA_VERSION = 2;

/**
 * Upgrades stored data from `toVersion - 1` to `toVersion`. A migration
 * should only touch the keys it changes, so a problem in one section of
 * the data never deletes the rest.
 */
export interface Migration {
  toVersion: number;
  migrate: (storage: StorageService) => void;
}

/**
 * Migrations in order. When the data format changes, add one here and raise
 * CURRENT_SCHEMA_VERSION.
 */
export const MIGRATIONS: readonly Migration[] = [
  {
    // Version 2 saves attempts in a compact array form (see attemptCodec).
    // Loading accepts both forms, so this rewrites the old objects compactly.
    toVersion: 2,
    migrate: (storage) => {
      const attempts = loadAttempts(storage);
      if (attempts.length > 0) {
        saveAttempts(attempts, storage);
      }
    },
  },
];

export type SchemaStatus =
  /** Storage could not be used; nothing was checked or written. */
  | 'unavailable'
  /** No version was stored, so the current version was recorded. */
  | 'initialized'
  /** The stored data already uses the current version. */
  | 'current'
  /** Older data was upgraded to the current version. */
  | 'migrated'
  /** The data was written by a newer version of the app; it is left untouched. */
  | 'newer';

interface VersionRecord {
  version: number;
}

function parseVersionRecord(value: unknown): VersionRecord | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { version } = value as Record<string, unknown>;
  return Number.isInteger(version) && (version as number) >= 1
    ? { version: version as number }
    : null;
}

/**
 * Makes sure stored data matches CURRENT_SCHEMA_VERSION, running any
 * migrations needed. Call once when the app starts.
 *
 * Data with no version record is treated as the current version: version 1
 * is the first format the app ever stored, so there is nothing older to
 * convert.
 */
export function ensureSchemaVersion(
  storage: StorageService = appStorage,
  migrations: readonly Migration[] = MIGRATIONS,
  currentVersion: number = CURRENT_SCHEMA_VERSION,
): SchemaStatus {
  const stored = storage.read(STORAGE_KEYS.version, parseVersionRecord, null);

  if (stored.status === 'unavailable') {
    return 'unavailable';
  }
  if (stored.value === null) {
    storage.write(STORAGE_KEYS.version, { version: currentVersion });
    return 'initialized';
  }

  const { version } = stored.value;
  if (version === currentVersion) {
    return 'current';
  }
  if (version > currentVersion) {
    return 'newer';
  }

  const pending = migrations
    .filter(({ toVersion }) => toVersion > version && toVersion <= currentVersion)
    .sort((a, b) => a.toVersion - b.toVersion);
  for (const migration of pending) {
    migration.migrate(storage);
    // Record progress after each step, so an interruption resumes correctly.
    storage.write(STORAGE_KEYS.version, { version: migration.toVersion });
  }
  storage.write(STORAGE_KEYS.version, { version: currentVersion });
  return 'migrated';
}
