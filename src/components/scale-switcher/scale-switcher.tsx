import {
  component$,
  useContextProvider,
  useSignal,
  useStylesScoped$,
  $,
} from "@builder.io/qwik";
import { Diapason } from "../diapason/diapason";
import { AudioStatusContext } from "../../audio/audio-status-context";
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

  const currentScale = getScaleById(scaleId.value);

  return (
    <section
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
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }
    .key {
      font-size: clamp(1.1rem, 4vw, 1.4rem);
    }
    .mode {
      font-size: clamp(1.35rem, 6vw, 1.75rem);
    }
  }

  /* Reduced-motion: transitions are killed by the global rule; this is a
     belt-and-suspenders reminder at the component scope. */
  @media (prefers-reduced-motion: reduce) {
    .key,
    .key::after,
    .mode,
    .mode::after {
      transition: none;
    }
  }
`;
