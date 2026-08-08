import { component$, useContext, useStylesScoped$, $ } from "@builder.io/qwik";
import { playMidiNote } from "../../audio/play-midi-note";
import { AudioStatusContext } from "../../audio/audio-status-context";
import {
  getScaleById,
  isScaleInScale,
  type ScaleId,
} from "../../music/scales";

/**
 * Diapason — the interactive fretboard of the bandola llanera.
 *
 * Tuning: A3, D4, A4, E5 (canonical, La-Re-La-Mi).
 *
 * Rendered as a REAL instrument neck, not a grid of boxed cells:
 *   - Continuous paper fretboard surface, no rectangular cell boundaries.
 *   - The trastes (frets) are the vertical separators: thin ink lines at
 *     the boundaries between fret positions, drawn as the right borders
 *     of the fret cells. The nut is the left border of the headstock.
 *   - The four strings are drawn as horizontal lines with REAL-SIZE
 *     thickness and material color:
 *       A3 (top)    — 3.5px, ink        — the strong metal bordón
 *       D4          — 2.5px, ink        — the second, a little smaller, metallic
 *       A4          — 1.5px, ink-tint   — nylon prima
 *       E5 (bottom) — 1px,   ink-tint   — thinnest nylon prima
 *   - In-scale notes are marked by red digitation circles sitting on the
 *     string at the fret intersection. The note name (paper color) sits
 *     centered on the circle.
 *   - Non-scale notes are paper-knockout labels on the string (ink-tint
 *     text) so the string line does not cross the letter.
 *   - Open strings (fret 0, at the nut) are identified by a hollow
 *     digitation-red ring spanning the full string width. When the open
 *     string produces a tone in the current scale, a small "abierta"
 *     marker is shown as the "preferred" fingering indicator. The
 *     fretted equivalent on a different string (e.g. A3 fret 5 = D4
 *     open in Re mayor) shows a small "(=abierta)" label so the player
 *     knows the open string is the alternative.
 *   - Tonic (the open string that is also the root of the scale) is
 *     identified by position and the red circle — no extra cell marker.
 *
 * String order top to bottom: A3, D4, A4, E5 (conventional tablature
 * order, low to high).
 *
 * The Diapason no longer owns the mode/key selection — that lives in
 * the ScaleSwitcher. The Diapason receives a `scaleId` (e.g.
 * "re-mayor") and reads the scale's pitch classes from the music
 * module.
 */

interface StringNote {
  name: string;
  midi: number;
  pc: number;
}

interface StringDef {
  open: string;
  midi: number;
  pc: number;
  frets: StringNote[];
  rowClass: string;
}

// Render order top to bottom: A3 (top) → D4 → A4 → E5 (bottom).
const STRINGS: StringDef[] = (() => {
  // PC_NAMES is indexed by midi % 12, with the standard MIDI convention
  // C = 0. So midi 60 (C4) → PC 0 → "C", midi 69 (A4) → PC 9 → "A",
  // midi 59 → PC 11 → "B". The previous version had A at index 0 and
  // C at index 3, which produced wrong note names (e.g. midi 59
  // rendered as G♯ instead of B).
  const PC_NAMES = [
    "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B",
  ];
  const opens: Array<{
    open: string;
    midi: number;
    rowClass: string;
  }> = [
    { open: "A3", midi: 57, rowClass: "string-row--a3" },
    { open: "D4", midi: 62, rowClass: "string-row--d4" },
    { open: "A4", midi: 69, rowClass: "string-row--a4" },
    { open: "E5", midi: 76, rowClass: "string-row--e5" },
  ];
  return opens.map(({ open, midi, rowClass }) => ({
    open,
    midi,
    pc: midi % 12,
    rowClass,
    frets: Array.from({ length: 8 }, (_, fret) => {
      const noteMidi = midi + fret;
      const pc = noteMidi % 12;
      return { name: PC_NAMES[pc], midi: noteMidi, pc };
    }),
  }));
})();

const TUNING_LABEL = "A3, D4, A4, E5";

const FRET_COLUMNS = [7, 6, 5, 4, 3, 2, 1, 0] as const;

interface DiapasonProps {
  scaleId: ScaleId;
}

