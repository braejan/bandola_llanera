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
 * a joropo-style dominant vamp — A7 A7, tonic tonic, subdominant
 * subdominant, A7 A7 — over `circle`'s three chords, not a flat
 * once-through. Each chord holds for `chordDurationMs` (default
 * 1000ms — a 3/4 measure at 180 BPM: 3 quarter notes × 333ms ≈ 1000ms,
 * a real joropo's galloping pace).
 *
 * `AUDIO_UNAVAILABLE_MESSAGE` is imported and re-exported BY REFERENCE
 * (never redefined) so every consumer — this module, ChordFretboard,
 * and their tests — shares one canonical identity (REQ-PLAY-010).
 */
import { playMidiNote, AUDIO_UNAVAILABLE_MESSAGE } from "./play-midi-note";
import { publish } from "./anim-target";
import { getChordById, type Chord, type Circle } from "../music/chords";

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
  /** Duration of each chord's measure, in ms. Defaults to 1000 (a 3/4 joropo measure at 180 BPM). */
  chordDurationMs?: number;
}

export interface PlayChordByIdOpts {
  onStatus?: (message: string) => void;
  signal?: AbortSignal;
  targetIdPrefix?: string;
}

const DEFAULT_TARGET_ID_PREFIX = "chord";

/** 3/4 measure at 180 BPM: 3 quarter notes × (60000/180)ms ≈ 1000ms. */
const DEFAULT_CHORD_DURATION_MS = 1000;

/**
 * A joropo's harmonic rhythm vamps in pairs rather than walking the
 * circle once — "A7 A7, D D, G G, A7 A7" (or "A7 A7, Dm Dm, Gm Gm, A7
 * A7" in the minor circle). Expressed as roles, not raw array indices,
 * so the pattern stays correct even if `circle.chords`' own order
 * changes again later.
 */
type ChordRole = "dominant" | "tonic" | "subdominant";
const JOROPO_VAMP_ROLES: readonly ChordRole[] = [
  "dominant",
  "dominant",
  "tonic",
  "tonic",
  "subdominant",
  "subdominant",
  "dominant",
  "dominant",
];

function roleOf(chordId: string): ChordRole {
  if (chordId === "la-con-septima") return "dominant";
  if (chordId.startsWith("re-")) return "tonic";
  return "subdominant";
}

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
 * Play `circle` as a joropo vamp — A7 A7, tonic tonic, subdominant
 * subdominant, A7 A7 (`JOROPO_VAMP_ROLES`, 8 strikes total) — each
 * chord a full `playChord` strike held for `chordDurationMs` (default
 * one 3/4 measure, ~1000ms). Every chord strikes twice in a row, so
 * its `ChordFretboard` flashes twice per pair — the same visual
 * re-trigger a repeated `anim-target` publish always produces.
 * Concurrency: single-sequence — the caller aborts the previous run's
 * signal before starting a new one (mirrors ScaleSwitcher's
 * onTuningClick$/onScaleClick$ pattern).
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
  const chordsByRole: Record<ChordRole, Chord> = Object.fromEntries(
    circle.chords.map((c) => [roleOf(c.id), c]),
  ) as Record<ChordRole, Chord>;
  for (const role of JOROPO_VAMP_ROLES) {
    if (signal?.aborted) return;
    const chord = chordsByRole[role];
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
