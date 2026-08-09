import {
  $,
  component$,
  useSignal,
  useStylesScoped$,
  type QRL,
} from "@builder.io/qwik";
import { ChordFretboard } from "../chord-fretboard/chord-fretboard";
import type { Chord, ChordRole } from "../../music/chords";

/**
 * ChordCarousel — a stories-style horizontal slider over a joropo
 * circle's 3 chords (dominant7, tonic, subdominant).
 *
 * One slide fills the viewport at a time (no peeking neighbor, like an
 * IG story), so the current chord's name and fretboard are always the
 * biggest thing on screen. Navigation is dual: manual (swipe/drag,
 * the prev/next chevrons, the progress ticks, or arrow keys) AND
 * automatic — the parent drives `activeIndex` from
 * `playCircleSequence`'s `onChordStart` callback while the circle
 * plays, and passes `disabled` so manual controls don't fight the
 * auto-advance.
 *
 * Fully controlled: this component owns no "which chord is active"
 * state itself, only the transient drag-gesture signals. The parent
 * (the /acordes route) owns `activeIndex` so ONE signal drives both
 * manual clicks and the playback sync.
 *
 * Navigation wraps (index 2 -> next -> index 0), matching the circle
 * metaphor — there is no "last slide", the progression repeats.
 */

export interface ChordCarouselProps {
  /** Exactly 3 chords, in [dominant7, tonic, subdominant] order. */
  chords: readonly Chord[];
  activeIndex: number;
  onNavigate$: QRL<(index: number) => void>;
  /** True while `playCircleSequence` is driving activeIndex — manual controls go inert. */
  disabled?: boolean;
}

const ROLE_LABEL: Record<ChordRole, string> = {
  dominant7: "Dominante",
  tonic: "Tónica",
  subdominant: "Subdominante",
};

const SWIPE_THRESHOLD_PX = 40;

function ChevronIcon({ direction }: { direction: "prev" | "next" }) {
  const points =
    direction === "prev" ? "15,4 6,12 15,20" : "9,4 18,12 9,20";
  return (
    <svg
      class="chord-carousel__chevron-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="square"
        stroke-linejoin="miter"
      />
    </svg>
  );
}