/**
 * Returns the open-string label (e.g. "D4") that shares the same MIDI
 * pitch as the given fretted note, or null if no open string matches.
 * Used to render the "=abierta" alternative label on a fretted cell
 * when the same pitch is also available as an open string.
 */
function findOpenStringAtPitch(midi: number): string | null {
  for (const s of STRINGS) {
    if (s.midi === midi) return s.open;
  }
  return null;
}

export const Diapason = component$<DiapasonProps>(({ scaleId }) => {
  useStylesScoped$(STYLES);

  const scale = getScaleById(scaleId);

  // The audio-status signal is provided by the ScaleSwitcher. We use
  // it to forward the audio module's onStatus callback (rejected
  // context, etc.) to the visible <p role="status"> in the controls
  // frame (WARNING-4).
  const audioStatus = useContext(AudioStatusContext);

  /**
   * Play the note for the clicked fret/open cell. The `data-midi`,
   * `data-string`, and `data-fret` attributes encode the target. We
   * route through `playMidiNote` so the audio module keeps its 40 ms
   * same-target debounce, 8-voice cap, and the await ctx.resume()
   * contract — so the note schedules only after the AudioContext is
   * running (spec scenario S3.5).
   */
  const handlePlay = $(async (_event: Event, el: HTMLElement) => {
    const midi = Number(el.dataset.midi);
    const stringId = el.dataset.string ?? "";
    const fret = el.dataset.fret ?? "";
    if (Number.isFinite(midi)) {
      await playMidiNote(midi, {
        targetId: `${stringId}-${fret}`,
        onStatus: (msg) => {
          audioStatus.value = msg;
        },
      });
    }
  });

  return (
    <figure
      class="diapason"
      aria-label={`Diapason de bandola llanera en escala ${scale.label}. Afinación ${TUNING_LABEL}. Escala marcada con círculos rojos sobre las cuerdas.`}
      data-scale={scaleId}
    >
      <div class="diapason-frame">
        <div class="diapason-board" role="presentation">
          {STRINGS.map((s) => (
            <div
              class={`diapason-string ${s.rowClass}`}
              key={`str-${s.open}`}
            >
              {/*
                DOM order: headstock first so the open-string target is
                the first keyboard-focusable cell in each row, matching
                the spec's tab order (S6.1). CSS `order: 1` on the
                headstock keeps it visually on the right, so the printed
                fretboard still reads left-to-right with the cejilla
                against the nut.
              */}
              <button
                type="button"
                class={[
                  "diapason-headstock-cell fret fret--open",
                  isScaleInScale(scale, s.pc) ? "fret--preferred" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={`open-${s.open}`}
                data-midi={String(s.midi)}
                data-string={s.open}
                data-fret="0"
                data-preferred={isScaleInScale(scale, s.pc) ? "true" : "false"}
                aria-label={`Cuerda abierta ${s.open}, MIDI ${s.midi}${
                  isScaleInScale(scale, s.pc) ? ", nota de la escala" : ""
                }`}
                onClick$={handlePlay}
              >
                <span class="headstock-label">{s.open}</span>
                {isScaleInScale(scale, s.pc) && (
                  <span class="open-marker" aria-hidden="true">
                    abierta
                  </span>
                )}
              </button>
              {FRET_COLUMNS.map((fret) => {
                const note = s.frets[fret];
                const inScale = isScaleInScale(scale, note.pc);
                const openString = findOpenStringAtPitch(note.midi);
                const hasOpenAlternative =
                  inScale && openString !== null && fret !== 0;
                const cls = [
                  "fret",
                  inScale ? "fret--in-scale" : "",
                  hasOpenAlternative ? "fret--has-open" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                const ariaLabel = `Nota ${note.name}, MIDI ${note.midi}, ${s.open}, traste ${fret}${
                  hasOpenAlternative
                    ? `, alternativa cuerda abierta ${openString}`
                    : ""
                }`;
                return (
                  <button
                    type="button"
                    class={cls}
                    key={`fret-${s.open}-${fret}`}
                    data-midi={String(note.midi)}
                    data-string={s.open}
                    data-fret={String(fret)}
                    data-preferred={hasOpenAlternative ? "true" : "false"}
                    aria-label={ariaLabel}
                    onClick$={handlePlay}
                  >
                    <span class="fret-note">{note.name}</span>
                    {hasOpenAlternative && (
                      <span class="fret-alternative" aria-hidden="true">
                        ({openString})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div class="diapason-fret-header" aria-hidden="true">
          {FRET_COLUMNS.map((fret) => (
            <div class="diapason-fret-num" key={`fnum-${fret}`}>
              {fret}
            </div>
          ))}
          <div class="diapason-fret-num-spacer" />
        </div>
      </div>
    </figure>
  );
});

const STYLES = `
  .diapason {
    margin: 0;
    width: 100%;
    color: var(--color-ink);
    font-family: var(--font-body);
  }

  .diapason-frame {
    border: var(--frame-border);
    padding: 6px;
    background: var(--color-paper);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .diapason-board {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .diapason-string {
    display: grid;
    grid-template-columns: repeat(8, 1fr) 40px;
    gap: 2px;
    align-items: center;
    position: relative;
  }

  /* Per-string real-size simulation: thickness and material color.
     A3 (top) — thick metal bordón (silver/chrome gradient).
     D4       — medium metal bordón (silver/chrome gradient).
     A4       — medium nylon prima (solid ink, more weight than E5).
     E5       — thinnest nylon prima (solid ink, lighter than A4).
     The metal strings use a multi-stop linear gradient to simulate
     the cylindrical reflection of a wound metal wire (light top,
     dark middle, lighter band, dark bottom). The nylon strings are
     a solid ink with no gradient. A4 (1.8px) is thicker than E5
     (1.2px) so the second prima reads with more weight than the
     thinnest prima. */
  .string-row--a3 {
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
  .string-row--d4 {
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
  .string-row--a4 {
    --string-thickness: 1.8px;
    --string-color: var(--color-ink);
  }
  .string-row--e5 {
    --string-thickness: 1.2px;
    --string-color: var(--color-ink);
  }

  /* The string line — the playable string, from the nut (right) to the
     body (left). Thickness and color come from the per-row custom
     properties, so each string simulates its real gauge and material.

     Z-index hierarchy (bottom to top, per the user's spec):
       0 — string line     (this rule)
       1 — fret cell       (.fret)
       2 — digitation ring (.fret--in-scale::before)
       3 — fret note text  (.fret-note)
       4 — alternative     (.fret-alternative)

     The string sits UNDER the cell and the text, so the labels and
     circles read on top of the wire, not behind it. */
  .diapason-string::after {
    content: "";
    position: absolute;
    left: 0;
    right: 40px;
    top: 50%;
    height: var(--string-thickness, 2px);
    background: var(--string-color, var(--color-ink));
    transform: translateY(-50%);
    z-index: 0;
    pointer-events: none;
  }

  /* Fret cell — a continuous paper interval between two trastes. No
     background fill, no individual cell border. The ONLY border is the
     right border on cells that are NOT the last fret cell — that
     right border is the traste (the metal fret bar) that separates
     this playing position from the next. Fret 0 has no right border
     because the nut (headstock's left border) is its right separator.
     The base element is a <button> so it is keyboard-activatable; the
     border is reset so the printed-frame grid stays intact.

     z-index 1 places the cell above the string line (z 0) so the
     text and the digitation ring read on top of the wire. */
  .fret {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 0.65;
    color: var(--color-ink-tint);
    background: transparent;
    border: 1px solid transparent;
    padding: 0;
    font: inherit;
    cursor: pointer;
    transition:
      background-color 320ms ease-out,
      border-color 320ms ease-out,
      color 320ms ease-out;
    min-width: 0;
    gap: 1px;
    z-index: 1;
  }

  /* Fret 0 (open string) — a hollow digitation-red ring at the nut.
     The cell is taller than the string thickness (24px min-height)
     so the headstock label ("A3", "D4", etc.) and the "abierta"
     marker fit cleanly inside the ring without overflowing. The
     label and marker stack vertically (column flex). */
  .fret--open {
    border: 2px solid var(--color-digitation);
    background: transparent;
    height: auto;
    min-height: 24px;
    padding: 3px 2px;
    color: var(--color-ink);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    aspect-ratio: auto;
  }

  /* When the open string is in the current scale, the ring becomes
     the "preferred" fingering. We keep the hollow ring but add a
     subtle background tint and a small "abierta" text label below
     the headstock name. */
  .fret--preferred {
    background: rgba(192, 57, 43, 0.08);
  }
  .open-marker {
    position: relative;
    z-index: 3;
    font-size: 0.5rem;
    color: var(--color-digitation);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-weight: 700;
    line-height: 1;
  }
  .headstock-label {
    position: relative;
    z-index: 3;
    text-transform: uppercase;
    line-height: 1;
  }

  /* Trastes — the 7 vertical metal fret bars, drawn as right borders on
     every fret cell except the last (fret 0, whose right separator is
     the nut on the headstock). */
  .diapason-string > .fret:not(:last-of-type) {
    border-right: 1.5px solid var(--color-ink);
  }

  .fret-note {
    position: relative;
    z-index: 3;
    font-size: var(--fs-note);
    font-weight: 600;
    line-height: 1;
  }

  /* Non-scale notes: a small paper knockout behind the text so the
     string line does not cross the letter. The knockout is the same
     color as the frame, so the note reads as a label on the string. */
  .fret:not(.fret--in-scale) .fret-note {
    background: var(--color-paper);
    padding: 0 3px;
    color: var(--color-ink-tint);
  }

  /* In-scale: the red digitation circle on the string (the scale
     marker). No cell background — the circle IS the in-scale signal. */
  .fret--in-scale {
    color: var(--color-paper);
  }

  .fret--in-scale::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 78%;
    height: 78%;
    max-width: 30px;
    max-height: 30px;
    transform: translate(-50%, -50%);
    background: var(--color-digitation);
    border: 1.5px solid var(--color-ink);
    border-radius: 50%;
    z-index: 2;
    pointer-events: none;
    transition:
      background-color 320ms ease-out,
      border-color 320ms ease-out;
  }

  .fret--in-scale .fret-note {
    color: var(--color-paper);
  }

  /* When a fretted note has the same pitch as an open string that's
     also in the scale, show a small "(=D4)" label below the note name.
     The visual cue nudges the player to prefer the open string. */
  .fret-alternative {
    position: relative;
    z-index: 4;
    font-size: 0.5rem;
    color: var(--color-ink-tint);
    background: var(--color-paper);
    padding: 0 2px;
    font-weight: 500;
  }

  /* Tonic: identified by position (fret 0, the open string at the nut)
     and the red circle. No extra cell marker — the nut + the circle
     carry the tonic semantic on a real instrument. */

  /* Headstock cell — the nut (left border) and the open-string button.
     Renders as a hollow digitation-red ring spanning the full string
     width at the nut. The activation marker is the ring itself; the
     string label sits centered on the string.

     DOM order: FIRST in each row (so the open-string target is the
     first keyboard-focusable cell of the row, matching spec S6.1).
     Visual order: LAST in each row (so the printed fretboard reads
     left-to-right with the cejilla on the right). The CSS order
     property fires the visual reorder without touching the DOM. */
  .diapason-headstock-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--color-ink);
    line-height: 1;
    border: 2px solid var(--color-digitation);
    background: transparent;
    padding: 0 4px;
    height: var(--string-thickness, 2px);
    cursor: pointer;
    font: inherit;
    order: 1;
  }

  .headstock-label {
    text-transform: uppercase;
  }

  /* Fret-number ruler — a thin reference line BELOW the neck. */
  .diapason-fret-header {
    display: grid;
    grid-template-columns: repeat(8, 1fr) 40px;
    gap: 2px;
    border-top: 1px solid var(--color-ink);
    padding-top: 3px;
  }

  .diapason-fret-num {
    text-align: center;
    font-size: 0.625rem;
    color: var(--color-ink-tint);
    font-weight: 500;
    letter-spacing: 0.05em;
    line-height: 1;
  }

  .diapason-fret-num-spacer {
  }

  @media (prefers-reduced-motion: reduce) {
    .fret,
    .fret--in-scale::before {
      transition: none;
    }
  }

  @media (max-width: 640px) {
    .diapason-frame {
      padding: 4px;
    }
    .diapason-string,
    .diapason-fret-header {
      grid-template-columns: repeat(8, 1fr) 28px;
    }
    .fret {
      aspect-ratio: 1 / 0.85;
    }
    .diapason-headstock-cell {
      font-size: 0.6rem;
      padding-left: 2px;
    }
    .diapason-string::after {
      right: 28px;
    }
    .fret-alternative {
      font-size: 0.45rem;
    }
  }
`;
