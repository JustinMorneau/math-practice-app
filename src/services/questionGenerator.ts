/**
 * Generates arithmetic problems that follow the difficulty rules
 * (specification sections 7, 9, and 20.1).
 *
 * Phase 4 produces MathProblems. Phase 5 adds answer choices and an ID to
 * turn each problem into a complete Question.
 */
import {
  DIFFICULTY_RULES,
  type AdditionRules,
  type DivisionRules,
  type MultiplicationRules,
  type NumberRange,
  type SubtractionRules,
} from '../constants/difficultyRules';
import type { DifficultyLevel, MathOperation, MathProblem } from '../types';
import { formatProblemText } from '../utils/format';
import { calculateAnswer, pickRandom, randomInt, type RandomSource } from '../utils/math';
import { getProblemErrors } from './problemValidation';

/** How many times to retry before falling back to a known-good problem. */
export const MAX_GENERATION_ATTEMPTS = 10;

function randomInRange({ min, max }: NumberRange, random: RandomSource): number {
  return randomInt(min, max, random);
}

/** Builds a problem from its operands, calculating the answer and display text. */
export function createProblem(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  firstOperand: number,
  secondOperand: number,
): MathProblem {
  return {
    operation,
    firstOperand,
    secondOperand,
    displayText: formatProblemText(operation, firstOperand, secondOperand),
    correctAnswer: calculateAnswer(operation, firstOperand, secondOperand),
    difficulty,
  };
}

// ---------- Operation-specific generators ----------

export function generateAdditionProblem(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): MathProblem {
  const { first, second, maxResult }: AdditionRules = DIFFICULTY_RULES[difficulty].addition;
  const firstOperand = randomInRange(first, random);
  // Keep the sum within the level's limit by capping the second number.
  const secondMax =
    maxResult === undefined ? second.max : Math.min(second.max, maxResult - firstOperand);
  const secondOperand = randomInt(second.min, secondMax, random);
  return createProblem('addition', difficulty, firstOperand, secondOperand);
}

export function generateSubtractionProblem(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): MathProblem {
  const { minuend, subtrahend }: SubtractionRules = DIFFICULTY_RULES[difficulty].subtraction;
  const firstOperand = randomInRange(minuend, random);
  // Never subtract more than the first number, so the answer is never negative.
  const secondOperand = randomInt(subtrahend.min, Math.min(subtrahend.max, firstOperand), random);
  return createProblem('subtraction', difficulty, firstOperand, secondOperand);
}

export function generateMultiplicationProblem(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): MathProblem {
  const { firstFactor, secondFactor }: MultiplicationRules =
    DIFFICULTY_RULES[difficulty].multiplication;
  const a = randomInRange(firstFactor, random);
  const b = randomInRange(secondFactor, random);
  // Show the factors in either order so "7 × 45" and "45 × 7" both appear.
  const [firstOperand, secondOperand] = random() < 0.5 ? [a, b] : [b, a];
  return createProblem('multiplication', difficulty, firstOperand, secondOperand);
}

export function generateDivisionProblem(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): MathProblem {
  const { divisor: divisorRange, quotient: quotientRange }: DivisionRules =
    DIFFICULTY_RULES[difficulty].division;
  // Pick the divisor and answer first so the answer is always a whole number.
  const divisor = randomInRange(divisorRange, random);
  const quotient = randomInRange(quotientRange, random);
  return createProblem('division', difficulty, divisor * quotient, divisor);
}

const GENERATORS: Record<
  MathOperation,
  (difficulty: DifficultyLevel, random: RandomSource) => MathProblem
> = {
  addition: generateAdditionProblem,
  subtraction: generateSubtractionProblem,
  multiplication: generateMultiplicationProblem,
  division: generateDivisionProblem,
};

// ---------- Main generator ----------

/**
 * A valid problem for the given operation and level. Each attempt is
 * validated; after MAX_GENERATION_ATTEMPTS failures a known-good fallback
 * problem is returned so practice can always continue.
 */
export function generateProblem(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): MathProblem {
  let lastFailure: unknown = null;

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const problem = GENERATORS[operation](difficulty, random);
      const errors = getProblemErrors(problem);
      if (errors.length === 0) {
        return problem;
      }
      lastFailure = errors;
    } catch (error) {
      lastFailure = error;
    }
  }

  if (import.meta.env.DEV) {
    console.error(
      `Could not generate a valid ${operation} problem for level ${difficulty} after ` +
        `${MAX_GENERATION_ATTEMPTS} attempts. Using a fallback problem.`,
      lastFailure,
    );
  }
  return createFallbackProblem(operation, difficulty);
}

/**
 * A problem for one of the enabled operations, chosen at random so mixed
 * practice includes every selected operation.
 */
export function generateProblemForOperations(
  operations: readonly MathOperation[],
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): MathProblem {
  if (operations.length === 0) {
    throw new RangeError('At least one operation must be selected to generate a problem.');
  }
  return generateProblem(pickRandom(operations, random), difficulty, random);
}

/**
 * The simplest valid problem for a level, built from the smallest allowed
 * numbers. Used only when random generation keeps failing.
 */
export function createFallbackProblem(
  operation: MathOperation,
  difficulty: DifficultyLevel,
): MathProblem {
  const rules = DIFFICULTY_RULES[difficulty];
  switch (operation) {
    case 'addition':
      return createProblem(
        operation,
        difficulty,
        rules.addition.first.min,
        rules.addition.second.min,
      );
    case 'subtraction':
      return createProblem(
        operation,
        difficulty,
        rules.subtraction.minuend.min,
        rules.subtraction.subtrahend.min,
      );
    case 'multiplication':
      return createProblem(
        operation,
        difficulty,
        rules.multiplication.firstFactor.min,
        rules.multiplication.secondFactor.min,
      );
    case 'division': {
      const { divisor, quotient } = rules.division;
      return createProblem(operation, difficulty, divisor.min * quotient.min, divisor.min);
    }
  }
}
