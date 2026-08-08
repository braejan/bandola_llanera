import {
  component$,
  useContextProvider,
  useSignal,
  useStylesScoped$,
  $,
  type QRL,
} from "@builder.io/qwik";
import { Diapason } from "../diapason/diapason";
import { AudioStatusContext } from "../../audio/audio-status-context";

export type Mode = "mayor" | "menor" | "armonica";

interface ModeDef {
  id: Mode;
  label: string;
}

const MODES: ModeDef[] = [
  { id: "mayor", label: "Mayor" },
  { id: "menor", label: "Menor" },
  { id: "armonica", label: "Armónica" },
];

interface ScaleSwitcherProps {
  onModeChange$?: QRL<(mode: Mode) => void>;
}

/**
 * ScaleSwitcher — owns the current scale mode (Mayor / Menor / Armónica)
 * and passes it to the Diapason.
 *
 * Visual order is the radio header above the Diapason, then a paper
 * controls frame that hosts the visible "sonido sintetizado (simulación)"
 * label and a Spanish status node for the audio module. The legacy
 * placeholder audio toggle and `<audio data-placeholder="true">` element
 * are removed — the per-note buttons in the Diapason replace them.
 *
 * The mode words are wood-type. The active mode is rendered in the
 * dominant ground color (terracotta). Inactive modes are ink. A faint
 * ink rule reveals on hover/focus.
 */
export const ScaleSwitcher = component$<ScaleSwitcherProps>(() => {
  useStylesScoped$(STYLES);

  const mode = useSignal<Mode>("mayor");
  const audioStatus = useSignal<string>("");

  // Provide the audio-status signal so the Diapason (which owns the
  // click handler that calls playMidiNote) can write the rejected
  // status into it. The visible <p role="status"> below reads the
  // same signal (WARNING-4).
  useContextProvider(AudioStatusContext, audioStatus);

  const setMode = $((next: Mode) => {
    mode.value = next;
  });

  return (
    <section
      class="scale-switcher"
      aria-label="Selector de escala y estado de audio"
    >
      <div class="controls-frame">
        <div class="controls">
          <div
            class="modes"
            role="radiogroup"
            aria-label="Escala"
          >
            {MODES.map((m) => {
              const active = mode.value === m.id;
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

      <Diapason mode={mode.value} />
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

  /* Paper-toned surface that hosts the modes + audio toggle.
     The active mode word is rendered in the dominant ground color
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

  .modes {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-4) var(--space-5);
  }

  .mode {
    font-family: var(--font-display);
    font-size: var(--fs-mode);
    color: var(--color-ink);
    letter-spacing: 0.02em;
    padding: var(--space-1) var(--space-2);
    position: relative;
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

  .audio {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-ink);
    color: var(--color-ink);
    font-family: var(--font-body);
    font-size: var(--fs-label);
    font-weight: 500;
    letter-spacing: 0.04em;
    background: transparent;
    transition:
      background-color 200ms ease-out,
      color 200ms ease-out;
  }

  .audio:hover {
    background: var(--color-ink);
    color: var(--color-paper);
  }

  .audio--on {
    background: var(--color-ink);
    color: var(--color-paper);
  }

  .audio-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
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
    /* Wood-type mode words need to fit a narrow column. */
    .modes {
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }
    .mode {
      font-size: clamp(1.35rem, 6vw, 1.75rem);
    }
  }

  /* Reduced-motion: transitions are killed by the global rule; this is a
     belt-and-suspenders reminder at the component scope. */
  @media (prefers-reduced-motion: reduce) {
    .mode,
    .mode::after,
    .audio {
      transition: none;
    }
  }
`;
