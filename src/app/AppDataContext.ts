import { createContext, useContext } from 'react';
import type { StorageFailure, StorageService, WriteResult } from '../services/storageService';
import type { AppSettings } from '../types';

export interface AppDataContextValue {
  /** The storage the app saves to; components pass it to storage services. */
  storage: StorageService;
  settings: AppSettings;
  /** Changes some settings and saves them. */
  updateSettings: (changes: Partial<AppSettings>) => void;
  /** The most recent saving problem to tell the student about, if any. */
  storageWarning: StorageFailure | null;
  /** Shows a warning when a save failed; successful saves are ignored. */
  reportStorageResult: (result: WriteResult) => void;
  dismissStorageWarning: () => void;
  /** Erases all saved data and restores the default settings. */
  clearAllData: () => WriteResult;
}

export const AppDataContext = createContext<AppDataContextValue | null>(null);

/** Settings, storage, and storage warnings shared across the app. */
export function useAppData(): AppDataContextValue {
  const value = useContext(AppDataContext);
  if (value === null) {
    throw new Error('useAppData must be used inside <AppProvider>.');
  }
  return value;
}
