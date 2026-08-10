import {
  $,
  component$,
  useContext,
  useSignal,
  useStylesScoped$,
  useVisibleTask$,
  type QRL,
} from "@builder.io/qwik";
import {
  playMidiNote,
  AUDIO_UNAVAILABLE_MESSAGE,
} from "../../audio/play-midi-note";
import { playChord } from "../../audio/play-chord";
import { AudioStatusContext } from "../../audio/audio-status-context";
import { subscribe, type AnimEvent } from "../../audio/anim-target";
import type { Chord, StringId } from "../../music/chords";

export { AUDIO_UNAVAILABLE_MESSAGE };

/**
 * ChordFretboard — a four-string bandola fretboard for ONE chord.
 *
 * Deliberately does NOT reuse `usePlayableDiapason` (design decision,
 * spec-permitted): that hook hardcodes `${string}-${fret}` targetIds
 * and takes no `onStatus`, but this component needs chord-scoped
 * targetIds (`chord-<id>-<string>-<fret>`) and AudioStatusContext
 * wiring (REQ-FRET-004/010). The click pattern is replicated locally
 * instead, reading `data-midi`/`data-string`/`data-fret` off the
 * clicked element exactly like the hook does.
 *
 * Orientation MATCHES Diapason's (user-requested fix — the original
 * REQ-FRET-011 tab order literally mirrored the landing's fretboard on
 * both axes, which read as upside-down next to it): rows top to bottom
 * are A3 -> D4 -> A4 -> E5, and frets run 7 -> 0 left to right, nut/open
 * string on the right — the same physical reading as `diapason.tsx`.
 * DOM order equals visual order (no CSS `order` trick needed here,
 * unlike Diapason's headstock cell) since there is no separate
 * open-string cell to reposition. This also means focus order now
 * follows the visual reading order top-to-bottom, left-to-right, which
 * is the better accessibility default.
 *
 * Every voicing in `src/music/chords.ts` has 4 DISTINCT midi values,
 * so the anim-target subscription can locate the matching cell by
 * `data-midi` alone once scoped to `.chord-fret--in-chord` (ghost
 * cells can share a midi with a different string/fret and must never
 * be matched — see design's "Flash matching" decision).
 *
 * Lifecycle contract: this component assumes the PARENT keys each
 * instance by `chord.id` (e.g. `<ChordFretboard chord={c} key={c.id} />`).
 * `chord.id` never changes within one mounted instance's lifetime —
 * toggling Mayor/Menor on `/joropo` remounts a fresh instance with a
 * fresh subscription instead of mutating this one in place. This is
 * the reason `useTask$` below can safely close over `chord.id` without
 * the `useComputed$` staleness guard Diapason needs (Diapason is never
 * remounted across scale switches; ChordFretboard is, by design).
 */

interface ChordFretboardProps {
  chord: Chord;
  onChordPlay?: QRL<() => void>;
}

// Render order top to bottom: A3 (top) -> D4 -> A4 -> E5 (bottom) —
// matches Diapason's physical top-to-bottom order exactly.
const STRING_ORDER: readonly StringId[] = ["A3", "D4", "A4", "E5"];

// Fret 7 (high, body end) on the left, fret 0 (open string, nut) on
// the right — matches Diapason's FRET_COLUMNS. The role-based
// transposition formula in `music/chords.ts` can land a voicing
// anywhere in 0..11 for tonos far from Re; showing only the first 7
// frets is a deliberate, temporary scope cut (not every generated
// voicing is fully visible yet) traded for a simple, non-scrolling
// board at every screen size. A dot beyond fret 7 just doesn't
// render — no cell exists for it.
const FRET_COLUMNS = [7, 6, 5, 4, 3, 2, 1, 0] as const;

const OPEN_MIDI: Record<StringId, number> = {
  A3: 57,
  D4: 62,
  A4: 69,
  E5: 76,
};

/** Generic per-pitch-class label (visible cell text), all 12 pitch classes. */
const PC_NAMES = [
  "Do",
  "Do♯",
  "Re",
  "Re♯",
  "Mi",
  "Fa",
  "Fa♯",
  "Sol",
  "Sol♯",
  "La",
  "La♯",
  "Si",
];

/**
 * Same 12 pitch classes, spelled out for the aria-label (a screen
 * reader has no reliable pronunciation for the "♯" glyph, so the
 * accessible name spells "sostenido" instead of reusing PC_NAMES).
 * Sharp-only, matching the rest of the app's convention (`scales.ts`'s
 * `KEY_DATA` — no flats).
 */
