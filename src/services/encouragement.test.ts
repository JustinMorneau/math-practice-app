import { describe, expect, it } from 'vitest';
import { calculateAccuracy } from '../utils/math';
import { getEncouragement } from './encouragement';

function encouragementFor(correct: number, attempted: number) {
  return getEncouragement({
    attempted,
    correct,
    incorrect: attempted - correct,
    accuracy: calculateAccuracy(correct, attempted),
  });
}

describe('getEncouragement', () => {
  it.each([
    [10, 10, 'Perfect score!'],
    [19, 20, 'Amazing work!'],
    [9, 10, 'Amazing work!'],
    [8, 10, 'Great job!'],
    [6, 10, 'Good effort!'],
    [3, 10, 'Thanks for practicing!'],
    [0, 10, 'Thanks for practicing!'],
  ])('%i of %i right gives "%s"', (correct, attempted, headline) => {
    expect(encouragementFor(correct, attempted).headline).toBe(headline);
  });

  it('only calls a session perfect when every answer was right', () => {
    expect(encouragementFor(199, 200).headline).not.toBe('Perfect score!');
  });

  it('handles a session with no answers', () => {
    expect(encouragementFor(0, 0)).toMatchObject({
      headline: 'Ready when you are!',
      reviewTip: null,
    });
  });

  it('suggests reviewing missed questions only when there were some', () => {
    expect(encouragementFor(7, 10).reviewTip).toMatch(/missed/);
    expect(encouragementFor(10, 10).reviewTip).toBeNull();
  });

  it('never uses discouraging words, even for low scores', () => {
    for (let correct = 0; correct <= 10; correct += 1) {
      const { headline, message, reviewTip } = encouragementFor(correct, 10);
      const text = `${headline} ${message} ${reviewTip ?? ''}`.toLowerCase();
      for (const word of ['wrong', 'bad', 'fail', 'poor', 'terrible', 'disappoint']) {
        expect(text).not.toContain(word);
      }
    }
  });
});
