import {
  component$,
  useSignal,
  useStylesScoped$,
  $,
  type QRL,
} from "@builder.io/qwik";
import { Diapason } from "../diapason/diapason";

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
 * and passes it to the Diapason. Includes the audio placeholder toggle.
 *
 * The mode words are wood-type. The active mode is rendered in the dominant
 * ground color (terracotta). Inactive modes are ink. A faint ink rule reveals
 * on hover/focus.
 */
export const ScaleSwitcher = component$<ScaleSwitcherProps>(() => {
  useStylesScoped$(STYLES);

  const mode = useSignal<Mode>("mayor");
  const audioOn = useSignal(false);

  const setMode = $((next: Mode) => {
    mode.value = next;
  });

  const toggleAudio = $(() => {
    audioOn.value = !audioOn.value;
  });

  return (
    <section
      class="scale-switcher"
      aria-label="Selector de escala y audio de muestra"
    >
      <Diapason mode={mode.value} />

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

          <button
            type="button"
            class={["audio", audioOn.value ? "audio--on" : ""].join(" ")}
            aria-label="Reproducir audio de muestra (placeholder)"
            aria-pressed={audioOn.value}
            onClick$={toggleAudio}
          >
            <span class="audio-dot" aria-hidden="true" />
            <span class="audio-label">Audio de muestra (placeholder)</span>
          </button>
        </div>
      </div>

      {/* Empty placeholder audio element — no src, no fabricated recording. */}
      <audio
        data-placeholder="true"
        aria-hidden="true"
      />
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
