/**
 * usePlayableDiapason — Qwik QRL that wires a DOM event to the audio
 * module. The hook reads `data-midi`, `data-string`, and `data-fret`
 * from the event target and calls `playMidiNote(midi)`.
 *
 * The hook is stateless and serializable: it holds no closures over
 * mutable React-style state. It is safe to call from a Qwik click
 * handler (`onClick$={usePlayableDiapason()}`).
 *
 * The audio module owns the 40 ms same-target debounce and the 8-voice
 * polyphony cap, so the consumer does not need to track either.
 */
import { $, type QRL } from "@builder.io/qwik";
import { playMidiNote, type PlayOpts } from "../audio/play-midi-note";

export const usePlayableDiapason = (): QRL<(event: Event, el: HTMLElement) => void> => {
  return $((event: Event, el: HTMLElement) => {
    const midi = Number(el.dataset.midi);
    if (!Number.isFinite(midi)) return;
    const targetId = `${el.dataset.string ?? ""}-${el.dataset.fret ?? ""}`;
    const opts: PlayOpts = targetId ? { targetId } : {};
    playMidiNote(midi, opts);
  });
};
