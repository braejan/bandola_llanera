/**
 * Strict TDD — playScaleSequence iteration.
 *
 * Walks `scale.pitchClasses` PLUS a closing octave tonic across the
 * fretboard at 500ms intervals, routing through `playMidiNote` and
 * publishing each pluck to `anim-target` (with an explicit
 * `stringId`/`fret`) so the Diapason flashes the exact matching cell.
 *
 * Reuses the fake-timer composition pattern pinned in
 * `play-tuning-check.unit.ts` (risk callout R1): every note —
 * including the LAST one — is followed by a `sleep(500)`, so draining
 * N notes to completion requires N `advanceTimersToNextTimerAsync()`
 * steps, not N-1. `vi.advanceTimersByTimeAsync(ms)` is reserved for
 * the single test that asserts the precise 500ms threshold.
 *
 * Uses `do-*` scales in tests (Do has pitch class 0) so
 * `scale.pitchClasses` reads as the raw mode intervals with no key
 * offset — e.g. Do mayor is exactly [0,2,4,5,7,9,11].
 *
 * Expected string/fret sequences below were hand-derived by tracing
 * `walkFretboard`'s two rules (prefer the immediate next string's
 * open note; else fret the current string forward, never
 * backward) — see `play-scale-sequence.ts` for the algorithm itself.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getScaleById } from "../music/scales";

vi.mock("./play-midi-note", () => ({
  playMidiNote: vi.fn().mockResolvedValue(null),
}));

vi.mock("./anim-target", () => ({
  publish: vi.fn(),
  subscribe: vi.fn(() => () => undefined),
  __resetAnimTargetForTests: vi.fn(),
}));

import { playMidiNote } from "./play-midi-note";
import { publish } from "./anim-target";
import { playScaleSequence } from "./play-scale-sequence";

const playMidiNoteMock = vi.mocked(playMidiNote);
const publishMock = vi.mocked(publish);

/** Advance the fake clock through `n` pending timers, one at a time. */
async function drain(n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    await vi.advanceTimersToNextTimerAsync();
  }
}

describe("playScaleSequence — modes (7 degrees + the closing octave tonic = 8 notes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("plays Do mayor: walks A3 → D4 → D4 → D4 → D4 → A4 → A4 → A4, never doubling back to an earlier string", async () => {
    const scale = getScaleById("do-mayor");
    expect(scale.pitchClasses).toEqual([0, 2, 4, 5, 7, 9, 11]);
    const p = playScaleSequence(scale);
    await drain(scale.pitchClasses.length + 1);
    await p;
    expect(playMidiNoteMock).toHaveBeenCalledTimes(8);
    const midis = playMidiNoteMock.mock.calls.map((c) => c[0] as number);
    const ids = playMidiNoteMock.mock.calls.map(
      (c) => (c[1] as { targetId?: string }).targetId,
    );
    // Previously [60, 62, 64, 65, 67, 57, 59] (7 notes) — A and B fell
    // back an octave because each pitch class was resolved
    // independently of where the previous note landed.
    expect(midis).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    expect(ids).toEqual([
      "scale-do-mayor-A3-3",
      "scale-do-mayor-D4-0",
      "scale-do-mayor-D4-2",
      "scale-do-mayor-D4-3",
      "scale-do-mayor-D4-5",
      "scale-do-mayor-A4-0",
      "scale-do-mayor-A4-2",
      "scale-do-mayor-A4-3",
    ]);
    // The last note is exactly one octave (12 semitones) above the
    // first — the sequence closes on the tonic, not the 7th degree.
    expect(midis[midis.length - 1]).toBe(midis[0] + 12);
  });

  it("plays Do menor: walks A3 → D4 (x5) → A4 (x2)", async () => {
    const scale = getScaleById("do-menor");
    expect(scale.pitchClasses).toEqual([0, 2, 3, 5, 7, 8, 10]);
    const p = playScaleSequence(scale);
    await drain(scale.pitchClasses.length + 1);
    await p;
    const midis = playMidiNoteMock.mock.calls.map((c) => c[0] as number);
    // Previously [60, 62, 63, 65, 67, 68, 58] (7 notes) — the last
    // note (A♯) jumped back an octave.
    expect(midis).toEqual([60, 62, 63, 65, 67, 68, 70, 72]);
  });

  it("plays Do armónica: walks A3 → D4 (x5) → A4 (x2)", async () => {
    const scale = getScaleById("do-armonica");
    expect(scale.pitchClasses).toEqual([0, 2, 3, 5, 7, 8, 11]);
    const p = playScaleSequence(scale);
    await drain(scale.pitchClasses.length + 1);
    await p;
    const midis = playMidiNoteMock.mock.calls.map((c) => c[0] as number);
    // Previously [60, 62, 63, 65, 67, 68, 59] (7 notes) — the last
    // note (B) jumped back an octave.
    expect(midis).toEqual([60, 62, 63, 65, 67, 68, 71, 72]);
  });

  it("plays Do cromática: 13 notes, strictly ascending one semitone at a time", async () => {
    const scale = getScaleById("do-cromatica");
    expect(scale.pitchClasses).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const p = playScaleSequence(scale);
    await drain(scale.pitchClasses.length + 1);
    await p;
    expect(playMidiNoteMock).toHaveBeenCalledTimes(13);
    const midis = playMidiNoteMock.mock.calls.map((c) => c[0] as number);
    // Previously [60,61,...,68,57,58,59] (12 notes) — the last 3
    // notes (A, A♯, B) jumped back an octave.
    expect(midis).toEqual([
      60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72,
    ]);
  });

  it("never plays a note lower than or equal to the one before it, for every key (Sol mayor) — the sequence always continues forward across the fretboard", async () => {
    const scale = getScaleById("sol-mayor");
    const p = playScaleSequence(scale);
    await drain(scale.pitchClasses.length + 1);
    await p;
    const midis = playMidiNoteMock.mock.calls.map((c) => c[0] as number);
    for (let i = 1; i < midis.length; i++) {
      expect(midis[i]).toBeGreaterThan(midis[i - 1]);
    }
    // Sol mayor's tonic (Sol, pc 7) still resolves to MIDI 67 — a
    // real, low fret position, not an octave dragged in from a fixed
    // C4 anchor unrelated to the instrument's own tuning. Only the
    // FIRST note is anchored this way; the rest climb from there,
    // walking D4 → A4 (x4) → E5 (x3), closing on G an octave up (79).
    expect(midis).toEqual([67, 69, 71, 72, 74, 76, 78, 79]);
  });

  it("every mode, every tono: the sequence is strictly ascending, plays pitchClasses.length + 1 notes, and every note lands on a real fretboard position (fret >= 0)", async () => {
    const { ALL_KEYS_LIST, SCALES } = await import("../music/scales");
    expect(ALL_KEYS_LIST.length).toBe(12);
    for (const scale of SCALES) {
      vi.clearAllMocks();
      const p = playScaleSequence(scale);
      await drain(scale.pitchClasses.length + 1);
      await p;
      const midis = playMidiNoteMock.mock.calls.map((c) => c[0] as number);
      const ids = playMidiNoteMock.mock.calls.map(
        (c) => (c[1] as { targetId?: string }).targetId,
      );
      expect(midis.length).toBe(scale.pitchClasses.length + 1);
      for (let i = 1; i < midis.length; i++) {
        expect(midis[i]).toBeGreaterThan(midis[i - 1]);
      }
      // The last note is always exactly one octave above the first —
      // every scale closes on its own tonic.
      expect(midis[midis.length - 1]).toBe(midis[0] + 12);
      // Every targetId is unique — no two notes land on the same
      // exact string+fret, so the 40ms same-target debounce in
      // playMidiNote never collides across a run.
      expect(new Set(ids).size).toBe(ids.length);
      for (const midi of midis) {
        expect(midi).toBeGreaterThanOrEqual(57);
      }
    }
  });
});

