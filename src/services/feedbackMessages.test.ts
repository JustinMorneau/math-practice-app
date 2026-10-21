import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../test/random';
import { POSITIVE_FEEDBACK, SUPPORTIVE_FEEDBACK, pickFeedback } from './feedbackMessages';

describe('pickFeedback', () => {
  it('praises a correct answer', () => {
    expect(POSITIVE_FEEDBACK).toContain(pickFeedback(true));
  });

  it('supports the student after a missed answer', () => {
    expect(SUPPORTIVE_FEEDBACK).toContain(pickFeedback(false));
  });

  it('never repeats the previous message', () => {
    const random = createSeededRandom(1);
    let previous: string | null = null;
    for (let i = 0; i < 300; i += 1) {
      const message = pickFeedback(i % 3 !== 0, previous, random);
      expect(message).not.toBe(previous);
      previous = message;
    }
  });

  it('uses a variety of messages', () => {
    const random = createSeededRandom(2);
    const seen = new Set(Array.from({ length: 100 }, () => pickFeedback(true, null, random)));

    expect(seen.size).toBe(POSITIVE_FEEDBACK.length);
  });

  it('keeps every message short enough for one line on a small phone', () => {
    for (const message of [...POSITIVE_FEEDBACK, ...SUPPORTIVE_FEEDBACK]) {
      expect(message.length).toBeLessThanOrEqual(26);
    }
  });

  it('never uses shaming or discouraging words', () => {
    const everything = [...POSITIVE_FEEDBACK, ...SUPPORTIVE_FEEDBACK].join(' ').toLowerCase();
    for (const word of ['wrong', 'bad', 'fail', 'poor', 'terrible', 'stupid', 'disappoint']) {
      expect(everything).not.toContain(word);
    }
  });
});