export const ChordCarousel = component$<ChordCarouselProps>(
  ({ chords, activeIndex, onNavigate$, disabled = false }) => {
    useStylesScoped$(STYLES);

    const dragStartX = useSignal<number | null>(null);
    const dragActive = useSignal(false);

    const goTo = $((index: number) => {
      const n = chords.length;
      const wrapped = ((index % n) + n) % n;
      if (wrapped !== activeIndex) void onNavigate$(wrapped);
    });

    const onPointerDown$ = $((event: PointerEvent) => {
      if (disabled) return;
      dragStartX.value = event.clientX;
      dragActive.value = true;
    });

    const onPointerUp$ = $((event: PointerEvent) => {
      if (dragStartX.value === null) return;
      const delta = event.clientX - dragStartX.value;
      dragStartX.value = null;
      dragActive.value = false;
      if (delta <= -SWIPE_THRESHOLD_PX) void goTo(activeIndex + 1);
      else if (delta >= SWIPE_THRESHOLD_PX) void goTo(activeIndex - 1);
    });

    const onPointerCancel$ = $(() => {
      dragStartX.value = null;
      dragActive.value = false;
    });

    const onKeyDown$ = $((event: KeyboardEvent) => {
      if (disabled) return;
      if (event.key === "ArrowRight") void goTo(activeIndex + 1);
      else if (event.key === "ArrowLeft") void goTo(activeIndex - 1);
    });

    return (
      <div class="chord-carousel">
        <div
          class="chord-carousel__progress"
          role="tablist"
          aria-label="Progreso del círculo"
        >
          {chords.map((chord, i) => (
            <button
              type="button"
              role="tab"
              key={chord.id}
              aria-selected={i === activeIndex}
              aria-label={`Ir a ${chord.name}`}
              class={[
                "chord-carousel__tick",
                i === activeIndex ? "chord-carousel__tick--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={disabled}
              onClick$={() => goTo(i)}
            />
          ))}
        </div>

        <div
          class="chord-carousel__viewport"
          role="group"
          aria-label="Acordes del círculo — desliza o usa las flechas del teclado"
          tabIndex={0}
          data-dragging={dragActive.value ? "true" : "false"}
          onKeyDown$={onKeyDown$}
          onPointerDown$={onPointerDown$}
          onPointerUp$={onPointerUp$}
          onPointerCancel$={onPointerCancel$}
        >
          <button
            type="button"
            class="chord-carousel__nav chord-carousel__nav--prev"
            aria-label="Acorde anterior"
            disabled={disabled}
            onClick$={() => goTo(activeIndex - 1)}
          >
            <ChevronIcon direction="prev" />
          </button>

          <div class="chord-carousel__track-clip">
            <div
              class="chord-carousel__track"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {chords.map((chord, i) => (
                <div
                  class="chord-carousel__slide"
                  key={chord.id}
                  aria-hidden={i === activeIndex ? undefined : "true"}
                >
                  <p class="chord-carousel__role">{ROLE_LABEL[chord.role]}</p>
                  <h2 class="chord-carousel__chord-name font-display">
                    {chord.name}
                  </h2>
                  <div class="chord-carousel__fretboard-scroll">
                    <ChordFretboard chord={chord} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            class="chord-carousel__nav chord-carousel__nav--next"
            aria-label="Acorde siguiente"
            disabled={disabled}
            onClick$={() => goTo(activeIndex + 1)}
          >
            <ChevronIcon direction="next" />
          </button>
        </div>
      </div>
    );
  },
);

const STYLES = `
  /* Matches .controls-frame's printed-card treatment above it (2px ink
     border, paper background) — this carousel was the one block on
     the page floating unframed directly on the terracotta ground,
     which read as visually "lighter"/less important than the boxed
     controls above it even though their widths matched. */
  .chord-carousel {
    width: 100%;
    box-sizing: border-box;
    border: var(--frame-border);
    background: var(--color-paper);
    padding: var(--space-3) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .chord-carousel__progress {
    display: flex;
    gap: var(--space-2);
    width: 100%;
  }

  .chord-carousel__tick {
    flex: 1;
    height: 4px;
    padding: 0;
    border: 1.5px solid var(--color-ink);
    background: transparent;
    cursor: pointer;
  }

  /* Active-Ink Rule: the active indicator renders in the ground color
     on paper — the same treatment the Mayor/Menor toggle uses. */
  .chord-carousel__tick--active {
    background: var(--color-ground);
    border-color: var(--color-ground);
  }

  .chord-carousel__tick:disabled {
    cursor: default;
  }

  .chord-carousel__viewport {
    position: relative;
    width: 100%;
    overflow: hidden;
    display: flex;
    align-items: stretch;
    gap: var(--space-2);
    touch-action: pan-y;
  }

  .chord-carousel__viewport:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* Clipping lives on this STATIC wrapper, not on .chord-carousel__track
     itself. Putting overflow:hidden on the SAME element that also
     carries the animated transform hits a real Chrome paint bug: a
     slide revealed by the transform (translated into view) never gets
     painted — it stays visually blank even though its DOM/layout/
     computed-style are all correct (confirmed via getComputedStyle +
     getBoundingClientRect while reproducing). Splitting "clips" (this
     element) from "transforms" (.chord-carousel__track) is the
     standard fix and avoids the bug entirely. This element's OWN box
     (not just the outer viewport's) must clip the 3 slides — or an
     inactive slide's content renders into the gap between the track
     and the nav chevrons instead of staying off-screen. */
  .chord-carousel__track-clip {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .chord-carousel__track {
    display: flex;
    width: 100%;
    transition: transform var(--motion-medium) var(--ease-printed);
  }

  .chord-carousel__viewport[data-dragging="true"] .chord-carousel__track {
    transition: none;
  }

  .chord-carousel__slide {
    flex: 0 0 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-1);
    box-sizing: border-box;
  }

  /* The fretboard's 12-column grid has its own intrinsic minimum
     width (a note label can only shrink so far). Rather than let that
     width demand force the carousel's own flex layout to overflow
     (pushing the nav chevrons off-screen), it gets its own scroll
     boundary — a key whose voicing lands far up the neck scrolls
     horizontally inside the slide instead of breaking the slide. */
  .chord-carousel__fretboard-scroll {
    width: 100%;
    overflow-x: auto;
  }

  .chord-carousel__role {
    margin: 0;
    font-family: var(--font-body);
    font-size: var(--fs-label);
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-ink-tint);
  }

  .chord-carousel__chord-name {
    margin: 0;
    width: 100%;
    max-width: 100%;
    /* Deliberately the SAME scale as the page's own <h1> (--fs-display)
       — prominent, but not a sprawling hero. Ground color on paper —
       the Active-Ink Rule, same emphasis vocabulary as the big tono
       letter and the active Mayor/Menor word. */
    font-size: var(--fs-display);
    line-height: 1.05;
    color: var(--color-ground);
    text-align: center;
    overflow-wrap: break-word;
    box-sizing: border-box;
  }

  .chord-carousel__nav {
    flex: 0 0 auto;
    align-self: center;
    width: clamp(2.25rem, 3vw, 2.75rem);
    height: clamp(2.25rem, 3vw, 2.75rem);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid var(--color-ink);
    background: transparent;
    color: var(--color-ink);
    padding: 0;
    cursor: pointer;
    transition:
      background-color var(--motion-fast) var(--ease-printed),
      color var(--motion-fast) var(--ease-printed);
  }

  .chord-carousel__nav:hover:not(:disabled),
  .chord-carousel__nav:focus-visible:not(:disabled) {
    background: var(--color-accent);
    color: var(--color-ink);
    border-color: var(--color-accent);
  }

  .chord-carousel__nav:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .chord-carousel__chevron-icon {
    width: 60%;
    height: 60%;
  }

  @media (prefers-reduced-motion: reduce) {
    .chord-carousel__track,
    .chord-carousel__nav {
      transition: none;
    }
  }

  @media (max-width: 640px) {
    .chord-carousel__nav {
      width: 2rem;
      height: 2rem;
    }
  }
`;
