let fallbackCounter = 0;

/** Random bytes in each ID: 64 bits, so collisions are practically impossible. */
const RANDOM_BYTES = 8;

/**
 * A short unique ID such as `"q-3f2b9c41d07e5a68"`, optionally with a
 * readable prefix. IDs are stored with every attempt, so they are kept short
 * to keep saved progress compact.
 *
 * Uses crypto.getRandomValues, which browsers provide on every page
 * (including the dev server opened from a tablet over plain HTTP), with a
 * fallback for environments without it.
 */
export function createId(prefix?: string): string {
  const unique =
    typeof globalThis.crypto?.getRandomValues === 'function'
      ? createRandomId()
      : createFallbackId();
  return prefix ? `${prefix}-${unique}` : unique;
}

function createRandomId(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(RANDOM_BYTES));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function createFallbackId(): string {
  fallbackCounter += 1;
  const time = Date.now().toString(36);
  const count = fallbackCounter.toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${time}-${count}-${randomPart}`;
}
