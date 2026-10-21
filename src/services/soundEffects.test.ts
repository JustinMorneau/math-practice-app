import { describe, expect, it, vi } from 'vitest';
import { playSound } from './soundEffects';

/** A minimal stand-in for the browser's AudioContext. */
function createFakeAudioContext() {
  const oscillators: { frequency: { value: number }; start: () => void; stop: () => void }[] = [];
  const audio = {
    state: 'running',
    currentTime: 0,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createOscillator: () => {
      const node = {
        type: '',
        frequency: { value: 0 },
        connect: (next: unknown) => next,
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscillators.push(node);
      return node;
    },
    createGain: () => ({
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: (next: unknown) => next,
    }),
  };
  return { audio: audio as unknown as AudioContext, oscillators };
}

describe('playSound', () => {
  it('plays one tone for a flip', () => {
    const { audio, oscillators } = createFakeAudioContext();

    playSound('flip', audio);

    expect(oscillators).toHaveLength(1);
    expect(oscillators[0].start).toHaveBeenCalled();
  });

  it('plays a rising three-note chime for a correct answer', () => {
    const { audio, oscillators } = createFakeAudioContext();

    playSound('correct', audio);

    const frequencies = oscillators.map(({ frequency }) => frequency.value);
    expect(frequencies).toHaveLength(3);
    expect([...frequencies].sort((a, b) => a - b)).toEqual(frequencies);
  });

  it('resumes audio the browser has paused', () => {
    const { audio } = createFakeAudioContext();
    Object.assign(audio, { state: 'suspended' });

    playSound('flip', audio);

    expect(audio.resume).toHaveBeenCalled();
  });

  it('does nothing when audio is unavailable', () => {
    expect(() => playSound('correct', null)).not.toThrow();
  });

  it('never throws when audio fails', () => {
    const broken = {
      state: 'running',
      currentTime: 0,
      createOscillator: () => {
        throw new Error('audio failed');
      },
    } as unknown as AudioContext;

    expect(() => playSound('flip', broken)).not.toThrow();
  });
});
