/**
 * Strict TDD — RED phase for T3.
 *
 * Tests for the pure MIDI-to-frequency mapping. These are the simplest
 * layer of the audio module: no AudioContext, no async, no DOM.
 * Split out from play-midi-note.unit.ts so the spec's "at least 8 unit
 * files" target is met (WARNING-7).
 */
import { describe, expect, it } from "vitest";
import { midiToFrequency } from "./play-midi-note";

describe("midiToFrequency — pure mapping", () => {
  it("maps MIDI 69 (A4) to 440 Hz exactly", () => {
    expect(midiToFrequency(69)).toBe(440);
  });

  it("maps MIDI 57 (A3) to 220 Hz exactly", () => {
    expect(midiToFrequency(57)).toBe(220);
  });

  it("maps MIDI 76 (E5) to ~659.255 Hz", () => {
    const expected = 440 * 2 ** ((76 - 69) / 12);
    expect(midiToFrequency(76)).toBeCloseTo(expected, 6);
  });

  it("maps MIDI 62 (D4) to ~293.665 Hz", () => {
    const expected = 440 * 2 ** ((62 - 69) / 12);
    expect(midiToFrequency(62)).toBeCloseTo(expected, 6);
  });

  it("doubles frequency per octave", () => {
    expect(midiToFrequency(69 + 12)).toBeCloseTo(midiToFrequency(69) * 2, 6);
    expect(midiToFrequency(69 - 12)).toBeCloseTo(midiToFrequency(69) / 2, 6);
  });

  it("returns 0 for MIDI 0 (A-1 in MIDI 0..127 tuning)", () => {
    // 440 * 2^(-69/12) ≈ 8.18 Hz
    expect(midiToFrequency(0)).toBeCloseTo(8.175798, 5);
  });
});
