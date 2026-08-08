/**
 * Audio status context — a Qwik signal that the audio module writes to
 * via the `onStatus` callback and the ScaleSwitcher reads to render the
 * `<p role="status">` Spanish message (WARNING-4).
 *
 * The Diapason owns the click handler that calls `playMidiNote`. The
 * ScaleSwitcher owns the visible status node. They share state through
 * this context so a rejected AudioContext can surface to the user.
 *
 * The Diapason READS the signal to set it; the ScaleSwitcher READS the
 * same signal to render it. The signal is owned by the ScaleSwitcher
 * (the DOM owner of the visible status node) and provided via Qwik
 * context for the Diapason to consume.
 */
import { createContextId, type Signal } from "@builder.io/qwik";

export const AudioStatusContext = createContextId<Signal<string>>(
  "bandola.audio-status",
);
