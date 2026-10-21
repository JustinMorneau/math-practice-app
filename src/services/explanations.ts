/**
 * A brief explanation for the back of a card (specification section 6.3).
 * Each one checks the answer with a related fact, which also reinforces
 * how the operations fit together.
 */
import type { MathProblem } from '../types';

export function getExplanation({
  operation,
  firstOperand: a,
  secondOperand: b,
  correctAnswer: answer,
}: MathProblem): string {
  switch (operation) {
    case 'addition':
      return `${a} + ${b} = ${answer}. Check it: ${answer} − ${b} = ${a}.`;
    case 'subtraction':
      return `${a} − ${b} = ${answer} because ${answer} + ${b} = ${a}.`;
    case 'multiplication':
      return `${a} × ${b} means ${a} groups of ${b}, which makes ${answer}.`;
    case 'division':
      return `${a} ÷ ${b} = ${answer} because ${b} × ${answer} = ${a}.`;
  }
}
