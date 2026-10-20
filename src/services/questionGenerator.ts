/**
 * Generates arithmetic problems that follow the difficulty rules
 * (specification sections 7, 9, and 20.1).
 *
 * Problems are generated first (operands, answer, and display text); answer
 * choices and an ID are then added to make a complete Question.
 */
import {
  DIFFICULTY_RULES,
  type AdditionRules,
  type DivisionRules,
  type MultiplicationRules,
  type NumberRange,
  type SubtractionRules,
} from '../constants/difficultyRules';
import type {
  DifficultyLevel,
  MathOperation,
  MathProblem,
  Question,
  QuestionSource,
} from '../types';
import { formatProblemText } from '../utils/format';
import { createId } from '../utils/ids';
import { calculateAnswer, pickRandom, randomInt, type RandomSource } from '../utils/math';
import { shuffle } from '../utils/shuffle';
import { generateDistractors } from './distractors';
import { getProblemErrors } from './problemValidation';
import { getQuestionErrors } from './questionValidation';

/** How many times to retry before falling back to a known-good problem. */
export const MAX_GENERATION_ATTEMPTS = 10;

/** Logs generation problems during development without exposing them to students. */
function reportGenerationFailure(message: string, detail: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, detail);
  }
}

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

  reportGenerationFailure(
    `Could not generate a valid ${operation} problem for level ${difficulty} after ` +
      `${MAX_GENERATION_ATTEMPTS} attempts. Using a fallback problem.`,
    lastFailure,
  );
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

// ---------- Complete questions ----------

export interface CreateQuestionOptions {
  source?: QuestionSource;
  /** The mistake pattern a review question was generated from. */
  mistakePatternId?: string;
  random?: RandomSource;
}

/**
 * Turns a problem into a multiple-choice question: the correct answer plus
 * three distractors, shuffled so the correct answer can be in any position.
 */
export function createQuestion(
  problem: MathProblem,
  { source = 'regular', mistakePatternId, random = Math.random }: CreateQuestionOptions = {},
): Question {
  const choices = shuffle([problem.correctAnswer, ...generateDistractors(problem, random)], random);
  return {
    ...problem,
    id: createId('q'),
    choices,
    source,
    ...(mistakePatternId === undefined ? {} : { mistakePatternId }),
  };
}

/**
 * A complete, validated question for the given operation and level
 * (specification section 20.1). If the answer choices ever fail validation,
 * the question falls back to the answer and the next three numbers.
 */
export function generateQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  const problem = generateProblem(operation, difficulty, random);

  try {
    const question = createQuestion(problem, { random });
    const errors = getQuestionErrors(question);
    if (errors.length === 0) {
      return question;
    }
    reportGenerationFailure(`Invalid answer choices for ${problem.displayText}.`, errors);
  } catch (error) {
    reportGenerationFailure(`Could not create answer choices for ${problem.displayText}.`, error);
  }

  const answer = problem.correctAnswer;
  return {
    ...problem,
    id: createId('q'),
    // Math.random rather than `random`, in case the provided source is the problem.
    choices: shuffle([answer, answer + 1, answer + 2, answer + 3]),
    source: 'regular',
  };
}

/** A complete question for one of the enabled operations, chosen at random. */
export function generateQuestionForOperations(
  operations: readonly MathOperation[],
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Question {
  if (operations.length === 0) {
    throw new RangeError('At least one operation must be selected to generate a question.');
  }
  return generateQuestion(pickRandom(operations, random), difficulty, random);
}
