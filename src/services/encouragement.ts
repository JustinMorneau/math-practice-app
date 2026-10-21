/**
 * Positive, age-appropriate messages for the end of a session
 * (specification sections 6.5 and 13.4). Low scores get encouragement,
 * never shaming.
 */

export interface EncouragementInput {
  attempted: number;
  correct: number;
  incorrect: number;
  /** Whole-number percentage from calculateAccuracy. */
  accuracy: number;
}

export interface Encouragement {
  headline: string;
  message: string;
  /** A nudge to revisit missed questions, when there were any. */
  reviewTip: string | null;
}

const REVIEW_TIP = 'The questions you missed will get easier each time you practice them.';

export function getEncouragement({
  attempted,
  correct,
  incorrect,
  accuracy,
}: EncouragementInput): Encouragement {
  const reviewTip = incorrect > 0 ? REVIEW_TIP : null;

  if (attempted === 0) {
    return {
      headline: 'Ready when you are!',
      message: 'Answer a few questions next time to see how you did.',
      reviewTip: null,
    };
  }
  if (correct === attempted) {
    return {
      headline: 'Perfect score!',
      message: 'You got every single question right. Amazing work!',
      reviewTip,
    };
  }
  if (accuracy >= 90) {
    return {
      headline: 'Amazing work!',
      message: 'You really know your stuff. Keep it up!',
      reviewTip,
    };
  }
  if (accuracy >= 75) {
    return {
      headline: 'Great job!',
      message: "You're getting stronger every time you practice.",
      reviewTip,
    };
  }
  if (accuracy >= 50) {
    return {
      headline: 'Good effort!',
      message: 'Practice makes progress, and you are making progress.',
      reviewTip,
    };
  }
  return {
    headline: 'Thanks for practicing!',
    message: 'Every question you try helps your brain learn something new.',
    reviewTip,
  };
}
