import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../test/random';
import {
  DIFFICULTY_LEVELS,
  MATH_OPERATIONS,
  type DifficultyLevel,
  type MathOperation,
  type MistakePattern,
} from '../types';
import { getProblemErrors, matchesDifficulty } from './problemValidation';
import { generateProblem } from './questionGenerator';
import { getQuestionErrors } from './questionValidation';
import {
  generateSimilarQuestion,
  getFactFamilyProblems,
  getNearbyProblems,
  getReversedProblems,
  getSimilarProblems,
} from './similarQuestions';

const relaxed = { enforceDifficultyRanges: false };

function pattern(
  operation: MathOperation,
  firstOperand: number,
  secondOperand: number,
  difficulty: DifficultyLevel = 2,
): MistakePattern {
  const answers: Record<MathOperation, number> = {
    addition: firstOperand + secondOperand,
    subtraction: firstOperand - secondOperand,
    multiplication: firstOperand * secondOperand,
    division: firstOperand / secondOperand,
  };
  return {
    id: 'm-1',
    operation,
    firstOperand,
    secondOperand,
    correctAnswer: answers[operation],
    difficulty,
    incorrectCount: 1,
    similarCorrectCount: 0,
    lastIncorrectAt: '2026-10-22T10:00:00.000Z',
    mastered: false,
  };
}

function texts(problems: { displayText: string }[]) {
  return problems.map(({ displayText }) => displayText).sort();
}

describe('getNearbyProblems', () => {
  it('changes one number by one for multiplication', () => {
    expect(texts(getNearbyProblems(pattern('multiplication', 8, 7)))).toEqual(
      ['7 × 7', '8 × 6', '8 × 8', '9 × 7'].sort(),
    );
  });

  it('keeps the answer a whole number for division', () => {
    // 56 ÷ 7 = 8 → change the answer (63 ÷ 7, 49 ÷ 7) or the divisor (64 ÷ 8, 48 ÷ 6).
    expect(texts(getNearbyProblems(pattern('division', 56, 7)))).toEqual(
      ['48 ÷ 6', '49 ÷ 7', '63 ÷ 7', '64 ÷ 8'].sort(),
    );
  });

  it('never makes a subtraction answer negative', () => {
    const problems = getNearbyProblems(pattern('subtraction', 5, 5, 1));

    expect(texts(problems)).toEqual(['5 − 4', '6 − 5'].sort());
  });

  it('never divides by zero or makes a negative answer', () => {
    const problems = getNearbyProblems(pattern('division', 0, 1, 1));

    for (const problem of problems) {
      expect(problem.secondOperand).toBeGreaterThan(0);
      expect(problem.correctAnswer).toBeGreaterThanOrEqual(0);
    }
  });

  it("stays within the level's usual ranges", () => {
    // Level 1 addition allows numbers up to 10, so 10 + 10 cannot go higher.
    const problems = getNearbyProblems(pattern('addition', 10, 10, 1));

    expect(texts(problems)).toEqual(['10 + 9', '9 + 10'].sort());
    expect(problems.every(matchesDifficulty)).toBe(true);
  });
});

describe('getReversedProblems', () => {
  it('reverses addition and multiplication', () => {
    expect(texts(getReversedProblems(pattern('addition', 3, 9)))).toEqual(['9 + 3']);
    expect(texts(getReversedProblems(pattern('multiplication', 8, 7)))).toEqual(['7 × 8']);
  });

  it('does not reverse subtraction or division, which would change the fact', () => {
    expect(getReversedProblems(pattern('subtraction', 9, 3))).toEqual([]);
    expect(getReversedProblems(pattern('division', 56, 7))).toEqual([]);
  });

  it('has nothing to reverse when both numbers are the same', () => {
    expect(getReversedProblems(pattern('multiplication', 6, 6))).toEqual([]);
  });
});

describe('getFactFamilyProblems', () => {
  it('turns a multiplication mistake into division', () => {
    expect(texts(getFactFamilyProblems(pattern('multiplication', 8, 7)))).toEqual(
      ['56 ÷ 7', '56 ÷ 8'].sort(),
    );
  });

  it('turns a division mistake into multiplication', () => {
    expect(texts(getFactFamilyProblems(pattern('division', 56, 7)))).toEqual(
      ['7 × 8', '8 × 7'].sort(),
    );
  });

  it('turns an addition mistake into subtraction', () => {
    expect(texts(getFactFamilyProblems(pattern('addition', 7, 8)))).toEqual(
      ['15 − 7', '15 − 8'].sort(),
    );
  });

  it('turns a subtraction mistake into addition', () => {
    expect(texts(getFactFamilyProblems(pattern('subtraction', 15, 8)))).toEqual(
      ['7 + 8', '8 + 7'].sort(),
    );
  });

  it("keeps the mistake's level", () => {
    for (const problem of getFactFamilyProblems(pattern('multiplication', 45, 7, 4))) {
      expect(problem.difficulty).toBe(4);
    }
  });

  it('skips a division by zero from a zero factor', () => {
    expect(texts(getFactFamilyProblems(pattern('multiplication', 0, 5, 1)))).toEqual(['0 ÷ 5']);
  });
});

