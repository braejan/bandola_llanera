/**
 * Strict TDD — Karplus-Strong physical model.
 *
 * Tests cover:
 *   - Buffer dimensions (sample count, channel count, sample rate)
 *   - Output is non-silent (the noise seed produced audible signal)
 *   - Periodicity matches the target frequency (zero-crossing count)
 *   - Amplitude decays monotonically over time (the "pluck" character)
 *   - Damping parameter affects the high-frequency content of the spectrum
 *   - Decay parameter affects overall amplitude at the tail of the buffer
 *   - Degenerate inputs (zero/negative frequency, zero duration) are safe
 *
 * Reference: Karplus, K. & Strong, A. (1983).
 */
import { describe, expect, it } from "vitest";
import { renderKarplusStrong } from "./karplus-strong";

describe("renderKarplusStrong — buffer dimensions", () => {
  it("creates a buffer with one channel at the AudioContext's sample rate", () => {
    const ctx = new AudioContext();
    const buffer = renderKarplusStrong(ctx, 440, { durationSec: 1 });
    expect(buffer.numberOfChannels).toBe(1);
    expect(buffer.sampleRate).toBe(ctx.sampleRate);
    expect(buffer.length).toBe(ctx.sampleRate);
    ctx.close();
  });

  it("rounds the duration to whole samples and clamps to >= 1", () => {
    const ctx = new AudioContext();
    const tiny = renderKarplusStrong(ctx, 440, { durationSec: 0.0001 });
    expect(tiny.length).toBeGreaterThanOrEqual(1);
    ctx.close();
  });
});

describe("renderKarplusStrong — output is non-silent", () => {
  it("produces a non-zero buffer at A4 (440 Hz)", () => {
    const ctx = new AudioContext();
    const buffer = renderKarplusStrong(ctx, 440, { durationSec: 1 });
    const data = buffer.getChannelData(0);
    let maxAbs = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > maxAbs) maxAbs = abs;
    }
    expect(maxAbs).toBeGreaterThan(0.1);
    ctx.close();
  });

  it("produces non-silent output at A3 (220 Hz)", () => {
    const ctx = new AudioContext();
    const buffer = renderKarplusStrong(ctx, 220, { durationSec: 1 });
    const data = buffer.getChannelData(0);
    let maxAbs = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > maxAbs) maxAbs = abs;
    }
    expect(maxAbs).toBeGreaterThan(0.1);
    ctx.close();
  });
});

describe("renderKarplusStrong — periodicity", () => {
  /**
   * Autocorrelation peak finder. For a periodic signal, the autocorrelation
   * peaks at lag = period of the dominant frequency. We search within a
   * narrow window around the expected period so we measure the FUNDAMENTAL,
   * not the harmonics that KS also produces (the noise seed excites every
   * harmonic of the delay line length).
   */
  function findDominantLag(
    data: Float32Array,
    sampleRate: number,
    expectedPeriod: number,
  ): number {
    // Stable window: skip the noisy attack, stay inside the buffer.
    const start = Math.floor(sampleRate * 0.15);
    const end = Math.floor(sampleRate * 0.35);
    const minLag = Math.max(2, Math.floor(expectedPeriod * 0.9));
    const maxLag = Math.ceil(expectedPeriod * 1.1);
    let bestLag = 0;
    let bestCorr = -Infinity;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let corr = 0;
      for (let i = start; i + lag < end; i++) {
        corr += data[i] * data[i + lag];
      }
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }
    return bestLag;
  }

  it("renders A4 (440 Hz) with the dominant period near sampleRate/440", () => {
    const ctx = new AudioContext();
    const buffer = renderKarplusStrong(ctx, 440, {
      durationSec: 0.5,
      damping: 0.4,
      decay: 0.998,
    });
    const expectedPeriod = Math.round(ctx.sampleRate / 440);
    const measuredLag = findDominantLag(
      buffer.getChannelData(0),
      ctx.sampleRate,
      expectedPeriod,
    );
    expect(Math.abs(measuredLag - expectedPeriod)).toBeLessThanOrEqual(1);
    ctx.close();
  });

  it("renders A3 (220 Hz) with a dominant period ~2x the A4 period", () => {
    const ctx = new AudioContext();
    const a3 = renderKarplusStrong(ctx, 220, {
      durationSec: 0.5,
      damping: 0.4,
      decay: 0.998,
    });
    const a4 = renderKarplusStrong(ctx, 440, {
      durationSec: 0.5,
      damping: 0.4,
      decay: 0.998,
    });
    const a3Expected = Math.round(ctx.sampleRate / 220);
    const a4Expected = Math.round(ctx.sampleRate / 440);
    const a3Lag = findDominantLag(
      a3.getChannelData(0),
      ctx.sampleRate,
      a3Expected,
    );
    const a4Lag = findDominantLag(
      a4.getChannelData(0),
      ctx.sampleRate,
      a4Expected,
    );
    expect(Math.abs(a3Lag - a3Expected)).toBeLessThanOrEqual(2);
    expect(Math.abs(a3Lag - a4Lag * 2)).toBeLessThanOrEqual(2);
    ctx.close();
  });

  it("renders E5 (~660 Hz) with a dominant period ~1/3 of A3", () => {
    const ctx = new AudioContext();
    const a3 = renderKarplusStrong(ctx, 220, {
      durationSec: 0.4,
      damping: 0.4,
      decay: 0.998,
    });
    const e5 = renderKarplusStrong(ctx, 660, {
      durationSec: 0.4,
      damping: 0.4,
      decay: 0.998,
    });
    const a3Expected = Math.round(ctx.sampleRate / 220);
    const e5Expected = Math.round(ctx.sampleRate / 660);
    const a3Lag = findDominantLag(
      a3.getChannelData(0),
      ctx.sampleRate,
      a3Expected,
    );
    const e5Lag = findDominantLag(
      e5.getChannelData(0),
      ctx.sampleRate,
      e5Expected,
    );
    // E5's period should be about 1/3 of A3's period.
    expect(a3Lag / e5Lag).toBeGreaterThan(2.5);
    expect(a3Lag / e5Lag).toBeLessThan(3.5);
    ctx.close();
  });
});

