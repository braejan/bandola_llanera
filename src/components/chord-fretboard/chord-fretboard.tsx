import {
  $,
  component$,
  useContext,
  useSignal,
  useStylesScoped$,
  useTask$,
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
 * Tab order is the OPPOSITE of Diapason's: button first, then
 * E5 -> A4 -> D4 -> A3, ascending fret within each string
 * (REQ-FRET-011) — Diapason's own "headstock first, frets 7->1" shape
 * does not apply here, so STRING_ORDER/FRET_COLUMNS are defined fresh
 * rather than imported.
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
 * toggling Mayor/Menor on `/acordes` remounts a fresh instance with a
 * fresh subscription instead of mutating this one in place. This is
 * the reason `useTask$` below can safely close over `chord.id` without
 * the `useComputed$` staleness guard Diapason needs (Diapason is never
 * remounted across scale switches; ChordFretboard is, by design).
 */

interface ChordFretboardProps {
  chord: Chord;
  onChordPlay?: QRL<() => void>;
}

// Render order top to bottom: E5 (top) -> A4 -> D4 -> A3 (bottom) —
// the REVERSE of Diapason's physical top-to-bottom order, per the
// locked REQ-FRET-011 tab order.
const STRING_ORDER: readonly StringId[] = ["E5", "A4", "D4", "A3"];

const FRET_COLUMNS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

const OPEN_MIDI: Record<StringId, number> = {
  A3: 57,
  D4: 62,
  A4: 69,
  E5: 76,
};

/** Generic per-pitch-class label (visible cell text), all 32 cells. */
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
 * LOCKED Spanish solfège names for the aria-label of PLAYABLE cells
 * (REQ-FRET-008). A closed lookup, not a generic enharmonic-spelling
 * algorithm: the 5 chord voicings only ever produce these 11 distinct
 * MIDI values, and the spec locks specific enharmonic spellings per
 * musical context (e.g. midi 70 is "Si bemol", not "La sostenido", in
 * Re menor) that a generic sharp-only table cannot represent.
 */
const NOTE_NAME_BY_MIDI: Readonly<Record<number, string>> = {
  57: "La",
  62: "Re",
  65: "Fa",
  67: "Sol",
  69: "La",
  70: "Si bemol",
  73: "Do sostenido",
  76: "Mi",
  77: "Fa",
  78: "Fa sostenido",
  79: "Sol",
};

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

export const ChordFretboard = component$<ChordFretboardProps>(
  ({ chord, onChordPlay }) => {
    useStylesScoped$(STYLES);

    const audioStatus = useContext(AudioStatusContext);
    const boardRef = useSignal<HTMLElement>();

    // Subscribe once on mount. Matches ANY event whose targetId starts
    // with this chord's own `chord-<id>-` prefix — covers BOTH the
    // per-cell click shape (`chord-<id>-<string>-<fret>`) and
    // playChord's index shape (`chord-<id>-<i>`), reconciling
    // REQ-PLAY-003 with REQ-FRET-005 (design's "Flash matching"
    // decision). Cleanup mirrors Diapason's `cleanup(off)` pattern —
    // no listener leak across remounts.
    useTask$(({ cleanup }) => {
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
    });

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
          {buttonLabel}
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
                  ].join(" ");
                  const label = playable
                    ? `Cuerda ${stringId}, traste ${fret}, nota ${
                        NOTE_NAME_BY_MIDI[midi] ?? ""
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

  .chord-fret--playing {
    animation: fret-pulse var(--motion-click) var(--ease-printed);
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
      font-size: 0.75rem;
    }
  }
`;
