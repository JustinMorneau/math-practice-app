let fallbackCounter = 0;

/**
 * A unique ID such as `"q-3f2b…"`, optionally with a readable prefix.
 *
 * Uses crypto.randomUUID when available. Browsers only provide it on secure
 * pages (HTTPS or localhost), so opening the dev server from a tablet by IP
 * address over plain HTTP uses the fallback instead.
 */
export function createId(prefix?: string): string {
  const unique =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : createFallbackId();
  return prefix ? `${prefix}-${unique}` : unique;
}

function createFallbackId(): string {
  fallbackCounter += 1;
  const time = Date.now().toString(36);
  const count = fallbackCounter.toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${time}-${count}-${randomPart}`;
}
