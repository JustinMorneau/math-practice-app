import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ensureSchemaVersion } from '../services/schemaMigrations';
import { loadSettings, saveSettings } from '../services/settingsStorage';
import {
  appStorage,
  type StorageFailure,
  type StorageService,
  type WriteResult,
} from '../services/storageService';
import type { AppSettings } from '../types';
import { AppDataContext, type AppDataContextValue } from './AppDataContext';

interface AppProviderProps {
  children: ReactNode;
  /** Defaults to the browser's localStorage; tests pass in-memory storage. */
  storage?: StorageService;
}

/**
 * Prepares stored data when the app starts (schema version, then settings)
 * and shares settings and storage warnings with every page.
 */
function AppProvider({ children, storage = appStorage }: AppProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    ensureSchemaVersion(storage);
    return loadSettings(storage).settings;
  });
  const [storageWarning, setStorageWarning] = useState<StorageFailure | null>(
    storage.isAvailable ? null : 'unavailable',
  );
  // Once dismissed, the same kind of warning is not shown again this visit.
  const [dismissedWarnings, setDismissedWarnings] = useState<ReadonlySet<StorageFailure>>(
    () => new Set(),
  );

  const reportStorageResult = useCallback(
    (result: WriteResult) => {
      if (!result.ok && !dismissedWarnings.has(result.reason)) {
        setStorageWarning(result.reason);
      }
    },
    [dismissedWarnings],
  );

  const updateSettings = useCallback(
    (changes: Partial<AppSettings>) => {
      const next = { ...settings, ...changes };
      setSettings(next);
      reportStorageResult(saveSettings(next, storage));
    },
    [settings, storage, reportStorageResult],
  );

  const dismissStorageWarning = useCallback(() => {
    if (storageWarning !== null) {
      setDismissedWarnings((current) => new Set(current).add(storageWarning));
    }
    setStorageWarning(null);
  }, [storageWarning]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      storage,
      settings,
      updateSettings,
      storageWarning,
      reportStorageResult,
      dismissStorageWarning,
    }),
    [storage, settings, updateSettings, storageWarning, reportStorageResult, dismissStorageWarning],
  );

  return <AppDataContext value={value}>{children}</AppDataContext>;
}

export default AppProvider;
