/**
 * Strict TDD — playScaleSequence iteration.
 *
 * Iterates `scale.pitchClasses` at 500ms intervals, routing through
 * `playMidiNote` and publishing each pluck to `anim-target` so the
 * Diapason can flash the matching in-scale fret cell.
 *
 * Reuses the fake-timer composition pattern pinned in
 * `play-tuning-check.unit.ts` (risk callout R1): every pitch class —
 * including the LAST one — is followed by a `sleep(500)`, so draining
 * N notes to completion requires N `advanceTimersToNextTimerAsync()`
 * steps, not N-1. `vi.advanceTimersByTimeAsync(ms)` is reserved for
 * the single test that asserts the precise 500ms threshold.
 *
 * Uses `do-*` scales in tests (Do has pitch class 0) so
 * `scale.pitchClasses` reads as the raw mode intervals with no key
 * offset — e.g. Do mayor is exactly [0,2,4,5,7,9,11].
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

describe("playScaleSequence — modes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("plays Do mayor: 7 notes at pitch classes 0,2,4,5,7,9,11", async () => {
    const scale = getScaleById("do-mayor");
    expect(scale.pitchClasses).toEqual([0, 2, 4, 5, 7, 9, 11]);
    const p = playScaleSequence(scale);
    await drain(scale.pitchClasses.length);
    await p;
    expect(playMidiNoteMock).toHaveBeenCalledTimes(7);
    const midis = playMidiNoteMock.mock.calls.map((c) => c[0] as number);
    expect(midis).toEqual([60, 62, 64, 65, 67, 57, 59]);
  });

  it("plays Do menor: 7 notes at pitch classes 0,2,3,5,7,8,10", async () => {
    const scale = getScaleById("do-menor");
    expect(scale.pitchClasses).toEqual([0, 2, 3, 5, 7, 8, 10]);
    const p = playScaleSequence(scale);
    await drain(scale.pitchClasses.length);
    await p;
    const midis = playMidiNoteMock.mock.calls.map((c) => c[0] as number);
    expect(midis).toEqual([60, 62, 63, 65, 67, 68, 58]);
  });

  it("plays Do armónica: 7 notes at pitch classes 0,2,3,5,7,8,11", async () => {
    const scale = getScaleById("do-armonica");
    expect(scale.pitchClasses).toEqual([0, 2, 3, 5, 7, 8, 11]);
    const p = playScaleSequence(scale);
    await drain(scale.pitchClasses.length);
    await p;
    const midis = playMidiNoteMock.mock.calls.map((c) => c[0] as number);
    expect(midis).toEqual([60, 62, 63, 65, 67, 68, 59]);
  });

  it("plays Do cromática: all 12 chromatic notes, each the lowest fretboard occurrence of its pitch class", async () => {
    const scale = getScaleById("do-cromatica");
    expect(scale.pitchClasses).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const p = playScaleSequence(scale);
    await drain(scale.pitchClasses.length);
    await p;
    expect(playMidiNoteMock).toHaveBeenCalledTimes(12);
    const midis = playMidiNoteMock.mock.calls.map((c) => c[0] as number);
    expect(midis).toEqual([60, 61, 62, 63, 64, 65, 66, 67, 68, 57, 58, 59]);
  });

  it("resolves every pitch class to a MIDI note within the fretboard's lowest octave (A3..the octave above), so every key's sequence lands on real fret positions — not just Re's", async () => {
    const scale = getScaleById("sol-mayor");
    const p = playScaleSequence(scale);
    await drain(scale.pitchClasses.length);
    await p;
    const midis = playMidiNoteMock.mock.calls.map((c) => c[0] as number);
    for (const midi of midis) {
      expect(midi).toBeGreaterThanOrEqual(57);
      expect(midi).toBeLessThanOrEqual(68);
    }
    // Sol mayor's tonic (Sol, pc 7) resolves to MIDI 67 — a real,
    // low fret position, not an octave dragged in from a fixed C4
    // anchor unrelated to the instrument's own tuning.
    expect(midis[0]).toBe(67);
  });
});

describe("playScaleSequence — targetIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("publishes to anim-target BEFORE playMidiNote, with distinct scale-${id}-${pc} targetIds", async () => {
    const scale = getScaleById("do-mayor");
    const p = playScaleSequence(scale);
    // Iteration 1 fires synchronously before the first sleep.
    expect(publishMock).toHaveBeenCalledWith({ midi: 60, targetId: "scale-do-mayor-0" });
    expect(playMidiNoteMock).toHaveBeenCalledWith(
      60,
      expect.objectContaining({ targetId: "scale-do-mayor-0" }),
    );

    await drain(scale.pitchClasses.length);
    await p;

    const ids = playMidiNoteMock.mock.calls.map((c) => (c[1] as { targetId?: string }).targetId);
    expect(ids).toEqual([
      "scale-do-mayor-0",
      "scale-do-mayor-2",
      "scale-do-mayor-4",
      "scale-do-mayor-5",
      "scale-do-mayor-7",
      "scale-do-mayor-9",
      "scale-do-mayor-11",
    ]);
    // Every pluck gets a unique targetId — the 40ms same-target debounce
    // in playMidiNote never collides across a scale run.
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

    // Drain the remaining notes + trailing delay so `p` settles.
    await drain(scale.pitchClasses.length - 1);
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