describe("playScaleSequence — targetIds and explicit stringId/fret", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("publishes to anim-target BEFORE playMidiNote, with distinct scale-${id}-${stringId}-${fret} targetIds carrying explicit stringId/fret", async () => {
    const scale = getScaleById("do-mayor");
    const p = playScaleSequence(scale);
    // Iteration 1 fires synchronously before the first sleep.
    expect(publishMock).toHaveBeenCalledWith({
      midi: 60,
      targetId: "scale-do-mayor-A3-3",
      stringId: "A3",
      fret: 3,
    });
    expect(playMidiNoteMock).toHaveBeenCalledWith(
      60,
      expect.objectContaining({ targetId: "scale-do-mayor-A3-3" }),
    );

    await drain(scale.pitchClasses.length + 1);
    await p;

    const ids = playMidiNoteMock.mock.calls.map(
      (c) => (c[1] as { targetId?: string }).targetId,
    );
    expect(ids).toEqual([
      "scale-do-mayor-A3-3",
      "scale-do-mayor-D4-0",
      "scale-do-mayor-D4-2",
      "scale-do-mayor-D4-3",
      "scale-do-mayor-D4-5",
      "scale-do-mayor-A4-0",
      "scale-do-mayor-A4-2",
      "scale-do-mayor-A4-3",
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("playScaleSequence — delay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits 500ms between successive notes", async () => {
    const scale = getScaleById("do-mayor");
    const p = playScaleSequence(scale);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(1);

    // 499ms is not enough — note 2 must not have fired yet.
    await vi.advanceTimersByTimeAsync(499);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(1);

    // 500ms is the threshold — note 2 fires now.
    await vi.advanceTimersByTimeAsync(1);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(2);

    // Drain the remaining notes (including the closing octave) +
    // trailing delay so `p` settles.
    await drain(scale.pitchClasses.length);
    await p;
  });
});

describe("playScaleSequence — abort", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stops mid-sequence when aborted after the 3rd pluck (no orphan tail)", async () => {
    const scale = getScaleById("do-mayor");
    const controller = new AbortController();
    const p = playScaleSequence(scale, { signal: controller.signal });
    expect(playMidiNoteMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersToNextTimerAsync();
    expect(playMidiNoteMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersToNextTimerAsync();
    expect(playMidiNoteMock).toHaveBeenCalledTimes(3);

    controller.abort();
    await vi.advanceTimersByTimeAsync(500);
    await p;
    expect(playMidiNoteMock).toHaveBeenCalledTimes(3);
  });

  it("does not throw when aborted before the first pluck", async () => {
    const scale = getScaleById("do-mayor");
    const controller = new AbortController();
    controller.abort();
    const p = playScaleSequence(scale, { signal: controller.signal });
    await p;
    expect(playMidiNoteMock).not.toHaveBeenCalled();
  });
});

// Cancelling a previous run when the caller triggers a new one
// (REQ-auto-scale-5) is a caller-level concern — `playScaleSequence`
// only reacts to the `AbortSignal` it is given. That retrigger
// behavior is covered where the abort/retrigger decision is actually
// made: ScaleSwitcher's `onScaleClick$` (T-9, `scale-switcher.unit.ts`).
