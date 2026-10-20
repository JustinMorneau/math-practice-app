import { describe, expect, it } from 'vitest';
import type { PracticeConfig } from '../types';
import {
  isDifficultyLevel,
  isMathOperation,
  isPracticeConfig,
  isSessionLength,
} from './validation';

const validConfig: PracticeConfig = {
  operations: ['addition', 'division'],
  difficulty: 2,
  sessionLength: 10,
};

describe('isMathOperation', () => {
  it.each(['addition', 'subtraction', 'multiplication', 'division'])('accepts %s', (value) => {
    expect(isMathOperation(value)).toBe(true);
  });

  it.each(['modulo', 'Addition', '', 1, null, undefined])('rejects %s', (value) => {
    expect(isMathOperation(value)).toBe(false);
  });
});

describe('isDifficultyLevel', () => {
  it.each([1, 2, 3, 4])('accepts %s', (value) => {
    expect(isDifficultyLevel(value)).toBe(true);
  });

  it.each([0, 5, 1.5, '1', null])('rejects %s', (value) => {
    expect(isDifficultyLevel(value)).toBe(false);
  });
});

describe('isSessionLength', () => {
  it.each([5, 10, 20, 1, 'continuous'])('accepts %s', (value) => {
    expect(isSessionLength(value)).toBe(true);
  });

  it.each([0, -5, 2.5, '10', 'forever', null, Number.NaN])('rejects %s', (value) => {
    expect(isSessionLength(value)).toBe(false);
  });
});

describe('isPracticeConfig', () => {
  it('accepts a complete configuration', () => {
    expect(isPracticeConfig(validConfig)).toBe(true);
  });

  it('accepts continuous practice', () => {
    expect(isPracticeConfig({ ...validConfig, sessionLength: 'continuous' })).toBe(true);
  });

  it.each([
    ['null', null],
    ['a string', 'addition'],
    ['no operations', { ...validConfig, operations: [] }],
    ['an unknown operation', { ...validConfig, operations: ['addition', 'modulo'] }],
    ['duplicate operations', { ...validConfig, operations: ['addition', 'addition'] }],
    ['operations that are not an array', { ...validConfig, operations: 'addition' }],
    ['an invalid difficulty', { ...validConfig, difficulty: 7 }],
    ['an invalid session length', { ...validConfig, sessionLength: 0 }],
    ['a missing field', { operations: ['addition'], difficulty: 1 }],
  ])('rejects %s', (_description, value) => {
    expect(isPracticeConfig(value)).toBe(false);
  });
});
