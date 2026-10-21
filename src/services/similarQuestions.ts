/**
 * Generates questions related to a missed fact, for mistake review
 * (specification sections 6.4 and 20.2).
 *
 * Three strategies, using 8 × 7 = 56 as an example:
 * - nearby: the same operation with one number changed by 1 (9 × 7, 8 × 6),
 *   kept within the level's usual ranges
 * - reversed: the same fact in the other order (7 × 8), for addition and
 *   multiplication only
 * - fact family: the inverse operation with the same numbers (56 ÷ 7, 56 ÷ 8).
 *   These keep the mistake's level and numbers even when they fall slightly
 *   outside the level's usual ranges, as long as they stay valid.
 */
import type {
  DifficultyLevel,
  MathOperation,
  MathProblem,
  MistakePattern,
  Question,
} from '../types';
import { pickRandom, type RandomSource } from '../utils/math';
import { shuffle } from '../utils/shuffle';
import { getProblemErrors, matchesDifficulty } from './problemValidation';
import { createProblem, createQuestion } from './questionGenerator';
import { getQuestionErrors } from './questionValidation';

export type SimilarityStrategy = 'nearby' | 'reversed' | 'fact-family';

type Fact = Pick<MistakePattern, 'operation' | 'firstOperand' | 'secondOperand' | 'difficulty'>;

/** Checks that apply to review questions: everything except the level's usual ranges. */
const REVIEW_CHECKS = { enforceDifficultyRanges: false } as const;

/** A valid problem with these numbers, or null when they would not make one. */
function tryProblem(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  firstOperand: number,
  secondOperand: number,
): MathProblem | null {
  if (firstOperand < 0 || secondOperand < 0 || (operation === 'division' && secondOperand === 0)) {
    return null;
  }
  const problem = createProblem(operation, difficulty, firstOperand, secondOperand);
  return getProblemErrors(problem, REVIEW_CHECKS).length === 0 ? problem : null;
}

function isProblem(value: MathProblem | null): value is MathProblem {
  return value !== null;
}

/** The same operation with one number one step away, within the level's ranges. */
export function getNearbyProblems({
  operation,
  firstOperand: a,
  secondOperand: b,
  difficulty,
}: Fact): MathProblem[] {
  let pairs: [number, number][];
  if (operation === 'division') {
    // Change the answer or the divisor, so the answer stays a whole number.
    const quotient = a / b;
    pairs = [
      [b * (quotient + 1), b],
      [b * (quotient - 1), b],
      [(b + 1) * quotient, b + 1],
      [(b - 1) * quotient, b - 1],
    ];
  } else {
    pairs = [
      [a + 1, b],
      [a - 1, b],
      [a, b + 1],
      [a, b - 1],
    ];
  }
  return pairs
    .map(([first, second]) => tryProblem(operation, difficulty, first, second))
    .filter(isProblem)
    .filter(matchesDifficulty);
}

/** The same fact with the numbers swapped, for addition and multiplication only. */
export function getReversedProblems({
  operation,
  firstOperand: a,
  secondOperand: b,
  difficulty,
}: Fact): MathProblem[] {
  if ((operation !== 'addition' && operation !== 'multiplication') || a === b) {
    return [];
  }
  return [tryProblem(operation, difficulty, b, a)].filter(isProblem).filter(matchesDifficulty);
}

/** The related inverse-operation facts that use the same numbers. */
export function getFactFamilyProblems({
  operation,
  firstOperand: a,
  secondOperand: b,
  difficulty,
}: Fact): MathProblem[] {
  const candidates: (MathProblem | null)[] = [];
  switch (operation) {
    case 'multiplication':
      candidates.push(
        tryProblem('division', difficulty, a * b, a),
        tryProblem('division', difficulty, a * b, b),
      );
      break;
    case 'division':
      candidates.push(
        tryProblem('multiplication', difficulty, b, a / b),
        tryProblem('multiplication', difficulty, a / b, b),
      );
      break;
    case 'addition':
      candidates.push(
        tryProblem('subtraction', difficulty, a + b, a),
        tryProblem('subtraction', difficulty, a + b, b),
      );
      break;
    case 'subtraction':
      candidates.push(
        tryProblem('addition', difficulty, b, a - b),
        tryProblem('addition', difficulty, a - b, b),
      );
      break;
  }
  return candidates.filter(isProblem);
}

/**
 * Every similar problem for a fact, grouped by strategy. Duplicates are
 * removed, and so is the original problem exactly as it was asked.
 */
export function getSimilarProblems(fact: Fact): Record<SimilarityStrategy, MathProblem[]> {
  const { operation, difficulty, firstOperand, secondOperand } = fact;
  const original = createProblem(operation, difficulty, firstOperand, secondOperand);
  const seen = new Set([original.displayText]);
  const keepNew = (problems: MathProblem[]) =>
    problems.filter((problem) => {
      if (seen.has(problem.displayText)) {
        return false;
      }
      seen.add(problem.displayText);
      return true;
    });

  return {
    reversed: keepNew(getReversedProblems(fact)),
    'fact-family': keepNew(getFactFamilyProblems(fact)),
    nearby: keepNew(getNearbyProblems(fact)),
  };
}

export interface SimilarQuestionOptions {
  random?: RandomSource;
  /** Display texts shown recently (e.g. "56 ÷ 8"), avoided when possible. */
  recentDisplayTexts?: readonly string[];
}

/**
 * A multiple-choice review question related to a mistake pattern, labeled
 * `mistake-review` and linked to the pattern (specification section 20.2).
 *
 * A strategy is chosen at random among those that have a question to offer,
 * then a question within it, so review mixes nearby, reversed, and fact-family
 * questions. Recently shown questions are skipped when anything else is
 * available; if nothing related is valid, the original problem is reviewed.
 */
export function generateSimilarQuestion(
  pattern: MistakePattern,
  { random = Math.random, recentDisplayTexts = [] }: SimilarQuestionOptions = {},
): Question {
  const byStrategy = getSimilarProblems(pattern);
  const notRecent = (problems: MathProblem[]) =>
    problems.filter(({ displayText }) => !recentDisplayTexts.includes(displayText));

  const strategies = Object.keys(byStrategy) as SimilarityStrategy[];
  const fresh = strategies.filter((strategy) => notRecent(byStrategy[strategy]).length > 0);
  const anyAvailable = strategies.filter((strategy) => byStrategy[strategy].length > 0);

  let problem: MathProblem;
  if (fresh.length > 0) {
    problem = pickRandom(notRecent(byStrategy[pickRandom(fresh, random)]), random);
  } else if (anyAvailable.length > 0) {
    problem = pickRandom(byStrategy[pickRandom(anyAvailable, random)], random);
  } else {
    const { operation, difficulty, firstOperand, secondOperand } = pattern;
    problem = createProblem(operation, difficulty, firstOperand, secondOperand);
  }

  const question = createQuestion(problem, {
    source: 'mistake-review',
    mistakePatternId: pattern.id,
    random,
  });
  if (getQuestionErrors(question, REVIEW_CHECKS).length === 0) {
    return question;
  }
  // The choices could not be built (this should not happen); fall back to
  // consecutive numbers, which are always valid.
  const answer = problem.correctAnswer;
  return { ...question, choices: shuffle([answer, answer + 1, answer + 2, answer + 3]) };
}
