/**
 * Strict TDD — playTuningCheck sequence.
 *
 * The sequence plucks A3 (57) → D4 (62) → A4 (69) → E5 (76) at 700ms
 * intervals, routing through `playMidiNote` and publishing each
 * pluck to `anim-target` so the Diapason can flash the matching
 * open-string cell. The function accepts an `AbortSignal` and
 * stops mid-sequence without orphaning a partial tail.
 *
 * Risk callout R1: `vi.useFakeTimers()` + async timer advancement
 * must compose with the existing vitest setup before this pattern
 * is scaled to T-4. Confirmed pattern, pinned here:
 *   - Step through pending timers with `await vi.advanceTimersToNextTimerAsync()`
 *     instead of accumulating `advanceTimersByTimeAsync(ms)` calls. It
 *     needs no cumulative-ms bookkeeping, so it can't drift out of sync
 *     with however many timers the sequence actually schedules.
 *   - `playTuningCheck`'s loop calls `sleep(700)` after EVERY pluck,
 *     including the last one (E5) — so a full, unaborted 4-note run
 *     schedules 4 timers, not 3 "gaps between notes". Any test that
 *     awaits the sequence's returned promise to completion MUST drain
 *     all 4 timers first, or the `await` hangs forever (the fake clock
 *     never advances on its own).
 *   - `advanceTimersByTimeAsync(ms)` is reserved for the one test that
 *     asserts the precise 700ms threshold (699ms not enough, +1ms is).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
import { playTuningCheck } from "./play-tuning-check";

const playMidiNoteMock = vi.mocked(playMidiNote);
const publishMock = vi.mocked(publish);

describe("playTuningCheck — sequence order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("plays A3 → D4 → A4 → E5 in order with tuning-${label} targetIds", async () => {
    const p = playTuningCheck();
    // Iteration 1 fires synchronously before the first sleep.
    expect(playMidiNoteMock).toHaveBeenCalledTimes(1);
    expect(playMidiNoteMock).toHaveBeenLastCalledWith(
      57,
      expect.objectContaining({ targetId: "tuning-A3" }),
    );
    expect(publishMock).toHaveBeenLastCalledWith({
      midi: 57,
      targetId: "tuning-A3",
    });

    await vi.advanceTimersToNextTimerAsync();
    expect(playMidiNoteMock).toHaveBeenCalledTimes(2);
    expect(playMidiNoteMock).toHaveBeenLastCalledWith(
      62,
      expect.objectContaining({ targetId: "tuning-D4" }),
    );

    await vi.advanceTimersToNextTimerAsync();
    expect(playMidiNoteMock).toHaveBeenCalledTimes(3);
    expect(playMidiNoteMock).toHaveBeenLastCalledWith(
      69,
      expect.objectContaining({ targetId: "tuning-A4" }),
    );

    await vi.advanceTimersToNextTimerAsync();
    expect(playMidiNoteMock).toHaveBeenCalledTimes(4);
    expect(playMidiNoteMock).toHaveBeenLastCalledWith(
      76,
      expect.objectContaining({ targetId: "tuning-E5" }),
    );

    // The loop calls sleep(700) after E5 too (last iteration is not
    // special-cased) — drain that trailing timer so `p` settles.
    await vi.advanceTimersToNextTimerAsync();
    await p;
  });

  it("publishes each pluck to anim-target BEFORE routing through playMidiNote", async () => {
    // The visual feedback must lead the audio by at least one tick.
    const p = playTuningCheck();
    expect(publishMock).toHaveBeenCalledWith({ midi: 57, targetId: "tuning-A3" });
    expect(playMidiNoteMock).toHaveBeenCalledWith(
      57,
      expect.objectContaining({ targetId: "tuning-A3" }),
    );
    // Drain the remaining 4 pending timers (D4, A4, E5, trailing) so
    // `p` settles instead of leaking a pending sequence into the next test.
    await vi.advanceTimersToNextTimerAsync();
    await vi.advanceTimersToNextTimerAsync();
    await vi.advanceTimersToNextTimerAsync();
    await vi.advanceTimersToNextTimerAsync();
    await p;
  });

  it("uses distinct targetIds so the 40ms same-target debounce never collides", async () => {
    const p = playTuningCheck();
    // Drain the full sequence FIRST — targetIds must be read after every
    // pluck has fired, not immediately after the synchronous first pluck.
    await vi.advanceTimersToNextTimerAsync();
    await vi.advanceTimersToNextTimerAsync();
    await vi.advanceTimersToNextTimerAsync();
    await vi.advanceTimersToNextTimerAsync();
    await p;
    const ids = playMidiNoteMock.mock.calls.map((c) => (c[1] as { targetId?: string }).targetId);
    expect(ids).toEqual(["tuning-A3", "tuning-D4", "tuning-A4", "tuning-E5"]);
  });
});

describe("playTuningCheck — delay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits 700ms between successive plucks", async () => {
    const p = playTuningCheck();
    // Iteration 1 has fired.
    expect(playMidiNoteMock).toHaveBeenCalledTimes(1);

    // 699ms is not enough — iteration 2 must not have fired yet.
    await vi.advanceTimersByTimeAsync(699);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(1);

    // 700ms is the threshold — iteration 2 fires now.
    await vi.advanceTimersByTimeAsync(1);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(2);

    // Drain the remaining iterations (A4, E5, trailing delay) so `p`
    // settles instead of leaking a pending sequence into the next test.
    await vi.advanceTimersToNextTimerAsync();
    await vi.advanceTimersToNextTimerAsync();
    await vi.advanceTimersToNextTimerAsync();
    await p;
  });

  it("does not interleave plucks: only one fires per delay window", async () => {
    const p = playTuningCheck();
    await vi.advanceTimersByTimeAsync(700);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(699);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(3);

    // Drain the remaining iteration (E5) + trailing delay.
    await vi.advanceTimersToNextTimerAsync();
    await vi.advanceTimersToNextTimerAsync();
    await p;
  });
});

describe("playTuningCheck — abort", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stops mid-sequence when the signal aborts before a pluck", async () => {
    const controller = new AbortController();
    const p = playTuningCheck({ signal: controller.signal });
    // Iteration 1 already fired.
    expect(playMidiNoteMock).toHaveBeenCalledTimes(1);
    controller.abort();
    // Let microtasks settle; the function should refuse iteration 2.
    await vi.advanceTimersByTimeAsync(700);
    await p;
    expect(playMidiNoteMock).toHaveBeenCalledTimes(1);
  });

  it("stops mid-sequence when the signal aborts during the delay", async () => {
    const controller = new AbortController();
    const p = playTuningCheck({ signal: controller.signal });
    // Iteration 1 fires.
    await vi.advanceTimersByTimeAsync(300);
    // Abort while the delay is still pending.
    controller.abort();
    await vi.advanceTimersByTimeAsync(700);
    await p;
    expect(playMidiNoteMock).toHaveBeenCalledTimes(1);
  });

  it("does not throw when aborted before the first pluck", async () => {
    const controller = new AbortController();
    controller.abort();
    const p = playTuningCheck({ signal: controller.signal });
    await p;
    expect(playMidiNoteMock).not.toHaveBeenCalled();
  });
});
