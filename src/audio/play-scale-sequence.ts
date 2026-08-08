/**
 * playScaleSequence — iterate a scale's pitch classes at 500ms via
 * `playMidiNote`.
 *
 * Mirrors `playTuningCheck`'s shape (see risk callout R1 pinned in
 * `play-tuning-check.unit.ts`): every pitch class publishes to
 * `anim-target` before routing through `playMidiNote`, checks the
 * `AbortSignal` before scheduling the next pluck, and awaits a
 * cancellable delay between notes. Cromática needs no special
 * branch — `scale.pitchClasses` already covers all 12 semitones (see
 * `src/music/scales.ts` `MODE_INTERVALS.cromatica`), so the same loop
 * plays every mode.
 */
import { playMidiNote } from "./play-midi-note";
import { publish } from "./anim-target";
import type { Scale } from "../music/scales";

export interface PlayScaleSequenceOpts {
  signal?: AbortSignal;
}

/**
 * Base MIDI note for pitch class 0 (C4 / Do4). Every pitch class in
 * `scale.pitchClasses` (0..11) is added to this to get the absolute
 * MIDI note played. See `src/music/scales.ts` for the canonical
 * pitch-class mapping per key/mode.
 */
const BASE_MIDI = 60;

const SCALE_DELAY_MS = 500;

/**
 * Resolves after `ms` milliseconds OR rejects immediately if the
 * signal aborts. The timer is cleared on abort so the function never
 * leaks pending work. Local to this module (not imported from
 * `play-tuning-check.ts`) so the two sequence modules stay sibling
 * modules with no cross-dependency, per the design's module
 * breakdown.
 */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("aborted"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Play every pitch class in `scale.pitchClasses` in order, 500ms
 * apart. Concurrency: single-sequence — the caller (ScaleSwitcher's
 * `onScaleClick$`) aborts the previous run's signal before starting a
 * new one, so overlapping runs never interleave.
 */
export async function playScaleSequence(
  scale: Scale,
  opts: PlayScaleSequenceOpts = {},
): Promise<void> {
  const { signal } = opts;
  for (const pc of scale.pitchClasses) {
    if (signal?.aborted) return;
    const midi = BASE_MIDI + pc;
    const targetId = `scale-${scale.id}-${pc}`;
    publish({ midi, targetId });
    await playMidiNote(midi, { targetId });
    if (signal?.aborted) return;
    try {
      await sleep(SCALE_DELAY_MS, signal);
    } catch {
      // Aborted during the delay — exit cleanly, no orphan tail.
      return;
    }
  }
}
