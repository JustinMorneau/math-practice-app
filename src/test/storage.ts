/** Ways a fake storage can fail, to test error handling. */
export type StorageFailureMode = 'none' | 'quota-exceeded' | 'write-error' | 'read-error';

/**
 * An in-memory implementation of the browser Storage interface, with
 * optional failures for testing.
 */
export class MemoryStorage implements Storage {
  // Required by the Storage interface, which allows property-style access.
  [name: string]: unknown;

  private readonly items = new Map<string, string>();
  failureMode: StorageFailureMode;

  constructor(initial: Record<string, string> = {}, failureMode: StorageFailureMode = 'none') {
    for (const [key, value] of Object.entries(initial)) {
      this.items.set(key, value);
    }
    this.failureMode = failureMode;
  }

  get length(): number {
    return this.items.size;
  }

  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    if (this.failureMode === 'read-error') {
      throw new Error('Storage read failed');
    }
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failureMode === 'quota-exceeded') {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    }
    if (this.failureMode === 'write-error') {
      throw new Error('Storage write failed');
    }
    this.items.set(key, value);
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }

  clear(): void {
    this.items.clear();
  }
}
