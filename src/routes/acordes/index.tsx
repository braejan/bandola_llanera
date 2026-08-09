import {
  component$,
  useContextProvider,
  useSignal,
  useStylesScoped$,
  noSerialize,
  type NoSerialize,
  $,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ChordFretboard } from "../../components/chord-fretboard/chord-fretboard";
import { Footer } from "../../components/footer/footer";
import { AudioStatusContext } from "../../audio/audio-status-context";
import { playCircleSequence } from "../../audio/play-chord";
import { CIRCLES, type CircleId } from "../../music/chords";

/**
 * /acordes — integrates all 4 capabilities (ChordData, ChordFretboard,
 * ChordPlayback, StudentMenu). StudentMenu is not rendered here — it
 * lives in `src/routes/layout.tsx`, above every route. `Footer` IS
 * rendered here (page-local, mirrors the landing route's own
 * `<main>` + `<Footer />` sibling pattern — Footer is not global).
 *
 * Owns `circleId` + `audioStatus` and PROVIDES `AudioStatusContext` —
 * mirrors the ScaleSwitcher precedent (route/page-level component owns
 * the signal + renders the visible status node; child components only
 * consume the context and write to it via `onStatus`).
 *
 * The circle-sequence AbortController uses the SAME
 * `useSignal<NoSerialize<AbortController>>` + `noSerialize()` +
 * finally-guard pattern as ScaleSwitcher's `onTuningClick$`/
 * `onScaleClick$` — a plain `useSignal<AbortController>()` throws at
 * serialization (pinned ScaleSwitcher learning).
 *
 * Each `ChordFretboard` is keyed by `chord.id` (REQUIRED — see that
 * component's own lifecycle-contract doc comment): toggling
 * Mayor/Menor changes the chord at each position, so Qwik remounts a
 * fresh ChordFretboard instance with a fresh anim-target subscription
 * instead of mutating one in place. The shared dominant
 * (`la-con-septima`) keeps the same key across both circles, so IT
 * never remounts — which is correct, since its `chord.id` never
 * changes either.
 */

const CIRCLE_SHORT_LABEL: Record<CircleId, string> = {
  "joropo-d-mayor": "mayor",
  "joropo-d-menor": "menor",
};

