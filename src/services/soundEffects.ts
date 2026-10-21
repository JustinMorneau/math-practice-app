/**
 * Short, gentle sound effects made with the Web Audio API, so no audio
 * files need to be downloaded. Sound is optional: when audio is not
 * available, nothing happens and practice continues normally.
 */

export type SoundEffect = 'flip' | 'correct';

interface Note {
  frequency: number;
  /** Seconds after the sound starts. */
  start: number;
  /** Seconds. */
  duration: number;
}

const SOUNDS: Record<SoundEffect, readonly Note[]> = {
  // A soft tick as the card turns over.
  flip: [{ frequency: 660, start: 0, duration: 0.08 }],
  // A rising three-note chime (C, E, G). "I Got It Wrong" has no sound, so
  // a missed answer is never announced to the room.
  correct: [
    { frequency: 523.25, start: 0, duration: 0.14 },
    { frequency: 659.25, start: 0.1, duration: 0.14 },
    { frequency: 783.99, start: 0.2, duration: 0.24 },
  ],
};

const PEAK_VOLUME = 0.15;

let sharedContext: AudioContext | null = null;

/** One shared AudioContext, created on first use (after a user gesture). */
function getSharedAudioContext(): AudioContext | null {
  if (sharedContext) {
    return sharedContext;
  }
  if (typeof AudioContext !== 'function') {
    return null;
  }
  try {
    sharedContext = new AudioContext();
  } catch {
    return null;
  }
  return sharedContext;
}

export function playSound(
  effect: SoundEffect,
  audio: AudioContext | null = getSharedAudioContext(),
): void {
  if (audio === null) {
    return;
  }
  try {
    if (audio.state === 'suspended') {
      void audio.resume();
    }
    const now = audio.currentTime;
    for (const { frequency, start, duration } of SOUNDS[effect]) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      // Fade in and out quickly to avoid clicks.
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(PEAK_VOLUME, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(now + start);
      oscillator.stop(now + start + duration + 0.02);
    }
  } catch {
    // Sound is a nice extra; a problem with it must never interrupt practice.
  }
}
