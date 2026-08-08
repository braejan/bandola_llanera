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
 * Lowest open-string MIDI note on the bandola llanera (A3 — see
 * `STRINGS` in `src/components/diapason/diapason.tsx`). Every pitch
 * class resolves to the lowest fretboard position that plays it,
 * anchored here instead of a fixed absolute octave (e.g. C4).
 *
 * A fixed C4 anchor only ever lined up with a real open string for
 * keys whose pitch classes happened to land on 57/62/69/76 by
 * arithmetic coincidence (chiefly Re mayor, since its tonic pc (2)
 * added to 60 lands exactly on D4's open MIDI, 62) — every other key
 * resolved to arbitrary, sometimes octave-displaced frets, so the
 * playback animation looked broken for anything but Re. Anchoring to
 * the instrument's own lowest open string makes every key resolve
 * onto a genuine low fret position the same way.
 */
const LOWEST_OPEN_MIDI = 57; // A3

/**
 * Resolves a pitch class (0..11) to the lowest MIDI note on the
 * fretboard that plays it — within one octave above `LOWEST_OPEN_MIDI`.
 */
function resolveMidi(pc: number): number {
  const offset = (pc - (LOWEST_OPEN_MIDI % 12) + 12) % 12;
  return LOWEST_OPEN_MIDI + offset;
}

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
    const midi = resolveMidi(pc);
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
