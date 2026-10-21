/**
 * Short messages shown after each answer (specification section 13.4).
 * Correct answers get praise; missed answers get support, never shaming.
 * Messages are picked at random but never repeat back to back, so they stay
 * fresh without being distracting. Each fits on one line on a small phone,
 * so the card below never moves.
 */
import { pickRandom, type RandomSource } from '../utils/math';

export const POSITIVE_FEEDBACK = [
  'Great job!',
  'Nice work!',
  'You got it!',
  'Way to go!',
  'You are improving!',
  'Awesome thinking!',
] as const;

export const SUPPORTIVE_FEEDBACK = [
  'Keep practicing!',
  'Nice try! Keep going!',
  'That one was tricky!',
  'Mistakes help you learn!',
  'Practice makes progress!',
] as const;

/** A message for the student's answer that differs from the previous one. */
export function pickFeedback(
  gotItRight: boolean,
  previous: string | null = null,
  random: RandomSource = Math.random,
): string {
  const messages: readonly string[] = gotItRight ? POSITIVE_FEEDBACK : SUPPORTIVE_FEEDBACK;
  const choices = messages.filter((message) => message !== previous);
  return pickRandom(choices, random);
}
