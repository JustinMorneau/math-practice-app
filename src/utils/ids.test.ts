import { afterEach, describe, expect, it, vi } from 'vitest';
import { createId } from './ids';

describe('createId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a non-empty string', () => {
    expect(createId()).toMatch(/\S+/);
  });

  it('adds a prefix when given one', () => {
    expect(createId('q')).toMatch(/^q-\S+$/);
  });

  it('is short, to keep saved progress compact', () => {
    expect(createId('a')).toMatch(/^a-[0-9a-f]{16}$/);
  });

  it('does not repeat', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId()));
    expect(ids.size).toBe(1000);
  });

  it('still creates unique ids when crypto is unavailable', () => {
    vi.stubGlobal('crypto', {});
    const ids = new Set(Array.from({ length: 1000 }, () => createId('s')));
    expect(ids.size).toBe(1000);
    for (const id of ids) {
      expect(id).toMatch(/^s-\S+$/);
    }
  });
});
