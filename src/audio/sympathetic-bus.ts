/**
 * Sympathetic resonance bus — simulates the "halo" of sympathetic string
 * vibration that a real bandola llanera produces.
 *
 * The bandola has 4 metal strings tuned to A3-D4-A4-E5. When any note is
 * plucked, the body and air cavity transmit enough acoustic energy to
 * excite sympathetic vibrations in the OTHER open strings at their own
 * resonant frequencies. The listener hears a soft, sustained layer of
 * pitches ringing under each played note — the characteristic timbre
 * that distinguishes a bandola from a synthesizer.
 *
 * The bus is built from 4 narrow bandpass filters tuned to the open
 * string frequencies. Each played note is fed into all 4 filters via
 * a per-trigger envelope gain, so the sympathetic resonance has its
 * own short attack (5 ms ramp to peak) and long exponential decay
 * (1.8 s). The bus is mixed into the destination at a low level so it
 * adds presence without overpowering the played note.
 *
 * Reference: Cremer, L. (1984). "The Physics of the Violin". MIT Press.
 * Chapter 9 covers sympathetic resonance in string instruments.
 *
 * Memory: every `trigger()` allocates one `GainNode`. The node is held
 * alive by the audio graph (output → destination) until we disconnect
 * it. We schedule a `setTimeout` at the end of each envelope to free
 * the node; if the page is closed before the timeout fires the browser
 * reclaims everything anyway.
 */

import { midiToFrequency } from "./play-midi-note";

/** Open strings of the bandola llanera (low to high): A3, D4, A4, E5. */
export const OPEN_STRING_MIDI = [57, 62, 69, 76] as const;

/** Master output level of the sympathetic layer (mixed into destination). */
export const SYMPATHETIC_OUTPUT_GAIN = 0.18;

/**
 * Q factor of the bandpass filters. Narrow Q means each filter only rings
 * at one pitch (the open string's fundamental), giving the cleanest
 * sympathetic effect. Wider Q would bleed into adjacent pitches.
 */
export const SYMPATHETIC_FILTER_Q = 18;

/** Peak amplitude of a sympathetic string right after excitation. */
export const SYMPATHETIC_ATTACK_PEAK = 0.14;

/** Sympathetic strings ring noticeably longer than the played note. */
export const SYMPATHETIC_DECAY_S = 1.8;

/** Quick attack ramp to the peak level (avoids a click). */
export const SYMPATHETIC_ATTACK_S = 0.005;

export interface SympatheticBus {
  /** The output node of the bus — already connected to the destination. */
  readonly output: GainNode;
  /**
   * Route a played note into the sympathetic bus.
   * @param source The AudioNode producing the played note (typically the
   *               AudioBufferSourceNode that plays the KS buffer).
   * @param time The AudioContext time at which to schedule the trigger.
   * @param level Optional override for the peak sympathetic level.
   */
  trigger: (source: AudioNode, time: number, level?: number) => void;
  /** The 4 open-string frequencies the bus is tuned to. */
  readonly openFrequencies: readonly number[];
}

/**
 * Build a sympathetic resonance bus for a given AudioContext.
 *
 * The bus must be created ONCE per AudioContext. Creating multiple buses
 * would double-route the destination and create phase interference.
 */
export function createSympatheticBus(ctx: AudioContext): SympatheticBus {
  const openFrequencies = OPEN_STRING_MIDI.map(midiToFrequency);

  // Master output gain — keeps the sympathetic layer subtle.
  const output = ctx.createGain();
  output.gain.value = SYMPATHETIC_OUTPUT_GAIN;
  output.connect(ctx.destination);

  // One narrow bandpass per open string.
  const filters = openFrequencies.map((freq) => {
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = SYMPATHETIC_FILTER_Q;
    bp.connect(output);
    return bp;
  });

  const trigger: SympatheticBus["trigger"] = (
    source,
    time,
    level = SYMPATHETIC_ATTACK_PEAK,
  ) => {
    // Per-trigger envelope gain: gates the source into the bus.
    // We give each trigger its own gain node so the envelopes don't
    // collide when the student plays fast arpeggios.
    const trigGain = ctx.createGain();
    trigGain.gain.setValueAtTime(0, time);
    trigGain.gain.linearRampToValueAtTime(level, time + SYMPATHETIC_ATTACK_S);
    trigGain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + SYMPATHETIC_DECAY_S,
    );

    source.connect(trigGain);
    for (const filter of filters) {
      trigGain.connect(filter);
    }

    // Schedule a disconnect after the envelope ends so the per-trigger
    // node doesn't leak into the audio graph. The +100 ms buffer covers
    // any clock skew between the audio thread and setTimeout.
    const delayMs =
      Math.max(0, time - ctx.currentTime) * 1000 +
      SYMPATHETIC_DECAY_S * 1000 +
      100;
    setTimeout(() => {
      try {
        trigGain.disconnect();
      } catch {
        // Already disconnected by a downstream node cleanup — ignore.
      }
    }, delayMs);
  };

  return { output, trigger, openFrequencies };
}
