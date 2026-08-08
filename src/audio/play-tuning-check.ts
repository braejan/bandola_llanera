/**
 * playTuningCheck — A3 → D4 → A4 → E5 at 700ms via `playMidiNote`.
 *
 * Canonical bandola tuning (Re mayor / D major). The sequence
 * publishes each pluck to `anim-target` so the Diapason can flash
 * the matching open-string headstock cell. The `AbortSignal` lets
 * the caller cancel mid-sequence (the user just hit the button
 * again) without orphaning a partial tail.
 *
 * Cancellation: the signal is checked BEFORE each pluck and
 * listened for during the delay. A `setTimeout` is cleared so the
 * loop exits cleanly without scheduling more work.
 */
import { playMidiNote } from "./play-midi-note";
import { publish } from "./anim-target";

export interface PlayTuningCheckOpts {
  signal?: AbortSignal;
}

const TUNING: Array<{ midi: number; label: string }> = [
  { midi: 57, label: "A3" },
  { midi: 62, label: "D4" },
  { midi: 69, label: "A4" },
  { midi: 76, label: "E5" },
];

const TUNING_DELAY_MS = 700;

/**
 * Resolves after `ms` milliseconds OR rejects immediately if the
 * signal aborts. The timer is cleared on abort so the function
 * never leaks pending work.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("aborted"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Pluck the four canonical open strings in sequence. Concurrency:
 * single-sequence — a second call from the caller should abort the
 * first via the signal.
 */
export async function playTuningCheck(
  opts: PlayTuningCheckOpts = {},
): Promise<void> {
  const { signal } = opts;
  for (const { midi, label } of TUNING) {
    if (signal?.aborted) return;
    const targetId = `tuning-${label}`;
    publish({ midi, targetId });
    await playMidiNote(midi, { targetId });
    if (signal?.aborted) return;
    try {
      await sleep(TUNING_DELAY_MS, signal);
    } catch {
      // Aborted during the delay — exit cleanly.
      return;
    }
  }
}
