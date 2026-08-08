/**
 * Play MIDI note — Karplus-Strong physical model + sympathetic resonance.
 *
 * Each note is rendered offline to an `AudioBuffer` using a Karplus-Strong
 * delay line, then played back through an `AudioBufferSourceNode`. The
 * Karplus-Strong algorithm produces a realistic plucked-string decay by
 * recirculating a noise seed through a one-pole lowpass in the feedback
 * loop — high harmonics die faster than the fundamental, exactly how a
 * real string loses brightness as its vibration decays.
 *
 * The played note ALSO feeds a parallel sympathetic resonance bus
 * (`sympathetic-bus.ts`) with 4 narrow bandpass filters tuned to the
 * open string frequencies (A3, D4, A4, E5). Each played note excites
 * the open strings sympathetically, producing the characteristic
 * "halo" of a real bandola.
 *
 * The lazy `AudioContext` is created on the first user gesture, resumed
 * if suspended, and reused across every note. The `VoiceManager` enforces
 * an 8-voice cap with FIFO eviction and exposes a debounce map so the
 * same fret button cannot trigger a duplicate voice within 40 ms.
 *
 * SSR safety: every entry point checks `typeof window !== "undefined"` so
 * `node` is never required during static generation.
 *
 * No audio asset, sample, or third-party renderer is used. The result is
 * a clearly labeled "sonido sintetizado (simulación)" — see spec R5.
 */
import { renderKarplusStrong } from "./karplus-strong";
import {
  createSympatheticBus,
  type SympatheticBus,
} from "./sympathetic-bus";

export type Midi = number;

export interface PlayOpts {
  /** Peak amplitude multiplier (0..1). Defaults to 0.7. */
  velocity?: number;
  /** Total note length in milliseconds. Defaults to 800. */
  durationMs?: number;
  /**
   * Stable identifier for the same target (e.g. `"A3-0"`). Used by the
   * 40 ms same-target debounce.
   */
  targetId?: string;
  /** Optional status callback (Spanish copy). */
  onStatus?: (message: string) => void;
}

export interface Voice {
  /** Monotonic id within the current VoiceManager. */
  id: number;
  /** `ctx.currentTime` when the note was scheduled. */
  startedAt: number;
  /** Force-stops the underlying buffer source. */
  stop: () => void;
}

/** Spanish status surfaced when audio is unavailable. */
export const AUDIO_UNAVAILABLE_MESSAGE =
  "Audio no disponible. Toca una nota para intentarlo de nuevo.";

const DEFAULT_VELOCITY = 0.7;
const DEBOUNCE_MS = 40;
const ATTACK_S = 0.005;
const RELEASE_S = 0.05;
/** Total buffer length per voice. Long enough to let the natural KS
 *  decay fade to inaudibility for a typical pluck. */
const KS_BUFFER_SEC = 2.5;
/** Karplus-Strong voice parameters tuned for metal strings. */
const KS_OPTIONS = {
  damping: 0.35,
  decay: 0.998,
  durationSec: KS_BUFFER_SEC,
};

/**
 * Pure MIDI-to-frequency mapping. MIDI 69 → A4 → 440 Hz; MIDI 57 → A3 → 220 Hz.
 */
export function midiToFrequency(midi: Midi): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

let sharedContext: AudioContext | null = null;
let sharedManager: VoiceManager | null = null;
let sharedSympathetic: SympatheticBus | null = null;
let lastTriggerAt: Map<string, number> = new Map();

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function hasAudioContext(): boolean {
  if (typeof window !== "undefined" && window.AudioContext) return true;
  const g = globalThis as { AudioContext?: typeof AudioContext };
  return g.AudioContext !== undefined;
}

function getAudioCtor(): typeof AudioContext | undefined {
  // Browser path.
  if (typeof window !== "undefined" && window.AudioContext) {
    return window.AudioContext;
  }
  // Test path — `web-audio-test-api` installs `AudioContext` directly
  // on the global so vitest can stub it without jsdom.
  const g = globalThis as { AudioContext?: typeof AudioContext };
  return g.AudioContext;
}

/**
 * Lazy AudioContext singleton. Returns `null` on the server.
 */
export function getAudioContext(): AudioContext | null {
  if (!hasWindow() && !hasAudioContext()) return null;
  if (sharedContext) return sharedContext;
  const Ctor = getAudioCtor();
  if (!Ctor) return null;
  sharedContext = new Ctor();
  // The sympathetic bus is created together with the AudioContext — both
  // are lazy and only allocate on the first call. 4 bandpass filters + 1
  // output gain is negligible memory.
  sharedSympathetic = createSympatheticBus(sharedContext);
  sharedManager = new VoiceManager(sharedContext, sharedSympathetic);
  return sharedContext;
}

/**
 * Returns the shared `VoiceManager` if the AudioContext is initialized.
 */
export function getVoiceManager(): VoiceManager | null {
  return sharedManager;
}

/**
 * Returns the shared sympathetic resonance bus, or `null` if the
 * AudioContext has not been initialized yet.
 */
export function getSympatheticBus(): SympatheticBus | null {
  return sharedSympathetic;
}

/**
 * VoiceManager — encapsulates polyphony and FIFO eviction.
 *
 * `MAX` is the static cap. `schedule` always returns a fresh voice; if
 * the cap is exceeded, the oldest voice is force-stopped first.
 */
