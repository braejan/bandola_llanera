/**
 * Karplus-Strong physical model for plucked strings.
 *
 * The algorithm reproduces how a real string vibrates after being struck:
 *
 *   1. Build a circular delay line of length `sampleRate / frequency`.
 *      That delay length IS one period of the target pitch — it's the
 *      physical round-trip time for a wave to travel to the nut, reflect,
 *      and come back to the bridge.
 *
 *   2. Seed the delay line with a burst of white noise. This models the
 *      random initial displacement a finger or plectrum imparts when it
 *      strikes the string.
 *
 *   3. For each output sample, read the head of the delay line, push it
 *      through a one-pole lowpass (the "damping" knob), multiply by a
 *      decay factor (the "sustain" knob), and write the result back to
 *      the tail.
 *
 * The lowpass in the feedback loop is what gives KS its characteristic
 * decaying tone: high frequencies circulate less efficiently through the
 * filter than low frequencies, so the upper harmonics die first. This
 * mirrors how a real string loses brightness as its vibration decays.
 *
 * Reference: Karplus, K. & Strong, A. (1983). "Digital Synthesis of
 * Plucked-String and Drum Timbres". Computer Music Journal 7(2): 43-55.
 *
 * The voice is rendered offline to an `AudioBuffer` once per note, then
 * played back via `AudioBufferSourceNode`. The buffer is a one-shot
 * recording of the entire natural decay — no per-sample scheduling is
 * needed during playback, which keeps the audio graph simple.
 */

export interface KarplusStrongOptions {
  /**
   * One-pole lowpass coefficient in the feedback loop.
   * `0` = no lowpass (bright, buzzy, almost square-wave), `1` = fully
   * lowpassed (dark, near-DC after the first cycle).
   * Metal strings (bandola llanera uses metal) sit around `0.3-0.45`.
   * Nylon strings (classical guitar) sit around `0.45-0.6`.
   */
  damping?: number;
  /**
   * Per-sample amplitude multiplier applied to the feedback signal.
   * `1.0` = infinite sustain, `0.99` = audible decay, `0.9` = plucky.
   * Real plucked strings decay in the `0.997-0.999` range.
   */
  decay?: number;
  /**
   * Length of the rendered buffer in seconds. Longer buffers capture
   * more of the natural decay tail. The default of 2.5 s is enough for
   * a typical bandola pluck to fade to inaudibility.
   */
  durationSec?: number;
  /**
   * Peak amplitude of the noise burst used to seed the delay line.
   * `1.0` = full scale, `0.5` = half. The output is additionally scaled
   * by `0.5` internally for headroom.
   */
  seedAmplitude?: number;
}

/**
 * Render a Karplus-Strong plucked-string voice to an `AudioBuffer`.
 *
 * Pure function: given the same `frequency`, `options`, and `ctx.sampleRate`,
 * it produces the same buffer. The only source of randomness is the seed,
 * which is acceptable for this use case (the listener doesn't perceive
 * the seed differences as distinct events).
 */
export function renderKarplusStrong(
  ctx: BaseAudioContext,
  frequency: number,
  options: KarplusStrongOptions = {},
): AudioBuffer {
  const damping = clamp(options.damping ?? 0.35, 0, 0.999);
  const decay = clamp(options.decay ?? 0.998, 0, 1);
  const durationSec = options.durationSec ?? 2.5;
  const seedAmplitude = clamp(options.seedAmplitude ?? 1.0, 0, 1);

  const sampleRate = ctx.sampleRate;
  const numSamples = Math.max(1, Math.floor(sampleRate * durationSec));

  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  if (frequency <= 0) {
    // Degenerate: silent buffer. Web Audio cannot create buffers below 1 sample.
    return buffer;
  }

  // Delay line length = sampleRate / frequency, rounded to integer samples.
  // For a 440 Hz tone at 44.1 kHz: 44100 / 440 ≈ 100.23 → 100 samples.
  const delayLength = Math.max(2, Math.round(sampleRate / frequency));

  // Seed the delay line with a white-noise burst (the pluck).
  const delayLine = new Float32Array(delayLength);
  for (let i = 0; i < delayLength; i++) {
    delayLine[i] = (Math.random() * 2 - 1) * seedAmplitude;
  }

  // One-pole lowpass: y[n] = damping * y[n-1] + (1 - damping) * x[n]
  // We track the previous output explicitly so we can apply the filter
  // to the feedback sample before it goes back into the delay line.
  let prev = 0;

  // Circular-buffer write head. We read from and write to the same index
  // each iteration, advancing by one sample.
  let writeIdx = 0;

  for (let i = 0; i < numSamples; i++) {
    const output = delayLine[writeIdx];

    // Apply the one-pole lowpass to the sample that just came out of the
    // delay line, then multiply by the decay factor before sending it
    // back in. This is the entire "physical model" of the string.
    const filtered = damping * prev + (1 - damping) * output;
    prev = filtered;
    delayLine[writeIdx] = filtered * decay;

    // Advance the write head. Modulo is fine here because delayLength
    // is small (100-200 for typical pitches) and JS engines optimize it.
    writeIdx = writeIdx + 1;
    if (writeIdx >= delayLength) writeIdx = 0;

    // Output gain of 0.5 leaves headroom for downstream envelope shaping
    // and prevents clipping when many partials sum together.
    data[i] = output * 0.5;
  }

  return buffer;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
