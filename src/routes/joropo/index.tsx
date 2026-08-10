import {
  component$,
  useComputed$,
  useContextProvider,
  useSignal,
  useStylesScoped$,
  noSerialize,
  type NoSerialize,
  $,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { ChordCarousel } from "../../components/chord-carousel/chord-carousel";
import { Footer } from "../../components/footer/footer";
import { AudioStatusContext } from "../../audio/audio-status-context";
import { playCircleSequence } from "../../audio/play-chord";
import {
  DEFAULT_CIRCLE_ID,
  getCircleById,
  type CircleQuality,
} from "../../music/chords";
import {
  ALL_KEYS_LIST,
  getKeyLabel,
  getKeyLetter,
  type Key,
} from "../../music/scales";

/**
 * /acordes — the joropo harmonic circle (V7–I–IV), in all 12 tonos.
 *
 * Owns 3 pieces of state: `tonoKey` (which of the 12 tonos), `quality`
 * (mayor/menor), and `activeChordIndex` (which of the circle's 3
 * chords the ChordCarousel shows) — one signal drives BOTH manual
 * carousel navigation and the auto-advance during `playCircleSequence`
 * (via its `onChordStart` callback), so there is exactly one source of
 * truth for "which chord is showing" regardless of how it got there.
 *
 * `currentCircle` is a `useComputed$` derived from `tonoKey`/`quality`
 * — NOT a plain `const`. A plain two-statement `const circle = ...;
 * const chords = circle.chords;` derivation silently breaks Qwik's
 * prop-reactivity tracking into a child component (confirmed via a
 * minimal repro: the exact same derivation inlined as ONE expression,
 * or wrapped in `useComputed$`, both update the child correctly; split
 * across two `const` statements, the child keeps stale props even
 * though the SAME expression rendered as this component's own JSX
 * text updates fine). `useComputed$` is also recomputed again inside
 * `onPlayCircleClick$` (reading the signals directly rather than
 * closing over the render-time value) so a key change mid-playback can
 * never race a stale circle reference.
 *
 * Mirrors the ScaleSwitcher/original-ChordFretboard precedent for the
 * circle-sequence AbortController: `useSignal<NoSerialize<...>>` +
 * `noSerialize()` + a finally-guard that only clears `isPlayingCircle`
 * when its own run is still the current one.
 */

const DEFAULT_TONO: Key = "re";
const DEFAULT_QUALITY: CircleQuality = "mayor";
const QUALITIES: readonly CircleQuality[] = ["mayor", "menor"];

/** Solid play triangle — see ChordFretboard's own PlayIcon for the same mobile icon-button rationale. */
function PlayIcon() {
  return (
    <svg
      class="btn-circle__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 4.5v15l13-7.5-13-7.5z" fill="currentColor" />
    </svg>
  );
}

export default component$(() => {
  useStylesScoped$(STYLES);

  const tonoKey = useSignal<Key>(DEFAULT_TONO);
  const quality = useSignal<CircleQuality>(DEFAULT_QUALITY);
  const activeChordIndex = useSignal(0);
  const audioStatus = useSignal<string>("");
  useContextProvider(AudioStatusContext, audioStatus);

  const circleAbort = useSignal<NoSerialize<AbortController>>(undefined);
  const isPlayingCircle = useSignal(false);

  const currentCircle = useComputed$(
    () =>
      getCircleById(`joropo-${tonoKey.value}-${quality.value}`) ??
      getCircleById(DEFAULT_CIRCLE_ID)!,
  );

  const onTonoClick$ = $((key: Key) => {
    tonoKey.value = key;
  });

  const onQualityClick$ = $((q: CircleQuality) => {
    quality.value = q;
  });

  const onCarouselNavigate$ = $((index: number) => {
    activeChordIndex.value = index;
  });

  const onPlayCircleClick$ = $(async () => {
    circleAbort.value?.abort();
    const controller = new AbortController();
    circleAbort.value = noSerialize(controller);
    isPlayingCircle.value = true;
    try {
      const circle =
        getCircleById(`joropo-${tonoKey.value}-${quality.value}`) ??
        getCircleById(DEFAULT_CIRCLE_ID)!;
      await playCircleSequence(circle, {
        signal: controller.signal,
        onStatus: (msg) => {
          audioStatus.value = msg;
        },
        onChordStart: (chord) => {
          const idx = circle.chords.findIndex((c) => c.id === chord.id);
          if (idx !== -1) activeChordIndex.value = idx;
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

  return (
    <>
      <main class="acordes" aria-label="Acordes del círculo armónico">
        <h1 class="acordes__title font-display">Acordes</h1>
        <p class="acordes__lede">
          El círculo armónico del joropo — elige el tono, toca cada acorde
          completo o nota por nota, y sigue el círculo completo cuando
          suena.
        </p>

        <div class="controls-frame">
          <div class="tono-selector" role="radiogroup" aria-label="Tono">
            {ALL_KEYS_LIST.map((key) => {
              const active = key === tonoKey.value;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  class={["tono", active ? "tono--active" : ""].join(" ")}
                  data-tono={key}
                  onClick$={() => onTonoClick$(key)}
                >
                  {getKeyLabel(key)}
                </button>
              );
            })}
          </div>

          <div class="tono-letter-row">
            <span class="tono-letter font-display" aria-hidden="true">
              {getKeyLetter(tonoKey.value)}
            </span>

            <div
              class="quality-selector"
              role="radiogroup"
              aria-label="Modo"
            >
              {QUALITIES.map((q) => {
                const active = q === quality.value;
                return (
                  <button
                    key={q}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    class={[
                      "quality",
                      active ? "quality--active" : "",
                    ].join(" ")}
                    data-quality={q}
                    onClick$={() => onQualityClick$(q)}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
          </div>

          <p class="current-circle" aria-label="Círculo actual">
            {currentCircle.value.label}
          </p>

          <button
            type="button"
            class="btn-circle"
            disabled={isPlayingCircle.value}
            aria-label="Reproducir círculo completo"
            onClick$={onPlayCircleClick$}
          >
            <PlayIcon />
            <span class="btn-circle__label">Tocar círculo completo</span>
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

        <div class="carousel-frame">
          <ChordCarousel
            chords={currentCircle.value.chords}
            activeIndex={activeChordIndex.value}
            disabled={isPlayingCircle.value}
            onNavigate$={onCarouselNavigate$}
          />
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
        "Aprende los acordes del círculo armónico del joropo — dominante, tónica y subdominante — en los 12 tonos, en un diapason interactivo de bandola llanera.",
    },
  ],
};

const STYLES = `
  .acordes {
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

  .tono-selector {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-1) var(--space-3);
  }

  .tono {
    font-family: var(--font-display);
    font-size: clamp(0.9rem, 0.6vw + 0.75rem, 1.15rem);
    color: var(--color-ink);
    letter-spacing: 0.01em;
    padding: var(--space-1) var(--space-1);
    position: relative;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color var(--motion-medium) var(--ease-printed);
  }

  .tono::after {
    content: "";
    position: absolute;
    left: 2px;
    right: 2px;
    bottom: 1px;
    height: 2px;
    background: var(--color-ink);
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 280ms ease-out;
  }

  .tono:hover::after,
  .tono:focus-visible::after {
    transform: scaleX(1);
  }

  .tono--active,
  .tono--active:hover,
  .tono--active:focus-visible {
    color: var(--color-ground);
  }

  .tono--active::after {
    background: var(--color-ground);
    transform: scaleX(1);
  }

  .tono-letter-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-6);
    width: 100%;
  }

  /* The big, at-a-glance "which note" signal (REQ: picked note must be
     big and visible) — the conventional letter name (D, A, G…), NOT
     the Spanish solfège used everywhere else, matching how printed
     bandola chord references label roots. Renders in the ground color
     on paper — the same "Active-Ink Rule" the Mayor/Menor toggle
     already uses, so it reads as the page's own emphasis, not a new
     accent color. */
  .tono-letter {
    font-size: clamp(3rem, 4vw + 2rem, 5rem);
    line-height: 1;
    color: var(--color-ground);
  }

  .quality-selector {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: var(--space-5);
  }

  .quality {
    font-family: var(--font-display);
    font-size: var(--fs-mode);
    color: var(--color-ink);
    letter-spacing: 0.02em;
    padding: var(--space-1) var(--space-2);
    position: relative;
    background: transparent;
    border: none;
    cursor: pointer;
    text-transform: capitalize;
    transition: color var(--motion-medium) var(--ease-printed);
  }

  .quality::after {
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

  .quality:hover::after,
  .quality:focus-visible::after {
    transform: scaleX(1);
  }

  .quality--active,
  .quality--active:hover,
  .quality--active:focus-visible {
    color: var(--color-ground);
  }

  .quality--active::after {
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
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

  /* Same ships-always-paints-conditionally treatment as ChordFretboard's PlayIcon. */
  .btn-circle__icon {
    display: none;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
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

  /* Deliberately wider than .controls-frame's 640px — matching the
     landing poster's own max-width (DESIGN.md's established "big"
     scale in this system) — so the carousel, the page's primary
     big-and-visible content, stands out rather than matching the
     narrower controls above it. */
  .carousel-frame {
    width: 100%;
    max-width: 960px;
    padding-bottom: var(--space-6);
  }

  @media (prefers-reduced-motion: reduce) {
    .tono,
    .tono::after,
    .quality,
    .quality::after,
    .btn-circle,
    .audio-status {
      transition: none;
    }
  }

  @media (max-width: 640px) {
    /* The fretboard is the page's primary learning surface on a
       phone — every rule below trims chrome ABOVE it (tighter
       rhythm, a smaller lede, a redundant summary line dropped, icon
       buttons instead of wide text ones) so it reads as the
       dominant element instead of one more stacked card. */
    .acordes {
      padding: var(--space-3) var(--space-2);
      gap: var(--space-3);
    }
    .acordes__lede {
      font-size: 0.8125rem;
      max-width: 34ch;
    }
    .controls-frame {
      padding: var(--space-2) var(--space-3);
      gap: var(--space-2);
    }
    /* Redundant on a phone: the active tono letter + the Mayor/Menor
       toggle already state this; a screen reader gets the same fact
       from each control's own aria-checked state. */
    .current-circle {
      display: none;
    }
    .quality-selector {
      gap: var(--space-3);
    }
    .tono-letter-row {
      gap: var(--space-3);
    }
    .tono-letter {
      font-size: clamp(2.25rem, 8vw, 3.5rem);
    }
    .btn-circle {
      width: 2.25rem;
      height: 2.25rem;
      padding: 0;
    }
    .btn-circle__icon {
      display: block;
    }
    .btn-circle__label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
    .carousel-frame {
      padding-bottom: var(--space-3);
    }
  }
`;
