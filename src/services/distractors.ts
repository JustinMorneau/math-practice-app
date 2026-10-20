/**
 * Plausible wrong answers ("distractors") for multiple-choice questions
 * (specification section 8.2).
 *
 * Distractors come from two sources:
 * - mistake answers: what a student gets by making a common mistake with
 *   the operation, such as forgetting to carry or using a neighboring
 *   times-table fact
 * - nearby numbers: small counting slips just above or below the answer
 */
import type { MathProblem } from '../types';
import { randomInt, type RandomSource } from '../utils/math';
import { shuffle } from '../utils/shuffle';
import { CHOICE_COUNT } from './questionValidation';

export const DISTRACTOR_COUNT = CHOICE_COUNT - 1;

/** Distances from the correct answer used for nearby-number distractors. */
const NEARBY_OFFSETS = [1, 2, 3, 10] as const;

/** Upper bound for the final top-up loop, so it can never run forever. */
const MAX_TOP_UP_OFFSET = 100;

/** Adds column by column but drops every carry, e.g. 47 + 38 → 75 instead of 85. */
export function addWithoutCarrying(first: number, second: number): number {
  let result = 0;
  let placeValue = 1;
  let a = first;
  let b = second;
  while (a > 0 || b > 0) {
    result += (((a % 10) + (b % 10)) % 10) * placeValue;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
    placeValue *= 10;
  }
  return result;
}

/**
 * Subtracts the smaller digit from the larger in every column instead of
 * borrowing, e.g. 52 − 27 → 35 instead of 25.
 */
export function subtractSmallerDigitFromLarger(first: number, second: number): number {
  let result = 0;
  let placeValue = 1;
  let a = first;
  let b = second;
  while (a > 0 || b > 0) {
    result += Math.abs((a % 10) - (b % 10)) * placeValue;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
    placeValue *= 10;
  }
  return result;
}

/**
 * Answers a student might reach through a common mistake with this
 * operation. May include duplicates, negatives, or the correct answer;
 * generateDistractors filters those out.
 */
export function getMistakeAnswers({
  operation,
  firstOperand: a,
  secondOperand: b,
  correctAnswer,
}: MathProblem): number[] {
  switch (operation) {
    case 'addition':
      // Carrying mistakes: off by ten, or every carry forgotten.
      return [correctAnswer + 10, correctAnswer - 10, addWithoutCarrying(a, b)];
    case 'subtraction':
      // Borrowing mistakes: off by ten, or smaller digit taken from larger.
      return [correctAnswer + 10, correctAnswer - 10, subtractSmallerDigitFromLarger(a, b)];
    case 'multiplication':
      // Neighboring times-table facts, e.g. 7 × 8 → 7 × 9, 7 × 7, 8 × 8, 6 × 8.
      return [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b];
    case 'division':
      // Fact-family slips: a neighboring quotient, or the divisor itself.
      return [correctAnswer + 1, correctAnswer - 1, b];
  }
}

function unique(values: readonly number[]): number[] {
  return [...new Set(values)];
}

/**
 * Three unique, whole, non-negative wrong answers for a problem.
 *
 * Mistake answers are preferred over nearby numbers. The number of
 * distractors placed below the correct answer is chosen at random, so the
 * correct answer is not predictably the middle, smallest, or largest choice.
 */
export function generateDistractors(
  problem: MathProblem,
  random: RandomSource = Math.random,
): number[] {
  const correct = problem.correctAnswer;
  const isUsable = (value: number) => Number.isInteger(value) && value >= 0 && value !== correct;

  const mistakes = shuffle(unique(getMistakeAnswers(problem).filter(isUsable)), random);
  const nearbyValues = NEARBY_OFFSETS.flatMap((offset) => [correct - offset, correct + offset]);
  const nearby = shuffle(unique(nearbyValues.filter(isUsable)), random);

  // Mistakes first, so they are picked before nearby numbers on each side.
  const candidates = unique([...mistakes, ...nearby]);
  const below = candidates.filter((value) => value < correct);
  const above = candidates.filter((value) => value > correct);

  // Answers near zero have few smaller options, so fewer may fit below.
  const belowCount = Math.min(randomInt(0, DISTRACTOR_COUNT, random), below.length);
  const distractors = [
    ...below.slice(0, belowCount),
    ...above.slice(0, DISTRACTOR_COUNT - belowCount),
  ];

  // Top up with the next numbers above the answer if anything is still missing.
  let offset = 1;
  while (distractors.length < DISTRACTOR_COUNT && offset <= MAX_TOP_UP_OFFSET) {
    const value = correct + offset;
    if (!distractors.includes(value)) {
      distractors.push(value);
    }
    offset += 1;
  }

  if (distractors.length < DISTRACTOR_COUNT) {
    throw new Error(`Could not find ${DISTRACTOR_COUNT} distractors for ${problem.displayText}.`);
  }
  return distractors;
}