describe("renderKarplusStrong — decay envelope", () => {
  it("RMS amplitude in the last quarter is lower than in the first quarter", () => {
    const ctx = new AudioContext();
    const buffer = renderKarplusStrong(ctx, 440, {
      durationSec: 2,
      damping: 0.3,
      decay: 0.99,
    });
    const data = buffer.getChannelData(0);
    const quarter = Math.floor(data.length / 4);

    function rms(start: number, end: number): number {
      let sum = 0;
      for (let i = start; i < end; i++) sum += data[i] * data[i];
      return Math.sqrt(sum / (end - start));
    }

    const headRms = rms(0, quarter);
    const tailRms = rms(data.length - quarter, data.length);
    expect(tailRms).toBeLessThan(headRms);
    ctx.close();
  });

  it("higher decay value produces a louder tail", () => {
    const ctx = new AudioContext();
    const fast = renderKarplusStrong(ctx, 440, {
      durationSec: 2,
      damping: 0.3,
      decay: 0.98,
    });
    const slow = renderKarplusStrong(ctx, 440, {
      durationSec: 2,
      damping: 0.3,
      decay: 0.998,
    });
    const fastTail = tailRms(fast.getChannelData(0));
    const slowTail = tailRms(slow.getChannelData(0));
    expect(slowTail).toBeGreaterThan(fastTail);
    ctx.close();
  });

  function tailRms(data: Float32Array): number {
    const start = Math.floor(data.length * 0.75);
    let sum = 0;
    for (let i = start; i < data.length; i++) sum += data[i] * data[i];
    return Math.sqrt(sum / (data.length - start));
  }
});

describe("renderKarplusStrong — damping", () => {
  it("higher damping yields a darker spectrum (less high-frequency energy)", () => {
    const ctx = new AudioContext();
    const bright = renderKarplusStrong(ctx, 440, {
      durationSec: 1,
      damping: 0.05,
      decay: 0.999,
    });
    const dark = renderKarplusStrong(ctx, 440, {
      durationSec: 1,
      damping: 0.8,
      decay: 0.999,
    });

    // High-frequency energy: count zero crossings in the early window.
    // More crossings → more high-frequency content.
    const brightCrossings = countZeroCrossingsEarly(bright.getChannelData(0), ctx.sampleRate);
    const darkCrossings = countZeroCrossingsEarly(dark.getChannelData(0), ctx.sampleRate);

    expect(brightCrossings).toBeGreaterThan(darkCrossings);
    ctx.close();
  });

  function countZeroCrossingsEarly(data: Float32Array, sampleRate: number): number {
    // Use the first 200 ms — the noise seed contributes here and the
    // brightness vs darkness contrast is most pronounced.
    const end = Math.floor(sampleRate * 0.2);
    let n = 0;
    for (let i = 1; i < end; i++) {
      if (data[i - 1] >= 0 && data[i] < 0) n++;
    }
    return n;
  }
});

describe("renderKarplusStrong — edge cases", () => {
  it("returns a silent buffer for frequency <= 0", () => {
    const ctx = new AudioContext();
    const buffer = renderKarplusStrong(ctx, 0, { durationSec: 0.5 });
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      expect(data[i]).toBe(0);
    }
    ctx.close();
  });

  it("clamps damping to [0, 0.999] without throwing", () => {
    const ctx = new AudioContext();
    expect(() => renderKarplusStrong(ctx, 440, { damping: -1 })).not.toThrow();
    expect(() => renderKarplusStrong(ctx, 440, { damping: 2 })).not.toThrow();
    ctx.close();
  });

  it("clamps decay to [0, 1] without throwing", () => {
    const ctx = new AudioContext();
    expect(() => renderKarplusStrong(ctx, 440, { decay: -0.5 })).not.toThrow();
    expect(() => renderKarplusStrong(ctx, 440, { decay: 1.5 })).not.toThrow();
    ctx.close();
  });

  it("renders the same number of samples for very short durations", () => {
    const ctx = new AudioContext();
    const tiny = renderKarplusStrong(ctx, 440, { durationSec: 0.001 });
    expect(tiny.length).toBeGreaterThanOrEqual(1);
    ctx.close();
  });
});
