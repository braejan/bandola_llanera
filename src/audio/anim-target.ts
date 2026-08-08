/**
 * anim-target — DOM-free pub/sub for visual feedback.
 *
 * Audio sequences (T-3 `playTuningCheck`, T-4 `playScaleSequence`)
 * publish `(midi, targetId)` events for every pluck. The Diapason
 * subscribes once on mount and uses the `targetId` to flash the
 * matching fret cell.
 *
 * The module is intentionally dependency-free: no DOM, no Qwik, no
 * Web Audio. It works identically on the server and the client, so
 * `useTask$` can subscribe and unsubscribe without an `isServer`
 * guard.
 *
 * Exception isolation: a listener that throws is logged to
 * `console.error` and does NOT stop sibling listeners. The audio
 * module is fire-and-forget — a broken subscriber must not break
 * the audio pipeline.
 *
 * Unsubscribe is idempotent: calling the same unsubscribe twice is
 * a no-op. This matches the Qwik `cleanup(off)` pattern where the
 * same callback may be invoked multiple times.
 */
export interface AnimEvent {
  /** MIDI pitch class of the played note. */
  midi: number;
  /** Stable identifier for the visual target (e.g. `"tuning-A3"`). */
  targetId: string;
}

export type AnimListener = (event: AnimEvent) => void;

const listeners = new Set<AnimListener>();

/**
 * Subscribe to every published event. Returns an unsubscribe function.
 */
export function subscribe(listener: AnimListener): () => void {
  listeners.add(listener);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    listeners.delete(listener);
  };
}

/**
 * Publish an event to every active listener. Exceptions thrown by
 * listeners are caught, logged to `console.error`, and do not stop
 * sibling listeners.
 */
export function publish(event: AnimEvent): void {
  // Snapshot the set so a listener that subscribes/unsubscribes
  // during dispatch does not mutate the iteration cursor.
  const snapshot = Array.from(listeners);
  for (const listener of snapshot) {
    try {
      listener(event);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("anim-target listener threw", err);
    }
  }
}

/**
 * Test-only helper. Drops every active listener. The audio module
 * test suite calls this in `beforeEach` to avoid subscriber
 * accumulation across tests.
 */
export function __resetAnimTargetForTests(): void {
  listeners.clear();
}
