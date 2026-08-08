/**
 * Strict TDD — schedule, debounce, lifecycle, and the await-on-resume
 * contract for playMidiNote.
 *
 * Pure mapping tests live in `midi-to-frequency.unit.ts` (split for the
 * spec's "at least 8 unit files" target — WARNING-7).
 *
 * Tests:
 *   - playMidiNote returns null when window is undefined (SSR guard)
 *   - playMidiNote returns null when the AudioContext cannot be created
 *   - Two different pitches schedule two distinct voices
 *   - The 9→10th trigger evicts the oldest voice (8 remain)
 *   - Same-target debounce drops the second trigger within 40 ms
 *   - **resume() is awaited before schedule** (spec S3.5; WARNING-3)
 *   - Resumed context transitions to running
 *   - Rejected context returns null and surfaces the Spanish status
 *   - VoiceManager exposes MAX=8 as a static constant
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AUDIO_UNAVAILABLE_MESSAGE,
  VoiceManager,
  getAudioContext,
  playMidiNote,
  __resetAudioModuleForTests,
} from "./play-midi-note";

describe("playMidiNote — async + lifecycle", () => {
  beforeEach(() => {
    __resetAudioModuleForTests();
  });
  afterEach(() => {
    __resetAudioModuleForTests();
  });

  it("returns null when window is undefined (SSR guard)", async () => {
    const originalWindow = globalThis.window;
    const originalAudioContext = globalThis.AudioContext;
    // @ts-expect-error — testing SSR guard
    delete globalThis.window;
    // @ts-expect-error — full SSR: no AudioContext either
    delete globalThis.AudioContext;
    try {
      const voice = await playMidiNote(57);
      expect(voice).toBeNull();
    } finally {
      globalThis.window = originalWindow;
      globalThis.AudioContext = originalAudioContext;
    }
  });

  it("returns null when the AudioContext cannot be created", async () => {
    const original = globalThis.AudioContext;
    // @ts-expect-error — explicit failure mode
    globalThis.AudioContext = undefined;
    const voice = await playMidiNote(57);
    expect(voice).toBeNull();
    globalThis.AudioContext = original;
  });

  it("schedules a real Voice for each call", async () => {
    const v1 = await playMidiNote(57);
    const v2 = await playMidiNote(69);
    expect(v1).not.toBeNull();
    expect(v2).not.toBeNull();
    expect(v1!.id).not.toBe(v2!.id);
  });

  it("records every scheduled voice in the global registry", async () => {
    await playMidiNote(57);
    await playMidiNote(57);
    await playMidiNote(69);
    expect(globalThis.__voices.length).toBeGreaterThanOrEqual(3);
  });

  it("does not throw when the test-only globals are undefined (production runtime)", async () => {
    // Production never loads test-setup.ts, so __voices and __audio are
    // undefined. The audio module's writes to these globals must be
    // guarded so a real user click does not blow up with
    // "Cannot read properties of undefined (reading 'push')".
    const originalVoices = globalThis.__voices;
    const originalAudio = globalThis.__audio;
    // @ts-expect-error — production runtime has no test globals
    delete globalThis.__voices;
    // @ts-expect-error — production runtime has no test globals
    delete globalThis.__audio;
    try {
      const v1 = await playMidiNote(57);
      const v2 = await playMidiNote(69);
      expect(v1).not.toBeNull();
      expect(v2).not.toBeNull();
      // The same-target debounce would fire on the second 57; switch
      // to a fresh target to keep both voices scheduled.
      const v3 = await playMidiNote(57, { targetId: "A3-1" });
      expect(v3).not.toBeNull();
    } finally {
      globalThis.__voices = originalVoices;
      globalThis.__audio = originalAudio;
    }
  });

  it("does not throw when the test-only globals are undefined and the AudioContext is missing", async () => {
    // Production also takes the early-return path when AudioContext
    // is unavailable; the rejected branch writes to __audio.rejects
    // and must be guarded too.
    const originalVoices = globalThis.__voices;
    const originalAudio = globalThis.__audio;
    const originalAudioContext = globalThis.AudioContext;
    // @ts-expect-error — production runtime has no test globals
    delete globalThis.__voices;
    // @ts-expect-error — production runtime has no test globals
    delete globalThis.__audio;
    // @ts-expect-error — no AudioContext in the test environment
    globalThis.AudioContext = undefined;
    try {
      const voice = await playMidiNote(57, { onStatus: () => undefined });
      expect(voice).toBeNull();
    } finally {
      globalThis.__voices = originalVoices;
      globalThis.__audio = originalAudio;
      globalThis.AudioContext = originalAudioContext;
    }
  });

  it("renders a Karplus-Strong buffer for each played note", async () => {
    // The voice is no longer additive sine partials — it's a rendered
    // AudioBuffer. Verify the AudioBufferSourceNode is created with a
    // non-null buffer at the AudioContext's sample rate.
    const ctx = getAudioContext()!;
    const captured: Array<{
      sampleRate: number;
      length: number;
      hasData: boolean;
    }> = [];
    const original = ctx.createBufferSource.bind(ctx);
    ctx.createBufferSource = function () {
      const src = original();
      Object.defineProperty(src, "buffer", {
        configurable: true,
        get() {
          // web-audio-test-api exposes the buffer property differently
          // from the native AudioBufferSourceNode — we read whatever is
          // currently set when schedule() runs.
          return this._buffer ?? this._.buffer ?? null;
        },
        set(v: AudioBuffer | null) {
          if (v) {
            const data = v.getChannelData(0);
            let maxAbs = 0;
            for (let i = 0; i < data.length; i++) {
              const abs = Math.abs(data[i]);
              if (abs > maxAbs) maxAbs = abs;
            }
            captured.push({
              sampleRate: v.sampleRate,
              length: v.length,
              hasData: maxAbs > 0,
            });
          }
          this._buffer = v;
        },
      });
      return src;
    };
    await playMidiNote(57);
    expect(captured.length).toBeGreaterThanOrEqual(1);
    const b = captured[captured.length - 1];
    expect(b.sampleRate).toBe(ctx.sampleRate);
    expect(b.length).toBeGreaterThan(ctx.sampleRate); // > 1 second
    expect(b.hasData).toBe(true);
  });

  it("feeds each note into the sympathetic resonance bus", async () => {
    // After playMidiNote, the shared sympathetic bus must be initialized.
    const { getSympatheticBus } = await import("./play-midi-note");
    await playMidiNote(57);
    const bus = getSympatheticBus();
    expect(bus).not.toBeNull();
    expect(bus!.openFrequencies.length).toBe(4);
    // A3 = 220 Hz, D4 ≈ 293.66 Hz, A4 = 440 Hz, E5 ≈ 659.26 Hz
    expect(bus!.openFrequencies[0]).toBeCloseTo(220, 1);
    expect(bus!.openFrequencies[2]).toBe(440);
  });

  it("transitions a suspended context to running", async () => {
    const ctx = getAudioContext()!;
    // @ts-expect-error — web-audio-test-api internal mutable state
    ctx._.state = "suspended";
    expect(ctx.state).toBe("suspended");
    await playMidiNote(57);
    expect(ctx.state).toBe("running");
  });

  it("schedules a note only after resume() has resolved (spec S3.5)", async () => {
    // WARNING-3 regression: the OLD code did ctx.resume().catch(...) and
    // then scheduled the note synchronously. The new contract awaits
    // resume() — schedule may not happen until the promise resolves.
    const ctx = getAudioContext()!;
    // @ts-expect-error — web-audio-test-api internal mutable state
    ctx._.state = "suspended";

    let resolveResume: () => void = () => undefined;
    let resumePromise: Promise<void> = new Promise<void>((resolve) => {
      resolveResume = resolve;
    });
    const originalResume = ctx.resume.bind(ctx);
    ctx.resume = () => {
      // Promise intentionally not yet resolved.
      return resumePromise;
    };

    // Kick off playMidiNote. It must wait for resume() to resolve before
    // scheduling the note.
    const voicePromise = playMidiNote(57);

    // Yield to the microtask queue so the function reaches the await.
    await Promise.resolve();
    await Promise.resolve();

    // The promise has not yet resolved, so no voice may have been
    // scheduled. The global registry should still be empty.
    expect(globalThis.__voices.length).toBe(0);

    // Now resolve the resume.
    resolveResume();
    resumePromise = Promise.resolve();

    const voice = await voicePromise;
    expect(voice).not.toBeNull();
    expect(globalThis.__voices.length).toBe(1);

    // Restore the original resume so other tests are not affected.
    ctx.resume = originalResume;
  });

  it("surfaces the Spanish status when the context is missing", async () => {
    const original = globalThis.AudioContext;
    // @ts-expect-error — explicit failure mode
    globalThis.AudioContext = undefined;
    const voice = await playMidiNote(57, { onStatus: () => undefined });
    expect(voice).toBeNull();
    expect(globalThis.__audio.rejects).not.toBeNull();
    expect(globalThis.__audio.rejects?.message).toBe(AUDIO_UNAVAILABLE_MESSAGE);
    globalThis.AudioContext = original;
  });

  it("surfaces the Spanish status when resume() rejects", async () => {
    const ctx = getAudioContext()!;
    // @ts-expect-error — web-audio-test-api internal mutable state
    ctx._.state = "suspended";
    const originalResume = ctx.resume.bind(ctx);
    ctx.resume = () => Promise.reject(new Error("denied by user"));

    let status = "";
    const voice = await playMidiNote(57, {
      onStatus: (msg) => {
        status = msg;
      },
    });
    expect(voice).toBeNull();
    expect(status).toBe(AUDIO_UNAVAILABLE_MESSAGE);
    expect(globalThis.__audio.rejects?.message).toBe("denied by user");

    ctx.resume = originalResume;
  });
});

describe("VoiceManager — polyphony cap", () => {
  beforeEach(() => {
    __resetAudioModuleForTests();
  });
  afterEach(() => {
    __resetAudioModuleForTests();
  });

  it("exposes MAX=8 as a static constant", () => {
    expect(VoiceManager.MAX).toBe(8);
  });

  it("evicts the oldest voice when a 10th trigger fires", () => {
    const ctx = getAudioContext()!;
    const manager = new VoiceManager(ctx, null);
    const ids: number[] = [];
    for (let i = 0; i < 10; i++) {
      const voice = manager.schedule(57 + i);
      if (voice) ids.push(voice.id);
    }
    expect(manager.activeCount).toBe(8);
    expect(ids.length).toBe(10);
    expect(manager.activeIds).toEqual(ids.slice(2));
  });

  it("never grows above MAX active voices", () => {
    const ctx = getAudioContext()!;
    const manager = new VoiceManager(ctx, null);
    for (let i = 0; i < 30; i++) manager.schedule(60 + (i % 12));
    expect(manager.activeCount).toBe(8);
  });
});

describe("Same-target debounce", () => {
  beforeEach(() => {
    __resetAudioModuleForTests();
  });
  afterEach(() => {
    __resetAudioModuleForTests();
  });

  it("drops a second trigger fired within 40 ms on the same target", async () => {
    const v1 = await playMidiNote(57, { targetId: "A3-0" });
    const v2 = await playMidiNote(57, { targetId: "A3-0" });
    expect(v1).not.toBeNull();
    expect(v2).toBeNull();
  });

  it("admits a second trigger after the debounce map is reset", async () => {
    const v1 = await playMidiNote(57, { targetId: "A3-0" });
    expect(v1).not.toBeNull();
    __resetAudioModuleForTests();
    const v2 = await playMidiNote(57, { targetId: "A3-0" });
    expect(v2).not.toBeNull();
  });

  it("admits a different target even right after another", async () => {
    const v1 = await playMidiNote(57, { targetId: "A3-0" });
    const v2 = await playMidiNote(57, { targetId: "A4-0" });
    expect(v1).not.toBeNull();
    expect(v2).not.toBeNull();
  });
});
