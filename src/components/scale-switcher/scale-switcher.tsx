import {
  component$,
  useContextProvider,
  useSignal,
  useStylesScoped$,
  noSerialize,
  type NoSerialize,
  $,
} from "@builder.io/qwik";
import { Diapason } from "../diapason/diapason";
import { ScaleReference } from "../scale-reference/scale-reference";
import { AudioStatusContext } from "../../audio/audio-status-context";
import { playTuningCheck } from "../../audio/play-tuning-check";
import { playScaleSequence } from "../../audio/play-scale-sequence";
import {
  ALL_KEYS_LIST,
  ALL_MODES_LIST,
  DEFAULT_SCALE_ID,
  getKeyLabel,
  getModeLabel,
  getScaleById,
  type Key,
  type Mode,
  type ScaleId,
} from "../../music/scales";

interface KeyDef {
  id: Key;
  label: string;
}

const KEYS: KeyDef[] = ALL_KEYS_LIST.map((id) => ({ id, label: getKeyLabel(id) }));

interface ModeDef {
  id: Mode;
  label: string;
}

const MODES: ModeDef[] = ALL_MODES_LIST.map((id) => ({ id, label: getModeLabel(id) }));

/**
 * ScaleSwitcher — owns the current scale (key + mode) and passes it to
 * the Diapason. Includes the audio-status context for the rejected
 * AudioContext Spanish message.
 *
 * Visual order is the key+mode header above the Diapason, then a paper
 * controls frame that hosts the visible "sonido sintetizado (simulación)"
 * label and a Spanish status node for the audio module. The legacy
 * placeholder audio toggle and `<audio data-placeholder="true">` element
 * are removed — the per-note buttons in the Diapason replace them.
 *
 * The key words (Do, Re, Mi, Fa, Sol, La, Si) and mode words (Mayor,
 * Menor, Armónica) are wood-type. The active word is rendered in the
 * dominant ground color (terracotta). Inactive are ink. A faint ink
 * rule reveals on hover/focus.
 */
