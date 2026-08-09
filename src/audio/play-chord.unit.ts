/**
 * Strict TDD — playChord / playCircleSequence / playChordById.
 *
 * Mirrors `play-tuning-check.unit.ts`'s mocking shape: `playMidiNote`
 * and `anim-target` are mocked so this suite tests wiring, not audio.
 * `../music/chords` is imported for real — it is a pure data module,
 * nothing to mock.
 *
 * `playChord` has NO delay between its own notes (REQ-PLAY-002) — the
 * 4-note loop resolves via chained microtasks only, no timer. Tests
 * that need to catch it "mid-chord" (abort after N notes) use a
 * manually-controlled resolver array + `await Promise.resolve()`
 * flushes (the same idiom `scale-switcher.unit.tsx` uses for its
 * audio-status wiring test), NOT fake timers. `playCircleSequence`'s
 * inter-chord gap DOES use a timer, so those tests use
 * `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync(ms)`, which
 * advances the clock AND drains the chord-internal microtask chain
 * (Node fully drains the microtask queue between real event-loop
 * ticks, so the 4 chained note-awaits settle before the next due
 * timer fires — same principle as the tuning-check precedent, just
 * with a deeper per-chord await chain).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./play-midi-note", () => ({
  playMidiNote: vi.fn().mockResolvedValue(null),
  AUDIO_UNAVAILABLE_MESSAGE:
    "Audio no disponible. Toca una nota para intentarlo de nuevo.",
}));

vi.mock("./anim-target", () => ({
  publish: vi.fn(),
  subscribe: vi.fn(() => () => undefined),
  __resetAnimTargetForTests: vi.fn(),
}));

import { playMidiNote } from "./play-midi-note";
import { publish } from "./anim-target";
import {
  AUDIO_UNAVAILABLE_MESSAGE,
  playChord,
  playChordById,
  playCircleSequence,
} from "./play-chord";
import { JOROPO_D_MAJOR_CIRCLE } from "../music/chords";

const playMidiNoteMock = vi.mocked(playMidiNote);
const publishMock = vi.mocked(publish);

beforeEach(() => {
  vi.clearAllMocks();
  playMidiNoteMock.mockResolvedValue(null);
});

describe("play-chord — module shape (REQ-PLAY-001)", () => {
  it("exports playChord, playCircleSequence, and playChordById as functions", () => {
    expect(typeof playChord).toBe("function");
    expect(typeof playCircleSequence).toBe("function");
    expect(typeof playChordById).toBe("function");
  });
});

describe("playChord — simultaneous strike (REQ-PLAY-002)", () => {
  it("schedules every midi via playMidiNote exactly once each, in the given order", async () => {
    await playChord([57, 62, 69, 78]);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(4);
    expect(playMidiNoteMock.mock.calls.map((c) => c[0])).toEqual([
      57, 62, 69, 78,
    ]);
  });

  it("produces the same set of 4 voices regardless of input order", async () => {
    await playChord([57, 62, 69, 78]);
    const firstOrder = playMidiNoteMock.mock.calls.map((c) => c[0]);
    vi.clearAllMocks();
    playMidiNoteMock.mockResolvedValue(null);

    await playChord([78, 69, 62, 57]);
    const secondOrder = playMidiNoteMock.mock.calls.map((c) => c[0]);

    expect(new Set(firstOrder)).toEqual(new Set(secondOrder));
    expect(firstOrder.length).toBe(4);
    expect(secondOrder.length).toBe(4);
  });
});

describe("playChord — anim-target publish per note (REQ-PLAY-003)", () => {
  it("publishes each note with targetId `${targetIdPrefix}-${i}`", async () => {
    await playChord([57, 62, 69, 78], { targetIdPrefix: "chord-re-mayor" });
    expect(publishMock).toHaveBeenCalledTimes(4);
    expect(publishMock.mock.calls.map((c) => c[0])).toEqual([
      { midi: 57, targetId: "chord-re-mayor-0" },
      { midi: 62, targetId: "chord-re-mayor-1" },
      { midi: 69, targetId: "chord-re-mayor-2" },
      { midi: 78, targetId: "chord-re-mayor-3" },
    ]);
  });

  it('defaults targetIdPrefix to "chord" when not provided', async () => {
    await playChord([57]);
    expect(publishMock).toHaveBeenCalledWith({ midi: 57, targetId: "chord-0" });
  });

  it("publishes a note BEFORE its playMidiNote call resolves", async () => {
    const order: string[] = [];
    publishMock.mockImplementation(() => {
      order.push("publish");
    });
    playMidiNoteMock.mockImplementation(async () => {
      order.push("playMidiNote");
      return null;
    });
    await playChord([57], { targetIdPrefix: "chord-x" });
    expect(order).toEqual(["publish", "playMidiNote"]);
  });
});

describe("playChord — onStatus forwarding", () => {
  it("forwards the onStatus callback into every playMidiNote call", async () => {
    const onStatus = vi.fn();
    await playChord([57, 62], { onStatus });
    for (const call of playMidiNoteMock.mock.calls) {
      expect((call[1] as { onStatus?: unknown }).onStatus).toBe(onStatus);
    }
  });
});

describe("playChord — abort (REQ-PLAY-004)", () => {
  it("schedules nothing when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await playChord([57, 62, 69, 78], { signal: controller.signal });
    expect(playMidiNoteMock).not.toHaveBeenCalled();
  });

  it("does not throw when aborted before the call", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      playChord([57, 62, 69, 78], { signal: controller.signal }),
    ).resolves.toBeUndefined();
  });

  it("stops scheduling remaining notes when aborted after 2 of 4 notes have fired", async () => {
    const resolvers: Array<() => void> = [];
    playMidiNoteMock.mockImplementation(
      () => new Promise((resolve) => resolvers.push(() => resolve(null))),
    );
    const controller = new AbortController();
    const p = playChord([57, 62, 69, 78], { signal: controller.signal });

    // Note 0 fires synchronously (first loop iteration, before any await).
    expect(playMidiNoteMock).toHaveBeenCalledTimes(1);
    resolvers[0]();
    await Promise.resolve();
    await Promise.resolve();
    expect(playMidiNoteMock).toHaveBeenCalledTimes(2);

    // Abort now — note 1's promise still needs to resolve for the loop
    // to re-check `signal.aborted` before attempting note 2.
    controller.abort();
    resolvers[1]();
    await Promise.resolve();
    await Promise.resolve();
    await p;

    expect(playMidiNoteMock).toHaveBeenCalledTimes(2);
  });
});

describe("playCircleSequence — walks the 3 chords in order (REQ-PLAY-005)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("plays La con séptima, then Re mayor, then Sol mayor, 1500ms apart by default", async () => {
    const p = playCircleSequence(JOROPO_D_MAJOR_CIRCLE);

    await vi.advanceTimersByTimeAsync(0);
    expect(playMidiNoteMock.mock.calls.map((c) => c[0])).toEqual([
      57, 64, 73, 79,
    ]);

    await vi.advanceTimersByTimeAsync(1500);
    expect(playMidiNoteMock.mock.calls.slice(4).map((c) => c[0])).toEqual([
      57, 62, 69, 78,
    ]);

    await vi.advanceTimersByTimeAsync(1500);
    expect(playMidiNoteMock.mock.calls.slice(8).map((c) => c[0])).toEqual([
      59, 62, 71, 79,
    ]);

    // Trailing gap after the last chord (loop is not special-cased).
    await vi.advanceTimersByTimeAsync(1500);
    await p;
    expect(playMidiNoteMock).toHaveBeenCalledTimes(12);
  });

  it("does not start the second chord before 1500ms have elapsed", async () => {
    const p = playCircleSequence(JOROPO_D_MAJOR_CIRCLE);
    await vi.advanceTimersByTimeAsync(0);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(4);

    await vi.advanceTimersByTimeAsync(1499);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(4);

    await vi.advanceTimersByTimeAsync(1);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(8);

    // Drain the remaining gap + third chord + trailing gap (the loop
    // is not special-cased) so `p` settles instead of leaking a
    // pending sequence into the next test.
    await vi.advanceTimersByTimeAsync(1500);
    await vi.advanceTimersByTimeAsync(1500);
    await p;
  });

  it("honors a custom chordDurationMs (e.g. 700ms)", async () => {
    const p = playCircleSequence(JOROPO_D_MAJOR_CIRCLE, {
      chordDurationMs: 700,
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(4);

    await vi.advanceTimersByTimeAsync(699);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(4);

    await vi.advanceTimersByTimeAsync(1);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(8);

    await vi.advanceTimersByTimeAsync(700);
    await vi.advanceTimersByTimeAsync(700);
    await p;
  });
});

describe("playCircleSequence — abort (REQ-PLAY-006)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stops before scheduling the next chord when aborted during the gap", async () => {
    const controller = new AbortController();
    const p = playCircleSequence(JOROPO_D_MAJOR_CIRCLE, {
      signal: controller.signal,
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(playMidiNoteMock).toHaveBeenCalledTimes(4);

    controller.abort();
    await vi.advanceTimersByTimeAsync(1500);
    await p;

    // La con séptima (the second chord) must never be scheduled.
    expect(playMidiNoteMock).toHaveBeenCalledTimes(4);
  });

  it("does not throw when aborted before the first chord", async () => {
    const controller = new AbortController();
    controller.abort();
    const p = playCircleSequence(JOROPO_D_MAJOR_CIRCLE, {
      signal: controller.signal,
    });
    await vi.advanceTimersByTimeAsync(0);
    await p;
    expect(playMidiNoteMock).not.toHaveBeenCalled();
  });
});

describe("playChordById (REQ-PLAY-007)", () => {
  it("plays the known chord's voicing MIDI numbers in string order", async () => {
    await playChordById("re-mayor");
    expect(playMidiNoteMock.mock.calls.map((c) => c[0])).toEqual([
      57, 62, 69, 78,
    ]);
  });

  it("uses targetIdPrefix `chord-${chordId}` by default", async () => {
    await playChordById("re-mayor");
    expect(
      publishMock.mock.calls.map(
        (c) => (c[0] as { targetId: string }).targetId,
      ),
    ).toEqual([
      "chord-re-mayor-0",
      "chord-re-mayor-1",
      "chord-re-mayor-2",
      "chord-re-mayor-3",
    ]);
  });

  it("surfaces the Spanish unknown-chord status and never calls playMidiNote", async () => {
    const onStatus = vi.fn();
    await playChordById("acorde-inexistente", { onStatus });
    expect(onStatus).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenCalledWith(
      "Acorde desconocido: acorde-inexistente",
    );
    expect(playMidiNoteMock).not.toHaveBeenCalled();
  });

  it("does not throw for an unknown id", async () => {
    await expect(playChordById("acorde-inexistente")).resolves.toBeUndefined();
  });
});

describe("play-chord — reuses playMidiNote, no reimplementation (REQ-PLAY-008/009)", () => {
  it("imports playMidiNote from ./play-midi-note and never imports Web Audio node constructors or sample libraries directly", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const source = await fs.readFile(
      path.resolve(__dirname, "./play-chord.ts"),
      "utf-8",
    );
    // Scoped to import lines only — the module's own prose docs
    // legitimately mention "AudioContext" and "ctx.resume()" while
    // explaining what playMidiNote already handles.
    const importBlock = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line))
      .join("\n");
    expect(importBlock).toMatch(/from ["']\.\/play-midi-note["']/);
    expect(importBlock).not.toMatch(
      /AudioContext|OscillatorNode|AudioBufferSourceNode/,
    );
    expect(importBlock).not.toMatch(
      /tone|howler|soundfont|samples|assets\/audio/i,
    );
  });
});

describe("playChord — first-gesture unlock is preserved (REQ-PLAY-008 scenario)", () => {
  it("awaits the real playMidiNote's ctx.resume() before any note is scheduled, when the shared context starts suspended", async () => {
    // Every other test in this file mocks ./play-midi-note so scheduling
    // is instant and controllable. That mock would also hide a broken
    // delegation — it cannot prove playChord actually routes through
    // playMidiNote's real ctx.resume() gate (REQ-PLAY-008). Escape the
    // file-level mock for this one test only: unmock + reset the module
    // registry, then re-import both modules fresh. Every other test's
    // static imports were already bound at file-load time and are
    // unaffected by this reset.
    vi.doUnmock("./play-midi-note");
    vi.resetModules();

    const { playChord: realPlayChord } = await import("./play-chord");
    const { getAudioContext, __resetAudioModuleForTests } = await import(
      "./play-midi-note"
    );
    __resetAudioModuleForTests();

    const ctx = getAudioContext()!;
    // @ts-expect-error — web-audio-test-api internal mutable state, same
    // technique play-midi-note.unit.ts uses to force "suspended".
    ctx._.state = "suspended";
    expect(ctx.state).toBe("suspended");

    let resolveResume: () => void = () => undefined;
    const resumePromise = new Promise<void>((resolve) => {
      resolveResume = resolve;
    });
    const originalResume = ctx.resume.bind(ctx);
    ctx.resume = () => resumePromise;

    const p = realPlayChord([57, 62, 69, 78]);

    // Yield to the microtask queue so playMidiNote's first call reaches
    // its `await ctx.resume()` line.
    await Promise.resolve();
    await Promise.resolve();

    // resume() has not resolved yet — no note may have been scheduled.
    expect(globalThis.__voices.length).toBe(0);

    resolveResume();
    await p;

    // All four notes were scheduled, and only after resume() resolved.
    expect(globalThis.__voices.length).toBe(4);

    ctx.resume = originalResume;
    __resetAudioModuleForTests();

    // Restore the file-level mock so the module registry stays
    // consistent for any test that runs after this one.
    vi.doMock("./play-midi-note", () => ({
      playMidiNote: vi.fn().mockResolvedValue(null),
      AUDIO_UNAVAILABLE_MESSAGE:
        "Audio no disponible. Toca una nota para intentarlo de nuevo.",
    }));
    vi.resetModules();
  });
});

describe("AUDIO_UNAVAILABLE_MESSAGE re-export (REQ-PLAY-010)", () => {
  it("matches the canonical Spanish string byte-for-byte", () => {
    expect(AUDIO_UNAVAILABLE_MESSAGE).toBe(
      "Audio no disponible. Toca una nota para intentarlo de nuevo.",
    );
  });
});
