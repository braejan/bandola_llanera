/**
 * Vitest setup — installs the Web Audio test API on the global so
 * `AudioContext`, `OscillatorNode`, `GainNode`, `BiquadFilterNode` and
 * every other node class are real, observable objects in tests.
 *
 * `web-audio-test-api` auto-installs on import (its `lib/index.js`
 * invokes `.use()` the moment the module is loaded). We only need to
 * flip the configuration bits the API keeps behind feature flags.
 *
 * The setup also exposes a `__voices` accumulator on `globalThis` so the
 * audio module can register every voice it schedules and tests can
 * assert on polyphony / eviction without deep-importing internals.
 */
import WebAudioTestAPI from "web-audio-test-api";

declare global {
  var __voices: Array<{ id: number; startedAt: number; stop: () => void }>;
  var __audio: { context: AudioContext | null; rejects: Error | null };
}

// Enable live state transitions so tests can observe `ctx.state` going
// from "suspended" to "running" during a `resume()` call.
(WebAudioTestAPI as { setState: (k: string, v: string) => void }).setState(
  "AudioContext#suspend",
  "enabled",
);
(WebAudioTestAPI as { setState: (k: string, v: string) => void }).setState(
  "AudioContext#resume",
  "enabled",
);
(WebAudioTestAPI as { setState: (k: string, v: string) => void }).setState(
  "AudioContext#close",
  "enabled",
);

globalThis.__voices = [];
globalThis.__audio = {
  context: null,
  rejects: null,
};

