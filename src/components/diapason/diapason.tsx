import { component$, useStylesScoped$ } from "@builder.io/qwik";
import type { Mode } from "../scale-switcher/scale-switcher";

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
 *   - Tonic (open A on strings A3 and A4, at fret 0 / the nut) is
 *     identified by position and the red circle — no extra cell marker.
 *   - No fingering numerals on the landing (removed per design).
 *
 * String order top to bottom: A3, D4, A4, E5 (conventional tablature
 * order, low to high).
 */

interface StringNote {
  name: string;
  midi: number;
  pc: number;
}

interface StringDef {
  open: string;
  midi: number;
  frets: StringNote[];
  rowClass: string;
}

// Render order top to bottom: A3 (top) → D4 → A4 → E5 (bottom).
const STRINGS: StringDef[] = (() => {
  const PC_NAMES = [
    "A", "A♯", "B", "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯",
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
    rowClass,
    frets: Array.from({ length: 8 }, (_, fret) => {
      const noteMidi = midi + fret;
      const pc = (noteMidi - 57 + 1200) % 12;
      return { name: PC_NAMES[pc], midi: noteMidi, pc };
    }),
  }));
})();

const TUNING_LABEL = "A3, D4, A4, E5";

const MODES: Record<Mode, number[]> = {
  mayor: [0, 2, 4, 5, 7, 9, 11],
  menor: [0, 2, 3, 5, 7, 8, 10],
  armonica: [0, 2, 3, 5, 7, 8, 11],
};

const MODE_LABEL: Record<Mode, string> = {
  mayor: "Mayor",
  menor: "Menor",
  armonica: "Armónica",
};

const MODE_SCALE_NAMES: Record<Mode, string[]> = {
  mayor: ["A", "B", "C♯", "D", "E", "F♯", "G♯"],
  menor: ["A", "B", "C", "D", "E", "F", "G"],
  armonica: ["A", "B", "C", "D", "E", "F", "G♯"],
};

const FRET_COLUMNS = [7, 6, 5, 4, 3, 2, 1, 0] as const;

interface DiapasonProps {
  mode: Mode;
}

export const Diapason = component$<DiapasonProps>(({ mode }) => {
  useStylesScoped$(STYLES);

  const scale = MODES[mode];
  const scaleNames = MODE_SCALE_NAMES[mode];
  const activeScaleLabel = scaleNames.join(" – ");
  const activeModeLabel = MODE_LABEL[mode];

  return (
    <figure
      class="diapason"
      aria-label={`Diapason de bandola llanera en escala ${activeModeLabel}: notas ${activeScaleLabel}. Afinación ${TUNING_LABEL}. Escala marcada con círculos rojos sobre las cuerdas.`}
      data-mode={mode}
    >
      <div class="diapason-frame">
        <div class="diapason-board" role="presentation">
          {STRINGS.map((s) => (
            <div
              class={`diapason-string ${s.rowClass}`}
              key={`str-${s.open}`}
            >
              {FRET_COLUMNS.map((fret) => {
                const note = s.frets[fret];
                const inScale = scale.includes(note.pc);
                const isTonic =
                  (s.open === "A3" || s.open === "A4") && fret === 0;
                const cls = [
                  "fret",
                  inScale ? "fret--in-scale" : "",
                  isTonic ? "fret--tonic" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <div class={cls} key={`fret-${s.open}-${fret}`}>
                    <span class="fret-note">{note.name}</span>
                  </div>
                );
              })}
              <div class="diapason-headstock-cell" key={`open-${s.open}`}>
                <span class="headstock-label">{s.open}</span>
              </div>
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
     A3 (top) — thick, strong metal bordón (ink).
     D4       — medium, a little smaller, metallic (ink).
     A4       — thin, nylon prima (ink-tint).
     E5       — thinnest, nylon prima (ink-tint). */
  .string-row--a3 {
    --string-thickness: 3.5px;
    --string-color: var(--color-ink);
  }
  .string-row--d4 {
    --string-thickness: 2.5px;
    --string-color: var(--color-ink);
  }
  .string-row--a4 {
    --string-thickness: 1.5px;
    --string-color: var(--color-ink-tint);
  }
  .string-row--e5 {
    --string-thickness: 1px;
    --string-color: var(--color-ink-tint);
  }

  /* The string line — the playable string, from the nut (right) to the
     body (left). Thickness and color come from the per-row custom
     properties, so each string simulates its real gauge and material.
     z-index 2 places it above the trastes and the cell backgrounds. */
  .diapason-string::after {
    content: "";
    position: absolute;
    left: 0;
    right: 40px;
    top: 50%;
    height: var(--string-thickness, 2px);
    background: var(--string-color, var(--color-ink));
    transform: translateY(-50%);
    z-index: 2;
    pointer-events: none;
  }

  /* Fret cell — a continuous paper interval between two trastes. No
     background fill, no individual cell border. The ONLY border is the
     right border on cells that are NOT the last fret cell — that
     right border is the traste (the metal fret bar) that separates
     this playing position from the next. Fret 0 has no right border
     because the nut (headstock's left border) is its right separator. */
  .fret {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 0.65;
    color: var(--color-ink-tint);
    background: transparent;
    border: 1px solid transparent;
    transition:
      background-color 320ms ease-out,
      border-color 320ms ease-out,
      color 320ms ease-out;
    min-width: 0;
  }

  /* Trastes — the 7 vertical metal fret bars, drawn as right borders on
     every fret cell except the last (fret 0, whose right separator is
     the nut on the headstock). */
  .diapason-string > .fret:not(:last-of-type) {
    border-right: 1.5px solid var(--color-ink);
  }

  .fret-note {
    position: relative;
    z-index: 4;
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
    z-index: 3;
    pointer-events: none;
    transition:
      background-color 320ms ease-out,
      border-color 320ms ease-out;
  }

  .fret--in-scale .fret-note {
    color: var(--color-paper);
  }

  /* Tonic: identified by position (fret 0, the open string at the nut)
     and the red circle. No extra cell marker — the nut + the circle
     carry the tonic semantic on a real instrument. */

  /* Headstock cell — the nut (left border) and the open-string label.
     No explicit background so the frame's paper shows through. */
  .diapason-headstock-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--color-ink);
    line-height: 1;
    border-left: 2px solid var(--color-ink);
    padding-left: 4px;
    background: transparent;
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
  }
`;