const PC_NAMES_SPOKEN = [
  "Do",
  "Do sostenido",
  "Re",
  "Re sostenido",
  "Mi",
  "Fa",
  "Fa sostenido",
  "Sol",
  "Sol sostenido",
  "La",
  "La sostenido",
  "Si",
];

const FLASH_MS = 400;

function prefersReducedMotion(el: HTMLElement): boolean {
  const view = el.ownerDocument?.defaultView as
    | (Window & typeof globalThis)
    | undefined;
  return Boolean(
    view?.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
}

/** Flash `el` with `chord-fret--playing` for FLASH_MS. No-op under reduced motion. */
function flash(el: HTMLElement): void {
  if (prefersReducedMotion(el)) return;
  el.classList.add("chord-fret--playing");
  setTimeout(() => {
    el.classList.remove("chord-fret--playing");
  }, FLASH_MS);
}

/**
 * A solid play triangle — the one universally-read shape for "play",
 * so it stays filled rather than following the chevrons' stroke-only
 * treatment. Visible only on narrow viewports, where it replaces the
 * "Tocar {chord} completo" text label (REQ: compact touch target,
 * not a wide text button) — see `.chord-fretboard__play-icon` /
 * `.chord-fretboard__play-label` in STYLES.
 */
function PlayIcon() {
  return (
    <svg
      class="chord-fretboard__play-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 4.5v15l13-7.5-13-7.5z" fill="currentColor" />
    </svg>
  );
}

export const ChordFretboard = component$<ChordFretboardProps>(
  ({ chord, onChordPlay }) => {
    useStylesScoped$(STYLES);

    const audioStatus = useContext(AudioStatusContext);
    const boardRef = useSignal<HTMLElement>();

    // Subscribe as soon as the document is ready. MUST be
    // useVisibleTask$, not useTask$: this task tracks no signal, so
    // during SSR it runs once on the SERVER and Qwik has no reactive
    // reason to resume/re-run it on the client — the subscription
    // then lives only in the server's anim-target module instance,
    // gone the moment that request ends, and the client never
    // registers a listener at all (confirmed via a classList.add
    // instrumentation trace: the flash callback body never executed
    // in the browser under useTask$). `strategy: "document-ready"`
    // (not the intersection-observer default) matters too: this
    // board must be able to flash from a circle-wide sequence even
    // before the visitor scrolls it into view — the default strategy
    // left boards below the fold with no listener at all until
    // scrolled to, so a "Tocar círculo completo" run reaching e.g.
    // Sol mayor before the visitor ever scrolled there would silently
    // never flash it.
    //
    // Matches ANY event whose targetId starts with this chord's own
    // `chord-<id>-` prefix — covers BOTH the per-cell click shape
    // (`chord-<id>-<string>-<fret>`) and playChord's index shape
    // (`chord-<id>-<i>`), reconciling REQ-PLAY-003 with REQ-FRET-005
    // (design's "Flash matching" decision). Cleanup mirrors
    // Diapason's `cleanup(off)` pattern — no listener leak across
    // remounts.
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(
      ({ cleanup }) => {
        const prefix = `chord-${chord.id}-`;
        const off = subscribe((event: AnimEvent) => {
          const root = boardRef.value;
          if (!root) return;
          if (!event.targetId.startsWith(prefix)) return;
          const el = root.querySelector<HTMLElement>(
            `.chord-fret--in-chord[data-midi="${event.midi}"]`,
          );
          if (el) flash(el);
        });
        cleanup(off);
      },
      { strategy: "document-ready" },
    );

    const isPlayable = (stringId: StringId, fret: number): boolean =>
      chord.voicing.some((v) => v.stringId === stringId && v.fret === fret);

    const handleCellClick = $(async (_event: Event, el: HTMLElement) => {
      const midi = Number(el.getAttribute("data-midi"));
      const stringId = el.getAttribute("data-string") ?? "";
      const fret = el.getAttribute("data-fret") ?? "";
      if (!Number.isFinite(midi)) return;
      flash(el);
      await playMidiNote(midi, {
        targetId: `chord-${chord.id}-${stringId}-${fret}`,
        onStatus: (msg) => {
          audioStatus.value = msg;
        },
      });
    });

    const handlePlayChord = $(() => {
      onChordPlay?.();
      void playChord(
        chord.voicing.map((v) => v.midi),
        {
          targetIdPrefix: `chord-${chord.id}`,
          onStatus: (msg) => {
            audioStatus.value = msg;
          },
        },
      );
    });

    const buttonLabel = `Tocar ${chord.name} completo`;

    return (
      <div class="chord-fretboard" data-chord={chord.id}>
        <button
          type="button"
          class="chord-fretboard__play-all"
          aria-label={buttonLabel}
          onClick$={handlePlayChord}
        >
          <PlayIcon />
          <span class="chord-fretboard__play-label">{buttonLabel}</span>
        </button>

        <div
          class="chord-fretboard__board"
          role="group"
          aria-label={`Acorde ${chord.name}`}
          ref={boardRef}
        >
          {STRING_ORDER.map((stringId) => {
            return (
              <div
                class={`chord-fretboard__row chord-fretboard__row--${stringId.toLowerCase()}`}
                data-string-row={stringId}
                key={`row-${stringId}`}
              >
                {FRET_COLUMNS.map((fret) => {
                  const midi = OPEN_MIDI[stringId] + fret;
                  const playable = isPlayable(stringId, fret);
                  const cls = [
                    "chord-fret",
                    playable ? "chord-fret--in-chord" : "chord-fret--ghost",
                    fret === 0 ? "chord-fret--open" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const label = playable
                    ? `Cuerda ${stringId}, traste ${fret}, nota ${
                        PC_NAMES_SPOKEN[midi % 12]
                      }, acorde ${chord.name}`
                    : `Cuerda ${stringId}, traste ${fret}, fuera del acorde ${chord.name}`;
                  return (
                    <button
                      type="button"
                      class={cls}
                      key={`cell-${stringId}-${fret}`}
                      data-string={stringId}
                      data-fret={String(fret)}
                      data-midi={String(midi)}
                      aria-label={label}
                      onClick$={playable ? handleCellClick : undefined}
                    >
                      <span class="chord-fret-note">{PC_NAMES[midi % 12]}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}

          <div class="chord-fretboard__fret-header" aria-hidden="true">
            {FRET_COLUMNS.map((fret) => (
              <div class="chord-fretboard__fret-num" key={`fnum-${fret}`}>
                {fret}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);

const STYLES = `
  .chord-fretboard {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    color: var(--color-ink);
    font-family: var(--font-body);
  }

  .chord-fretboard__play-all {
    align-self: center;
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

  /* Icon ships in the DOM at every width (a fixed SVG, never a late
     asset fetch) but only PAINTS on narrow viewports, where it
     replaces the wide text button with a small square touch target —
     see the mobile block below. */
  .chord-fretboard__play-icon {
    display: none;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .chord-fretboard__play-all:hover,
  .chord-fretboard__play-all:focus-visible {
    background: var(--color-accent);
    color: var(--color-ink);
  }

  .chord-fretboard__board {
    border: var(--frame-border);
    padding: 6px;
    background: var(--color-paper);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .chord-fretboard__row {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 2px;
    align-items: center;
    position: relative;
  }

  /* Per-string thickness/color — values copied verbatim from
     Diapason's .string-row--* rules (REQ-FRET-009), so the bandola
     reads as the same instrument. Metal strings (A3/D4) use the same
     multi-stop gradient simulating a wound wire; nylon strings
     (A4/E5) are a solid ink line. */
  .chord-fretboard__row--a3 {
    --string-thickness: 3.5px;
    --string-color: linear-gradient(
      to bottom,
      #e8e8e8 0%,
      #f8f8f8 12%,
      #b8b8b8 28%,
      #888888 48%,
      #c8c8c8 62%,
      #a8a8a8 82%,
      #686868 100%
    );
  }
  .chord-fretboard__row--d4 {
    --string-thickness: 2.5px;
    --string-color: linear-gradient(
      to bottom,
      #e8e8e8 0%,
      #f8f8f8 12%,
      #b8b8b8 28%,
      #888888 48%,
      #c8c8c8 62%,
      #a8a8a8 82%,
      #686868 100%
    );
  }
  .chord-fretboard__row--a4 {
    --string-thickness: 1.8px;
    --string-color: var(--color-ink);
  }
  .chord-fretboard__row--e5 {
    --string-thickness: 1.2px;
    --string-color: var(--color-ink);
  }

  .chord-fretboard__row::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: var(--string-thickness, 2px);
    background: var(--string-color, var(--color-ink));
    transform: translateY(-50%);
    z-index: 0;
    pointer-events: none;
  }

  .chord-fret {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 0.65;
    color: var(--color-ink-tint);
    background: transparent;
    border: 1px solid transparent;
    padding: 0;
    font: inherit;
    cursor: default;
    min-width: 0;
    z-index: 1;
    transition:
      background-color var(--motion-medium) var(--ease-printed),
      color var(--motion-medium) var(--ease-printed);
  }

  .chord-fretboard__row > .chord-fret:not(:last-of-type) {
    border-right: 1.5px solid var(--color-ink);
  }

  /* Open string (fret 0, the nut) — a subtle ink wash differentiates
     "no fret pressed" from a fretted position, without introducing a
     new color (value copied from Diapason's .fret--preferred wash). */
  .chord-fret--open {
    background: rgba(26, 20, 16, 0.04);
  }

  .chord-fret-note {
    position: relative;
    z-index: 3;
    font-size: var(--fs-note);
    font-weight: 600;
    line-height: 1;
  }

  /* Ghost (non-chord) cells — muted, lower opacity, not clickable
     (no onClick$ handler is attached at all — REQ-FRET-004). */
  .chord-fret--ghost {
    opacity: 0.35;
  }

  .chord-fret--ghost .chord-fret-note {
    background: var(--color-paper);
    padding: 0 3px;
    color: var(--color-ink-tint);
  }

  /* In-chord cells — marigold-filled digitation circle (distinct from
     Diapason's red scale circle, so "in the chord" and "in the scale"
     never read as the same signal). */
  .chord-fret--in-chord {
    cursor: pointer;
    opacity: 1;
  }

  .chord-fret--in-chord::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 78%;
    height: 78%;
    max-width: 30px;
    max-height: 30px;
    transform: translate(-50%, -50%);
    background: var(--color-accent);
    border: 1.5px solid var(--color-ink);
    border-radius: 50%;
    z-index: 2;
    pointer-events: none;
    transition:
      background-color var(--motion-medium) var(--ease-printed),
      border-color var(--motion-medium) var(--ease-printed);
  }

  .chord-fret--in-chord .chord-fret-note {
    color: var(--color-ink);
  }

  /* Open string (fret 0) IN the chord — a distinct cool blue instead
     of the marigold accent, so "played open, not fretted" reads as a
     different signal from "digited at this fret", not just a
     coincidental position. Text switches to paper (light-on-dark),
     the same pairing Diapason's own digitation-red circle uses,
     since this blue is dark enough that ink text loses contrast. */
  .chord-fret--open.chord-fret--in-chord::before {
    background: var(--color-open-string);
  }

  .chord-fret--open.chord-fret--in-chord .chord-fret-note {
    color: var(--color-paper);
  }

  .chord-fret--playing {
    animation: fret-pulse var(--motion-click) var(--ease-printed);
  }

  /* Fret-number ruler — thin reference line below the neck, matching
     Diapason's .diapason-fret-header exactly (same tokens, same
     column grid, so both instruments read as one system). */
  .chord-fretboard__fret-header {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 2px;
    border-top: 1px solid var(--color-ink);
    padding-top: 3px;
    margin-top: 2px;
  }

  .chord-fretboard__fret-num {
    text-align: center;
    font-size: 0.625rem;
    color: var(--color-ink-tint);
    font-weight: 500;
    letter-spacing: 0.05em;
    line-height: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .chord-fret,
    .chord-fret--in-chord::before {
      transition: none;
    }
    .chord-fret--playing {
      animation: none;
    }
  }

  @media (max-width: 640px) {
    .chord-fretboard__board {
      padding: 4px;
    }
    .chord-fret-note {
      font-size: 0.8125rem;
    }

    /* Taller cells, not just narrower ones: on a phone the fretboard
       is the primary learning surface (REQ), and after the mobile
       chrome cuts above it there is real spare vertical room to
       spend making the neck itself bigger and easier to read. */
    .chord-fret {
      aspect-ratio: 1 / 1.5;
    }
    /* Fixed equal px, not the base rule's 78% width/height: the base
       rule keeps a true circle only when the cell itself is roughly
       square. Once the mobile .chord-fret aspect-ratio above makes
       cells much taller than wide, 78% of each axis stops matching
       and the circle stretches into an oval. */
    .chord-fret--in-chord::before {
      width: 34px;
      height: 34px;
      max-width: 34px;
      max-height: 34px;
    }

    /* The wide "Tocar X completo" text button becomes a small square
       icon button — same footprint as the carousel's own nav chevrons
       — so it reads as a control, not a headline, and gives the
       fretboard back the vertical space it was taking. */
    .chord-fretboard__play-all {
      width: 2.25rem;
      height: 2.25rem;
      padding: 0;
    }
    .chord-fretboard__play-icon {
      display: block;
    }
    .chord-fretboard__play-label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
  }
`;