describe('getSimilarProblems', () => {
  it("matches the specification's example for 8 × 7", () => {
    const { nearby, reversed, 'fact-family': factFamily } = getSimilarProblems(
      pattern('multiplication', 8, 7),
    );
    const all = texts([...nearby, ...reversed, ...factFamily]);

    for (const example of ['7 × 8', '8 × 6', '9 × 7', '56 ÷ 7', '56 ÷ 8']) {
      expect(all).toContain(example);
    }
  });

  it('never repeats the original problem or lists a problem twice', () => {
    const groups = getSimilarProblems(pattern('division', 56, 7));
    const all = [...groups.nearby, ...groups.reversed, ...groups['fact-family']];

    expect(all.map(({ displayText }) => displayText)).not.toContain('56 ÷ 7');
    expect(new Set(all.map(({ displayText }) => displayText)).size).toBe(all.length);
  });
});

describe('generateSimilarQuestion', () => {
  it('labels the question for mistake review and links the pattern', () => {
    const question = generateSimilarQuestion(pattern('multiplication', 8, 7), {
      random: createSeededRandom(1),
    });

    expect(question.source).toBe('mistake-review');
    expect(question.mistakePatternId).toBe('m-1');
    expect(question.id).toMatch(/^q-/);
    expect(getQuestionErrors(question, relaxed)).toEqual([]);
  });

  it('uses every strategy over time', () => {
    const random = createSeededRandom(2);
    const seen = Array.from(
      { length: 200 },
      () => generateSimilarQuestion(pattern('multiplication', 8, 7), { random }).displayText,
    );

    expect(seen).toContain('7 × 8');
    expect(seen.some((text) => text.includes('÷'))).toBe(true);
    expect(seen.some((text) => text.startsWith('9 ×') || text.endsWith('× 6'))).toBe(true);
  });

  it('avoids recently shown questions when it can', () => {
    const recent = ['7 × 8', '8 × 6', '9 × 7', '8 × 8', '7 × 7', '56 ÷ 7'];
    const random = createSeededRandom(3);

    for (let i = 0; i < 50; i += 1) {
      const question = generateSimilarQuestion(pattern('multiplication', 8, 7), {
        random,
        recentDisplayTexts: recent,
      });
      expect(question.displayText).toBe('56 ÷ 8');
    }
  });

  it('still returns a question when everything was shown recently', () => {
    const fact = pattern('multiplication', 8, 7);
    const everything = Object.values(getSimilarProblems(fact))
      .flat()
      .map(({ displayText }) => displayText);

    const question = generateSimilarQuestion(fact, { recentDisplayTexts: everything });

    expect(everything).toContain(question.displayText);
  });

  it('reviews the original problem when nothing related is valid', () => {
    // 0 × 0 at level 4: nearby numbers leave the level's range, there is
    // nothing to reverse, and its fact family would divide by zero.
    const question = generateSimilarQuestion(pattern('multiplication', 0, 0, 4), {
      random: createSeededRandom(4),
    });

    expect(question.displayText).toBe('0 × 0');
    expect(getQuestionErrors(question, relaxed)).toEqual([]);
  });

  describe.each(MATH_OPERATIONS)('for %s mistakes', (operation) => {
    it.each(DIFFICULTY_LEVELS)('always produces valid review questions at level %i', (level) => {
      const random = createSeededRandom(level * 31);
      for (let i = 0; i < 150; i += 1) {
        const missed = generateProblem(operation, level, random);
        const fact = pattern(operation, missed.firstOperand, missed.secondOperand, level);
        const question = generateSimilarQuestion(fact, { random });

        expect(getQuestionErrors(question, relaxed)).toEqual([]);
        expect(question.difficulty).toBe(level);
        expect(question.displayText).not.toBe(missed.displayText);
        expect(getProblemErrors(question, relaxed)).toEqual([]);
      }
    });
  });
});
