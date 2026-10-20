/**
 * Checks a generated problem against the rules in specification section 18
 * that apply before answer choices exist. Phase 5 adds the choice checks.
 */
import { DIFFICULTY_RULES, isInRange } from '../constants/difficultyRules';
import type { MathProblem } from '../types';
import { formatProblemText } from '../utils/format';
import { calculateAnswer } from '../utils/math';
import { isDifficultyLevel, isMathOperation } from '../utils/validation';

/** Every rule the problem breaks, or an empty list when it is valid. */
export function getProblemErrors(problem: MathProblem): string[] {
  const { operation, firstOperand, secondOperand, correctAnswer, difficulty, displayText } =
    problem;

  if (!isMathOperation(operation)) {
    return [`Unsupported operation: ${String(operation)}`];
  }
  if (!isDifficultyLevel(difficulty)) {
    return [`Unsupported difficulty level: ${String(difficulty)}`];
  }
  if (!Number.isInteger(firstOperand) || !Number.isInteger(secondOperand)) {
    return ['Operands must be whole numbers.'];
  }
  if (operation === 'division' && secondOperand === 0) {
    return ['Division by zero is not allowed.'];
  }

  const errors: string[] = [];
  const expectedAnswer = calculateAnswer(operation, firstOperand, secondOperand);

  if (!Number.isInteger(expectedAnswer)) {
    errors.push('The answer must be a whole number.');
  }
  if (correctAnswer !== expectedAnswer) {
    errors.push(`The correct answer should be ${expectedAnswer}, not ${correctAnswer}.`);
  }
  if (correctAnswer < 0) {
    errors.push('Negative answers are not allowed.');
  }
  if (displayText !== formatProblemText(operation, firstOperand, secondOperand)) {
    errors.push('The display text does not match the operands.');
  }
  if (!matchesDifficulty(problem)) {
    errors.push(`The numbers do not match difficulty level ${difficulty}.`);
  }

  return errors;
}

export function isValidProblem(problem: MathProblem): boolean {
  return getProblemErrors(problem).length === 0;
}

/** Whether the operands fall within the ranges for the problem's difficulty level. */
export function matchesDifficulty({
  operation,
  firstOperand,
  secondOperand,
  difficulty,
}: MathProblem): boolean {
  const rules = DIFFICULTY_RULES[difficulty];

  switch (operation) {
    case 'addition': {
      const { first, second, maxResult } = rules.addition;
      return (
        isInRange(firstOperand, first) &&
        isInRange(secondOperand, second) &&
        (maxResult === undefined || firstOperand + secondOperand <= maxResult)
      );
    }
    case 'subtraction': {
      const { minuend, subtrahend } = rules.subtraction;
      return (
        isInRange(firstOperand, minuend) &&
        isInRange(secondOperand, subtrahend) &&
        secondOperand <= firstOperand
      );
    }
    case 'multiplication': {
      const { firstFactor, secondFactor } = rules.multiplication;
      return (
        (isInRange(firstOperand, firstFactor) && isInRange(secondOperand, secondFactor)) ||
        (isInRange(firstOperand, secondFactor) && isInRange(secondOperand, firstFactor))
      );
    }
    case 'division': {
      const { divisor, quotient } = rules.division;
      return isInRange(secondOperand, divisor) && isInRange(firstOperand / secondOperand, quotient);
    }
    default:
      return false;
  }
}
