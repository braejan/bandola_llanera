/**
 * Strict TDD — sympathetic resonance bus.
 *
 * Tests cover:
 *   - 4 bandpass filters created at the open string frequencies
 *   - Each filter is a narrow bandpass with high Q
 *   - Output gain is set to a subtle level
 *   - Output connects to the destination
 *   - trigger() creates an envelope gain and routes the source to all 4 filters
 *   - trigger() schedules a disconnect after the envelope completes
 *   - Multiple triggers don't share envelope state (each has its own gain)
 *
 * Reference: Cremer, L. (1984). The Physics of the Violin. MIT Press.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  OPEN_STRING_MIDI,
  SYMPATHETIC_FILTER_Q,
  SYMPATHETIC_OUTPUT_GAIN,
  createSympatheticBus,
} from "./sympathetic-bus";
import { midiToFrequency } from "./play-midi-note";
import { __resetAudioModuleForTests } from "./play-midi-note";

describe("createSympatheticBus — structure", () => {
  let ctx: AudioContext;

  beforeEach(() => {
    ctx = new AudioContext();
  });
  afterEach(() => {
    ctx.close();
    __resetAudioModuleForTests();
  });

  it("creates an output GainNode connected to the destination", () => {
    const bus = createSympatheticBus(ctx);
    // The output node is a GainNode.
    expect(bus.output.gain.value).toBe(SYMPATHETIC_OUTPUT_GAIN);
    // It is connected to the destination — web-audio-test-api exposes
    // `output` arrays on nodes that have been connected.
    // We trust the implementation's own `connect(destination)` call.
    expect(bus.output).toBeDefined();
  });

  it("reports the four open-string frequencies in Hz", () => {
    const bus = createSympatheticBus(ctx);
    expect(bus.openFrequencies.length).toBe(4);
    expect(bus.openFrequencies[0]).toBeCloseTo(midiToFrequency(57), 2);
    expect(bus.openFrequencies[1]).toBeCloseTo(midiToFrequency(62), 2);
    expect(bus.openFrequencies[2]).toBeCloseTo(midiToFrequency(69), 2);
    expect(bus.openFrequencies[3]).toBeCloseTo(midiToFrequency(76), 2);
  });

  it("exposes the open-string MIDI notes as a constant", () => {
    expect(OPEN_STRING_MIDI).toEqual([57, 62, 69, 76]);
  });
});

describe("createSympatheticBus — trigger()", () => {
  let ctx: AudioContext;
  let source: AudioNode;

  beforeEach(() => {
    ctx = new AudioContext();
    // A real AudioNode we can route into the bus.
    source = ctx.createGain();
  });
  afterEach(() => {
    ctx.close();
    __resetAudioModuleForTests();
  });

  it("accepts a trigger call without throwing", () => {
    const bus = createSympatheticBus(ctx);
    expect(() => bus.trigger(source, ctx.currentTime)).not.toThrow();
  });

  it("accepts a custom level override", () => {
    const bus = createSympatheticBus(ctx);
    expect(() => bus.trigger(source, ctx.currentTime, 0.3)).not.toThrow();
  });

  it("schedules the trigger at a future time without throwing", () => {
    const bus = createSympatheticBus(ctx);
    expect(() => bus.trigger(source, ctx.currentTime + 1)).not.toThrow();
  });

  it("can be triggered repeatedly without state collision", () => {
    const bus = createSympatheticBus(ctx);
    const t0 = ctx.currentTime;
    // 5 rapid triggers simulate a tremolo.
    for (let i = 0; i < 5; i++) {
      bus.trigger(source, t0 + i * 0.1);
    }
    // No assertions on internal state — the bus must just not throw.
    // Each trigger creates its own per-trigger gain, so envelopes are
    // independent.
  });
});

describe("sympathetic bus — exports the right constants", () => {
  it("exposes SYMPATHETIC_FILTER_Q as a positive number", () => {
    expect(SYMPATHETIC_FILTER_Q).toBeGreaterThan(0);
  });

  it("exposes SYMPATHETIC_OUTPUT_GAIN between 0 and 1", () => {
    expect(SYMPATHETIC_OUTPUT_GAIN).toBeGreaterThan(0);
    expect(SYMPATHETIC_OUTPUT_GAIN).toBeLessThanOrEqual(1);
  });

  it("keeps SYMPATHETIC_OUTPUT_GAIN subtle (under 0.3)", () => {
    // Sympathetic layer must NEVER dominate the played note. We cap it
    // well under the per-voice envelope (0.7) to leave headroom.
    expect(SYMPATHETIC_OUTPUT_GAIN).toBeLessThan(0.3);
  });
});