export const ScaleSwitcher = component$(() => {
  useStylesScoped$(STYLES);

  const scaleId = useSignal<ScaleId>(DEFAULT_SCALE_ID);
  const audioStatus = useSignal<string>("");

  // Provide the audio-status signal so the Diapason (which owns the
  // click handler that calls playMidiNote) can write the rejected
  // status into it. The visible <p role="status"> below reads the
  // same signal (WARNING-4).
  useContextProvider(AudioStatusContext, audioStatus);

  const setKey = $((key: Key) => {
    const current = getScaleById(scaleId.value);
    scaleId.value = `${key}-${current.mode}` as ScaleId;
  });

  const setMode = $((mode: Mode) => {
    const current = getScaleById(scaleId.value);
    scaleId.value = `${current.key}-${mode}` as ScaleId;
  });

  // Verificar afinación / Tocar escala: each sequence owns its own
  // AbortController so a re-click cancels the prior run mid-flight
  // instead of overlapping it. Both buttons disable while EITHER
  // sequence plays (REQ-tuning-check buttons, REQ-auto-scale buttons).
  // AbortController instances are not serializable, so the signal
  // must hold a `noSerialize()`-wrapped value — Qwik throws at
  // runtime otherwise (a plain `useSignal<AbortController | null>()`
  // fails the moment the signal is written).
  const tuningAbort = useSignal<NoSerialize<AbortController>>(undefined);
  const scaleAbort = useSignal<NoSerialize<AbortController>>(undefined);
  const isPlayingTuning = useSignal(false);
  const isPlayingScale = useSignal(false);

  const onTuningClick$ = $(async () => {
    tuningAbort.value?.abort();
    const controller = new AbortController();
    tuningAbort.value = noSerialize(controller);
    isPlayingTuning.value = true;
    try {
      await playTuningCheck({ signal: controller.signal });
    } finally {
      // Only the run that is still "current" clears the flag — an
      // aborted prior run's finally must not clobber a newer run's
      // in-flight state.
      if (tuningAbort.value === controller) {
        isPlayingTuning.value = false;
      }
    }
  });

  const onScaleClick$ = $(async () => {
    scaleAbort.value?.abort();
    const controller = new AbortController();
    scaleAbort.value = noSerialize(controller);
    isPlayingScale.value = true;
    try {
      // Read fresh so a key/mode change made just before the click is
      // honored, not a stale value captured at render time.
      const scale = getScaleById(scaleId.value);
      await playScaleSequence(scale, { signal: controller.signal });
    } finally {
      if (scaleAbort.value === controller) {
        isPlayingScale.value = false;
      }
    }
  });

  const currentScale = getScaleById(scaleId.value);

  return (
    <section
      id="diapason"
      class="scale-switcher"
      aria-label="Selector de tónica, modo y estado de audio"
    >
      <div class="controls-frame">
        <div class="controls">
          <div
            class="key-selector"
            role="radiogroup"
            aria-label="Tónica"
          >
            {KEYS.map((k) => {
              const active = currentScale.key === k.id;
              return (
                <button
                  key={k.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  class={["key", active ? "key--active" : ""].join(" ")}
                  data-key={k.id}
                  onClick$={() => setKey(k.id)}
                >
                  <span class="key-label">{k.label}</span>
                </button>
              );
            })}
          </div>

          <div
            class="modes"
            role="radiogroup"
            aria-label="Modo"
          >
            {MODES.map((m) => {
              const active = currentScale.mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-pressed={active}
                  class={["mode", active ? "mode--active" : ""].join(" ")}
                  data-mode={m.id}
                  onClick$={() => setMode(m.id)}
                >
                  <span class="mode-label">{m.label}</span>
                </button>
              );
            })}
          </div>

          <p class="synthesis-label" aria-label="Sonido sintetizado">
            sonido sintetizado (simulación)
          </p>

          <p class="current-scale" aria-label="Escala actual">
            Escala actual: {currentScale.label}
          </p>

          <div class="sequence-controls">
            <button
              type="button"
              class="btn-tuning"
              disabled={isPlayingTuning.value || isPlayingScale.value}
              aria-label="Reproducir secuencia de verificación de afinación"
              onClick$={onTuningClick$}
            >
              Verificar afinación
            </button>
            <button
              type="button"
              class="btn-scale"
              disabled={isPlayingTuning.value || isPlayingScale.value}
              aria-label="Reproducir escala actual"
              onClick$={onScaleClick$}
            >
              Tocar escala
            </button>
          </div>

          <p class="mode-hint">Modo manual: toca el diapason</p>

          <p
            class="audio-status"
            role="status"
            aria-live="polite"
            data-audio-status={audioStatus.value ? "active" : "idle"}
          >
            {audioStatus.value}
          </p>
        </div>
      </div>

      <ScaleReference scaleId={scaleId.value} />

      <Diapason scaleId={scaleId.value} />
    </section>
  );
});