export class VoiceManager {
  static readonly MAX = 8;
  private voices: Voice[] = [];
  private nextId = 0;
  /** Exposed for tests only. */
  context: AudioContext;
  /** Sympathetic resonance bus; may be `null` in early tests. */
  sympathetic: SympatheticBus | null;

  constructor(context: AudioContext, sympathetic: SympatheticBus | null) {
    this.context = context;
    this.sympathetic = sympathetic;
  }

  get activeCount(): number {
    return this.voices.length;
  }

  /** Ids of currently active voices, in chronological order. */
  get activeIds(): number[] {
    return this.voices.map((v) => v.id);
  }

  schedule(midi: Midi, opts: PlayOpts = {}): Voice | null {
    const velocity = clamp(opts.velocity ?? DEFAULT_VELOCITY, 0, 1);
    const freq = midiToFrequency(midi);
    const ctx = this.context;
    const t0 = ctx.currentTime;

    // Render the Karplus-Strong plucked-string buffer for this pitch.
    // Each note gets a freshly rendered buffer — the algorithm is cheap
    // enough (O(samples) ≈ 100k operations per note) that pre-rendering
    // is faster than running KS in real-time.
    const buffer = renderKarplusStrong(ctx, freq, KS_OPTIONS);

    // Outer amplitude envelope: short attack, hold at peak, short release
    // ramp at the end of the buffer to avoid clicks. The KS algorithm
    // already produces natural decay inside the buffer, so we don't need
    // a separate decay envelope — just clean up the boundaries.
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(velocity, t0 + ATTACK_S);
    amp.gain.setValueAtTime(velocity, t0 + KS_BUFFER_SEC - RELEASE_S);
    amp.gain.linearRampToValueAtTime(0, t0 + KS_BUFFER_SEC);
    amp.connect(ctx.destination);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(amp);
    source.start(t0);
    source.stop(t0 + KS_BUFFER_SEC);

    // Feed the played note into the sympathetic resonance bus. This is
    // what gives the bandola its characteristic "halo" of ringing open
    // strings under each note.
    if (this.sympathetic) {
      this.sympathetic.trigger(source, t0);
    }

    const voice: Voice = {
      id: this.nextId++,
      startedAt: t0,
      stop: () => {
        try {
          source.stop();
        } catch {
          // Already stopped — ignore.
        }
      },
    };

    this.voices.push(voice);
    if (this.voices.length > VoiceManager.MAX) {
      const oldest = this.voices.shift();
      oldest?.stop();
    }

    // Schedule cleanup after the buffer tail.
    const cleanupMs = KS_BUFFER_SEC * 1000 + 80;
    setTimeout(() => {
      const idx = this.voices.findIndex((v) => v.id === voice.id);
      if (idx >= 0) this.voices.splice(idx, 1);
    }, cleanupMs);

    return voice;
  }
}

/**
 * Top-level entry point used by the Qwik click handler.
 *
 * Async so the spec contract is honored: when the AudioContext is
 * suspended (cold auto-play blocked until first user gesture), we
 * `await ctx.resume()` before scheduling the note. The note is
 * therefore guaranteed to be scheduled AFTER the resume promise
 * resolves, not synchronously after a fire-and-forget resume call.
 *
 * Returns a `Voice` on success or `null` when audio is unavailable or
 * the resume() promise was rejected.
 */
export async function playMidiNote(
  midi: Midi,
  opts: PlayOpts = {},
): Promise<Voice | null> {
  if (!hasWindow() && !hasAudioContext()) {
    opts.onStatus?.(AUDIO_UNAVAILABLE_MESSAGE);
    if (globalThis.__audio) {
      globalThis.__audio.rejects = new Error(AUDIO_UNAVAILABLE_MESSAGE);
    }
    return null;
  }
  const ctx = getAudioContext();
  if (!ctx) {
    opts.onStatus?.(AUDIO_UNAVAILABLE_MESSAGE);
    if (globalThis.__audio) {
      globalThis.__audio.rejects = new Error(AUDIO_UNAVAILABLE_MESSAGE);
    }
    return null;
  }

  // Same-target debounce, scoped to the call site.
  if (opts.targetId) {
    const last = lastTriggerAt.get(opts.targetId) ?? 0;
    const now = Date.now();
    if (now - last < DEBOUNCE_MS) {
      return null;
    }
    lastTriggerAt.set(opts.targetId, now);
  }

  // First-gesture unlock. Await so the note schedules only after the
  // context is running. Rejected resume surfaces the Spanish status
  // and short-circuits without scheduling.
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch (err) {
      if (globalThis.__audio) {
        globalThis.__audio.rejects = err as Error;
      }
      opts.onStatus?.(AUDIO_UNAVAILABLE_MESSAGE);
      return null;
    }
  }

  // sharedManager is guaranteed non-null once getAudioContext() returned
  // a valid context, but TypeScript can't see through the closure.
  const manager = sharedManager;
  if (!manager) return null;
  const voice = manager.schedule(midi, opts);
  if (voice && globalThis.__voices) {
    globalThis.__voices.push(voice);
  }
  return voice;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Test-only helper. Resets the shared AudioContext, debounce map, and
 * any global registries so each test starts from a clean slate.
 */
export function __resetAudioModuleForTests(): void {
  sharedContext = null;
  sharedManager = null;
  sharedSympathetic = null;
  lastTriggerAt = new Map();
  globalThis.__voices = [];
  globalThis.__audio = { context: null, rejects: null };
}
