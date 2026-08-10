/**
 * playScaleSequence — walk every degree of a scale UP the fretboard,
 * one string at a time, ending on the octave tonic, 500ms apart via
 * `playMidiNote`.
 *
 * Mirrors `playTuningCheck`'s shape (see risk callout R1 pinned in
 * `play-tuning-check.unit.ts`): every note publishes to `anim-target`
 * before routing through `playMidiNote`, checks the `AbortSignal`
 * before scheduling the next pluck, and awaits a cancellable delay
 * between notes.
 */
import { playMidiNote } from "./play-midi-note";
import { publish } from "./anim-target";
import type { Scale } from "../music/scales";

export interface PlayScaleSequenceOpts {
  signal?: AbortSignal;
}

/**
 * The bandola llanera's 4 strings, low to high. Mirrors the same
 * tuning duplicated in `diapason.tsx`'s `STRINGS`, `chord-fretboard.tsx`'s
 * `OPEN_MIDI`, and `music/chords.ts`'s `OPEN_MIDI` — no shared module
 * exists yet for this instrument-identity constant.
 */
const STRING_ORDER: readonly { id: string; openMidi: number }[] = [
  { id: "A3", openMidi: 57 },
  { id: "D4", openMidi: 62 },
  { id: "A4", openMidi: 69 },
  { id: "E5", openMidi: 76 },
];

/**
 * Highest fret normally rendered (0..7) — see FRET_COLUMNS in
 * diapason.tsx / chord-fretboard.tsx. Only the LAST string (E5) is
 * ever allowed past this cap (see `walkFretboard` below); every
 * pitch-class run this app plays spans at most one octave (11
 * semitones) end to end, and E5's own open note is at most 11
 * semitones above the walk's starting anchor, so even the worst case
 * never asks E5 for more than ~fret 15 — nowhere near a runaway.
 */
const MAX_VISIBLE_FRET = 7;

export interface ScalePosition {
  stringId: string;
  fret: number;
  midi: number;
}

/**
 * Resolves a full pitch-class sequence (see `withOctave` below) to a
 * WALK across the fretboard: strictly forward, one string at a time,
 * never doubling back — the same path a player's hand traces climbing
 * the neck. Two rules, checked in order at every note:
 *
 *  1. If the string immediately after the current one plays this
 *     pitch class OPEN (fret 0), take it. An open string is always
 *     preferred over fretting the current string further — this is
 *     what makes Re mayor's tonic land on D4 open instead of A3 fret 5,
 *     and is exactly the "prioritize an open string over a previous
 *     fretted position" rule.
 *  2. Otherwise, fret the CURRENT string at the lowest fret >= the
 *     floor (the fret used last on this string, so it can only move
 *     forward — never repeat or go backward on the same string). If
 *     the current string can't reach this pitch class within the
 *     visible board (frets 0..7), advance to the next string and
 *     retry both rules there. The LAST string (E5) has no fret cap —
 *     by the time the walk reaches it there is nowhere else to
 *     advance to, so it must resolve every remaining note somehow
 *     (see `MAX_VISIBLE_FRET`'s own comment for why that never runs
 *     away).
 *
 * Previously each pitch class was resolved to "the lowest MIDI within
 * one octave of A3" independently of where the last note landed. That
 * let a pitch class whose low-octave position happened to sit on an
 * EARLIER string (e.g. A on open A3) win over the string the sequence
 * had already moved on to — the animation visibly bounced backward
 * between strings (A3 → D4 → A3 → D4 for Do mayor) instead of reading
 * as one continuous pass up the neck.
 */
function walkFretboard(pitchClasses: readonly number[]): ScalePosition[] {
  const positions: ScalePosition[] = [];
  let stringIndex = 0;
  let floor = 0;
  for (const rawPc of pitchClasses) {
    const pc = ((rawPc % 12) + 12) % 12;
    for (;;) {
      const current = STRING_ORDER[stringIndex];
      const next = STRING_ORDER[stringIndex + 1];
      if (next && next.openMidi % 12 === pc) {
        positions.push({ stringId: next.id, fret: 0, midi: next.openMidi });
        stringIndex += 1;
        floor = 1;
        break;
      }
      const isLastString = stringIndex === STRING_ORDER.length - 1;
      const maxFret = isLastString ? Infinity : MAX_VISIBLE_FRET;
      let fret = floor;
      while (fret <= maxFret && (current.openMidi + fret) % 12 !== pc) fret++;
      if (fret <= maxFret) {
        positions.push({
          stringId: current.id,
          fret,
          midi: current.openMidi + fret,
        });
        floor = fret + 1;
        break;
      }
      // This string is exhausted for this pitch class — move to the next one.
      stringIndex += 1;
      floor = 0;
    }
  }
  return positions;
}

/**
 * Appends the tonic's next forward occurrence — the octave that
 * completes the scale (every mode plays one note more than its own
 * `pitchClasses` length: 8 for a 7-note diatonic scale, 13 for the
 * 12-note cromática).
 */
function withOctave(pitchClasses: readonly number[]): number[] {
  return [...pitchClasses, pitchClasses[0]];
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
 * Play every degree of `scale.pitchClasses` PLUS the closing octave
 * tonic, 500ms apart. Concurrency: single-sequence — the caller
 * (ScaleSwitcher's `onScaleClick$`) aborts the previous run's signal
 * before starting a new one, so overlapping runs never interleave.
 */
export async function playScaleSequence(
  scale: Scale,
  opts: PlayScaleSequenceOpts = {},
): Promise<void> {
  const { signal } = opts;
  const positions = walkFretboard(withOctave(scale.pitchClasses));
  for (const { stringId, fret, midi } of positions) {
    if (signal?.aborted) return;
    const targetId = `scale-${scale.id}-${stringId}-${fret}`;
    publish({ midi, targetId, stringId, fret });
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