const STYLES = `
  .scale-switcher {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* Paper-toned surface that hosts the key/mode selectors + labels.
     The active word is rendered in the dominant ground color
     (terracotta), so it must sit on a non-terracotta surface to read. */
  .controls-frame {
    border: var(--frame-border);
    border-top: none;
    background: var(--color-paper);
    padding: var(--space-3) var(--space-4);
    box-sizing: border-box;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
  }

  .key-selector {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2) var(--space-3);
  }

  .modes {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-4) var(--space-5);
  }

  .key {
    font-family: var(--font-display);
    font-size: var(--fs-key);
    color: var(--color-ink);
    letter-spacing: 0.02em;
    padding: var(--space-1) var(--space-2);
    position: relative;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 320ms ease-out;
  }

  /* Faint ink rule reveals on hover/focus for key buttons. */
  .key::after {
    content: "";
    position: absolute;
    left: var(--space-2);
    right: var(--space-2);
    bottom: var(--space-1);
    height: 2px;
    background: var(--color-ink);
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 280ms ease-out;
  }

  .key:hover::after,
  .key:focus-visible::after {
    transform: scaleX(1);
  }

  .key--active,
  .key--active:hover,
  .key--active:focus-visible {
    color: var(--color-ground);
  }

  .key--active::after {
    background: var(--color-ground);
    transform: scaleX(1);
  }

  .mode {
    font-family: var(--font-display);
    font-size: var(--fs-mode);
    color: var(--color-ink);
    letter-spacing: 0.02em;
    padding: var(--space-1) var(--space-2);
    position: relative;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 320ms ease-out;
  }

  /* Faint ink rule reveals on hover/focus */
  .mode::after {
    content: "";
    position: absolute;
    left: var(--space-2);
    right: var(--space-2);
    bottom: var(--space-1);
    height: 2px;
    background: var(--color-ink);
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 280ms ease-out;
  }

  .mode:hover::after,
  .mode:focus-visible::after {
    transform: scaleX(1);
  }

  /* Active state — the dominant ground color of the poster */
  .mode--active,
  .mode--active:hover,
  .mode--active:focus-visible {
    color: var(--color-ground);
  }

  .mode--active::after {
    background: var(--color-ground);
    transform: scaleX(1);
  }

  /* Visible "sonido sintetizado (simulación)" label — render-only label
     that makes the synthesized provenance explicit. No interaction. */
  .synthesis-label {
    margin: 0;
    font-family: var(--font-body);
    font-size: var(--fs-label);
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-ink-tint);
    text-align: center;
  }

  /* Current scale display — small text under the synthesis label
     that names the active key+mode (e.g. "Re mayor"). */
  .current-scale {
    margin: 0;
    font-family: var(--font-body);
    font-size: var(--fs-label);
    font-weight: 500;
    letter-spacing: 0.04em;
    color: var(--color-ink);
    text-align: center;
  }

  /* Verificar afinación / Tocar escala — paper/ink 1px-border buttons,
     reusing the label type scale (never the CTA/display scale). Hover
     swaps to the accent color, matching the poster's single highlight
     color; disabled dims to ink-tint with no hover transition. */
  .sequence-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
  }

  .btn-tuning,
  .btn-scale {
    font-family: var(--font-body);
    font-size: var(--fs-label);
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--color-ink);
    background: var(--color-paper);
    color: var(--color-ink);
    cursor: pointer;
    transition:
      background-color var(--motion-fast) var(--ease-printed),
      color var(--motion-fast) var(--ease-printed);
  }

  .btn-tuning:hover:not(:disabled),
  .btn-scale:hover:not(:disabled),
  .btn-tuning:focus-visible:not(:disabled),
  .btn-scale:focus-visible:not(:disabled) {
    background: var(--color-accent);
    color: var(--color-ink);
  }

  .btn-tuning:disabled,
  .btn-scale:disabled {
    color: var(--color-ink-tint);
    cursor: not-allowed;
    transition: none;
  }

  /* Manual-mode hint — always visible below the two sequence buttons;
     names the default interaction (clicking the Diapason directly). */
  .mode-hint {
    margin: 0;
    font-family: var(--font-body);
    font-size: var(--fs-label);
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-ink-tint);
    text-align: center;
  }

  /* Spanish status node — driven by the audio module's reject callback.
     Empty when audio is available; "Audio no disponible. Toca una nota
     para intentarlo de nuevo." when the user gesture was rejected. */
  .audio-status {
    margin: 0;
    min-height: 1.4em;
    font-family: var(--font-body);
    font-size: var(--fs-label);
    font-weight: 500;
    color: var(--color-ink);
    text-align: center;
    opacity: 0;
    transition: opacity 200ms ease-out;
  }

  .audio-status[data-audio-status="active"] {
    opacity: 1;
  }

  /* On the narrowest viewports the controls column-stack. */
  @media (max-width: 640px) {
    .controls {
      flex-direction: column;
      gap: var(--space-3);
    }
    .key-selector {
      flex-direction: row;
      gap: var(--space-1) var(--space-2);
    }
    .modes {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-1) var(--space-3);
    }
    .key {
      font-size: clamp(1.1rem, 4vw, 1.4rem);
    }
    .mode {
      font-size: clamp(0.95rem, 4.5vw, 1.2rem);
      padding: var(--space-1);
    }
  }

  /* Reduced-motion: transitions are killed by the global rule; this is a
     belt-and-suspenders reminder at the component scope. */
  @media (prefers-reduced-motion: reduce) {
    .key,
    .key::after,
    .mode,
    .mode::after,
    .btn-tuning,
    .btn-scale {
      transition: none;
    }
  }
`;
