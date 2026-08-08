/**
 * Play MIDI note — additive pluck synthesis over a single shared AudioContext.
 *
 * Pure mapping (`midiToFrequency`) is exported for direct unit testing.
 * The lazy `AudioContext` is created on the first user gesture, resumed if
 * suspended, and reused across every subsequent note. The `VoiceManager`
 * enforces an 8-voice cap with FIFO eviction and exposes a debounce map
 * so the same fret button cannot trigger a duplicate voice within 40 ms.
 *
 * SSR safety: every entry point checks `typeof window !== "undefined"` so
 * `node` is never required during static generation. The audio module is
 * therefore safe to import from any component.
 *
 * No audio asset, sample, or third-party renderer is used. The result is
 * a clearly labeled "sonido sintetizado (simulación)" — see spec R5.
 */

export type Midi = number;

export interface PlayOpts {
  /** Peak amplitude multiplier (0..1). Defaults to 0.9. */
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
  /** Force-stops the underlying envelope. */
  stop: () => void;
}

/** Spanish status surfaced when audio is unavailable. */
export const AUDIO_UNAVAILABLE_MESSAGE =
  "Audio no disponible. Toca una nota para intentarlo de nuevo.";

const DEFAULT_VELOCITY = 0.9;
const DEFAULT_DURATION_MS = 800;
const DEBOUNCE_MS = 40;
const ATTACK_S = 0.02;
const DECAY_S = 0.2;
const RELEASE_S = 0.4;
/** Lowpass cutoff at attack and tail. */
const FILTER_START_HZ = 2400;
const FILTER_END_HZ = 1200;
/** Additive partial mix. */
const PARTIALS: Array<{ mul: number; amp: number }> = [
  { mul: 1, amp: 0.6 },
  { mul: 2, amp: 0.24 },
  { mul: 3, amp: 0.12 },
];

/**
 * Pure MIDI-to-frequency mapping. MIDI 69 → A4 → 440 Hz; MIDI 57 → A3 → 220 Hz.
 */
export function midiToFrequency(midi: Midi): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

let sharedContext: AudioContext | null = null;
let sharedManager: VoiceManager | null = null;
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
  sharedManager = new VoiceManager(sharedContext);
  return sharedContext;
}

/**
 * Returns the shared `VoiceManager` if the AudioContext is initialized.
 */
export function getVoiceManager(): VoiceManager | null {
  return sharedManager;
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

  constructor(context: AudioContext) {
    this.context = context;
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
    const durationMs = opts.durationMs ?? DEFAULT_DURATION_MS;
    const freq = midiToFrequency(midi);
    const ctx = this.context;
    const t0 = ctx.currentTime;
    const total = ATTACK_S + DECAY_S + RELEASE_S + 0.18;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(velocity, t0 + ATTACK_S);
    amp.gain.exponentialRampToValueAtTime(0.001, t0 + ATTACK_S + DECAY_S + RELEASE_S);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(FILTER_START_HZ, t0);
    filter.frequency.exponentialRampToValueAtTime(
      FILTER_END_HZ,
      t0 + DECAY_S + RELEASE_S,
    );
    filter.connect(amp);
    amp.connect(ctx.destination);

    const partials: OscillatorNode[] = [];
    for (const p of PARTIALS) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = p.mul * freq;
      const partialGain = ctx.createGain();
      partialGain.gain.value = p.amp;
      osc.connect(partialGain);
      partialGain.connect(filter);
      partials.push(osc);
    }

    const voice: Voice = {
      id: this.nextId++,
      startedAt: t0,
      stop: () => {
        try {
          amp.gain.cancelScheduledValues(ctx.currentTime);
          amp.gain.setValueAtTime(amp.gain.value, ctx.currentTime);
          amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
        } catch {
          // The test API may not implement all ramp paths; ignore.
        }
      },
    };

    for (const osc of partials) {
      osc.start(t0);
      osc.stop(t0 + total);
    }

    this.voices.push(voice);
    if (this.voices.length > VoiceManager.MAX) {
      const oldest = this.voices.shift();
      oldest?.stop();
    }

    // Schedule cleanup after the note tail.
    const cleanupMs = durationMs + 80;
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

  const manager = sharedManager ?? new VoiceManager(ctx);
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
  lastTriggerAt = new Map();
  globalThis.__voices = [];
  globalThis.__audio = { context: null, rejects: null };
}
