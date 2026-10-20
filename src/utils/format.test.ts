import { describe, expect, it } from 'vitest';
import { formatDifficulty, formatOperationList, formatSessionLength } from './format';

describe('formatOperationList', () => {
  it('formats one operation', () => {
    expect(formatOperationList(['addition'])).toBe('Addition');
  });

  it('formats two operations', () => {
    expect(formatOperationList(['addition', 'division'])).toBe('Addition and Division');
  });

  it('formats several operations as a list', () => {
    expect(formatOperationList(['addition', 'subtraction', 'multiplication', 'division'])).toBe(
      'Addition, Subtraction, Multiplication, and Division',
    );
  });
});

describe('formatDifficulty', () => {
  it.each([
    [1, 'Beginner'],
    [2, 'Easy'],
    [3, 'Intermediate'],
    [4, 'Advanced'],
  ] as const)('names level %s "%s"', (level, name) => {
    expect(formatDifficulty(level)).toBe(name);
  });
});

describe('formatSessionLength', () => {
  it('uses the plural for several questions', () => {
    expect(formatSessionLength(10)).toBe('10 questions');
  });

  it('uses the singular for one question', () => {
    expect(formatSessionLength(1)).toBe('1 question');
  });

  it('describes continuous practice', () => {
    expect(formatSessionLength('continuous')).toBe('No limit');
  });
});