export default component$(() => {
  useStylesScoped$(STYLES);

  const circleId = useSignal<CircleId>(CIRCLES[0].id);
  const audioStatus = useSignal<string>("");
  useContextProvider(AudioStatusContext, audioStatus);

  const circleAbort = useSignal<NoSerialize<AbortController>>(undefined);
  const isPlayingCircle = useSignal(false);

  const onCircleToggleClick$ = $((id: CircleId) => {
    circleId.value = id;
  });

  const onPlayCircleClick$ = $(async () => {
    circleAbort.value?.abort();
    const controller = new AbortController();
    circleAbort.value = noSerialize(controller);
    isPlayingCircle.value = true;
    try {
      const circle = CIRCLES.find((c) => c.id === circleId.value);
      if (!circle) return;
      await playCircleSequence(circle, {
        signal: controller.signal,
        onStatus: (msg) => {
          audioStatus.value = msg;
        },
      });
    } finally {
      // Only the run that is still "current" clears the flag — an
      // aborted prior run's finally must not clobber a newer run's
      // in-flight state (mirrors ScaleSwitcher).
      if (circleAbort.value === controller) {
        isPlayingCircle.value = false;
      }
    }
  });

  const currentCircle =
    CIRCLES.find((c) => c.id === circleId.value) ?? CIRCLES[0];

  return (
    <>
      <main class="acordes" aria-label="Acordes del círculo de Re">
        <h1 class="acordes__title font-display">Acordes</h1>
        <p class="acordes__lede">
          El círculo armónico de Re en joropo — toca cada acorde completo o
          nota por nota.
        </p>

        <div class="controls-frame">
          <div class="circle-selector" role="radiogroup" aria-label="Círculo">
            {CIRCLES.map((circle) => {
              const active = circle.id === circleId.value;
              return (
                <button
                  key={circle.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  class={["circle", active ? "circle--active" : ""].join(" ")}
                  data-circle={circle.id}
                  onClick$={() => onCircleToggleClick$(circle.id)}
                >
                  <span class="circle-label">
                    {CIRCLE_SHORT_LABEL[circle.id]}
                  </span>
                </button>
              );
            })}
          </div>

          <p class="current-circle" aria-label="Círculo actual">
            {currentCircle.label}
          </p>

          <button
            type="button"
            class="btn-circle"
            disabled={isPlayingCircle.value}
            aria-label="Reproducir círculo completo"
            onClick$={onPlayCircleClick$}
          >
            Tocar círculo completo
          </button>

          <p
            class="audio-status"
            role="status"
            aria-live="polite"
            data-audio-status={audioStatus.value ? "active" : "idle"}
          >
            {audioStatus.value}
          </p>
        </div>

        <div class="chords">
          {currentCircle.chords.map((chord) => (
            <ChordFretboard chord={chord} key={chord.id} />
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
});

export const head: DocumentHead = {
  title: "Acordes — La Bandola Llanera",
  meta: [
    {
      name: "description",
      content:
        "Aprende los acordes del círculo armónico de Re en joropo — Re mayor, La con séptima, Sol mayor y sus relativos menores — en un diapason interactivo de bandola llanera.",
    },
  ],
};

const STYLES = `
  .acordes {
    min-height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--color-ground);
    color: var(--color-paper);
    padding: clamp(var(--space-2), 1vw, var(--space-3));
    box-sizing: border-box;
    gap: var(--space-4);
  }

  .acordes__title {
    font-size: var(--fs-display);
    line-height: 1.05;
    margin: 0;
    color: var(--color-paper);
    letter-spacing: 0.01em;
    text-align: center;
  }

  .acordes__lede {
    font-family: var(--font-body);
    font-size: var(--fs-heritage);
    font-weight: 500;
    color: var(--color-paper);
    text-align: center;
    margin: 0;
    max-width: 56ch;
  }

  .controls-frame {
    width: 100%;
    max-width: 640px;
    border: var(--frame-border);
    background: var(--color-paper);
    padding: var(--space-3) var(--space-4);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }

  .circle-selector {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: var(--space-5);
  }

  .circle {
    font-family: var(--font-display);
    font-size: var(--fs-mode);
    color: var(--color-ink);
    letter-spacing: 0.02em;
    padding: var(--space-1) var(--space-2);
    position: relative;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color var(--motion-medium) var(--ease-printed);
  }

  .circle::after {
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

  .circle:hover::after,
  .circle:focus-visible::after {
    transform: scaleX(1);
  }

  .circle--active,
  .circle--active:hover,
  .circle--active:focus-visible {
    color: var(--color-ground);
  }

  .circle--active::after {
    background: var(--color-ground);
    transform: scaleX(1);
  }

  .current-circle {
    margin: 0;
    font-family: var(--font-body);
    font-size: var(--fs-label);
    font-weight: 500;
    color: var(--color-ink);
    text-align: center;
  }

  .btn-circle {
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

  .btn-circle:hover:not(:disabled),
  .btn-circle:focus-visible:not(:disabled) {
    background: var(--color-accent);
    color: var(--color-ink);
  }

  .btn-circle:disabled {
    color: var(--color-ink-tint);
    cursor: not-allowed;
    transition: none;
  }

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

  .chords {
    width: 100%;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    padding-bottom: var(--space-6);
  }

  @media (prefers-reduced-motion: reduce) {
    .circle,
    .circle::after,
    .btn-circle,
    .audio-status {
      transition: none;
    }
  }

  @media (max-width: 640px) {
    .acordes {
      padding: var(--space-3) var(--space-2);
    }
    .circle-selector {
      gap: var(--space-3);
    }
  }
`;
