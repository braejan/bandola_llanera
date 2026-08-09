/**
 * playChord / playCircleSequence / playChordById — chord playback for
 * the joropo D circle.
 *
 * Mirrors `playTuningCheck`'s shape: a loop + a local, cancellable
 * `sleep(ms, signal)` + `publish({ midi, targetId })` BEFORE routing
 * through `playMidiNote`. Local `sleep` (not imported from
 * `play-tuning-check.ts` or `play-scale-sequence.ts`) so every
 * sequence module stays a sibling with no cross-dependency, per the
 * design's module breakdown (same convention `play-scale-sequence.ts`
 * already follows).
 *
 * `playChord` strikes every note of a chord in the same audio tick —
 * sequential same-JS-task `await`s of `playMidiNote` (no delay, no
 * timer between notes) keep every voice's `startedAt` within the same
 * `ctx.currentTime` sample (REQ-PLAY-002). `playCircleSequence` walks
 * a `Circle`'s three chords with a configurable delay between them
 * (default 1500ms — REQ-PLAY-005).
 *
 * `AUDIO_UNAVAILABLE_MESSAGE` is imported and re-exported BY REFERENCE
 * (never redefined) so every consumer — this module, ChordFretboard,
 * and their tests — shares one canonical identity (REQ-PLAY-010).
 */
import { playMidiNote, AUDIO_UNAVAILABLE_MESSAGE } from "./play-midi-note";
import { publish } from "./anim-target";
import { getChordById, type Circle } from "../music/chords";

export { AUDIO_UNAVAILABLE_MESSAGE };

export interface PlayChordOpts {
  /** Prefix for the per-note anim-target id: `${targetIdPrefix}-${i}`. */
  targetIdPrefix?: string;
  /** Optional status callback (Spanish copy), forwarded to playMidiNote. */
  onStatus?: (message: string) => void;
  signal?: AbortSignal;
}

export interface PlayCircleSequenceOpts {
  onStatus?: (message: string) => void;
  signal?: AbortSignal;
  /** Silence between chords, in ms. Defaults to 1500. */
  chordDurationMs?: number;
}

export interface PlayChordByIdOpts {
  onStatus?: (message: string) => void;
  signal?: AbortSignal;
  targetIdPrefix?: string;
}

const DEFAULT_TARGET_ID_PREFIX = "chord";
const DEFAULT_CHORD_DURATION_MS = 1500;

/**
 * Resolves after `ms` milliseconds OR rejects immediately if the signal
 * aborts. The timer is cleared on abort so the function never leaks
 * pending work.
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
 * Strike every `midi` in `midis` as a simultaneous chord. Each note is
 * scheduled through `playMidiNote` (REQ-PLAY-008 — inherits the
 * 8-voice cap, the 40ms debounce, and the first-gesture ctx.resume()
 * unlock; this module never touches AudioContext directly). Every note
 * publishes to `anim-target` BEFORE it is scheduled (REQ-PLAY-003). The
 * signal is checked before EVERY note, so an abort mid-chord stops the
 * remaining notes without throwing (REQ-PLAY-004).
 */
export async function playChord(
  midis: readonly number[],
  opts: PlayChordOpts = {},
): Promise<void> {
  const { targetIdPrefix = DEFAULT_TARGET_ID_PREFIX, onStatus, signal } = opts;
  for (let i = 0; i < midis.length; i++) {
    if (signal?.aborted) return;
    const midi = midis[i];
    const targetId = `${targetIdPrefix}-${i}`;
    publish({ midi, targetId });
    await playMidiNote(midi, { targetId, onStatus });
  }
}

/**
 * Walk the three chords of `circle` in order, each a full `playChord`
 * strike, with `chordDurationMs` (default 1500) of silence between
 * chords. Concurrency: single-sequence — the caller aborts the
 * previous run's signal before starting a new one (mirrors
 * ScaleSwitcher's onTuningClick$/onScaleClick$ pattern).
 */
export async function playCircleSequence(
  circle: Circle,
  opts: PlayCircleSequenceOpts = {},
): Promise<void> {
  const {
    signal,
    onStatus,
    chordDurationMs = DEFAULT_CHORD_DURATION_MS,
  } = opts;
  for (const chord of circle.chords) {
    if (signal?.aborted) return;
    await playChord(
      chord.voicing.map((v) => v.midi),
      { targetIdPrefix: `chord-${chord.id}`, onStatus, signal },
    );
    if (signal?.aborted) return;
    try {
      await sleep(chordDurationMs, signal);
    } catch {
      // Aborted during the gap — exit cleanly, no orphan tail.
      return;
    }
  }
}

/**
 * Resolve `chordId` via `getChordById` and play it. Unknown ids
 * surface the Spanish status message and resolve without scheduling
 * anything.
 */
export async function playChordById(
  chordId: string,
  opts: PlayChordByIdOpts = {},
): Promise<void> {
  const chord = getChordById(chordId);
  if (!chord) {
    opts.onStatus?.(`Acorde desconocido: ${chordId}`);
    return;
  }
  await playChord(
    chord.voicing.map((v) => v.midi),
    {
      targetIdPrefix: opts.targetIdPrefix ?? `chord-${chord.id}`,
      onStatus: opts.onStatus,
      signal: opts.signal,
    },
  );
}
