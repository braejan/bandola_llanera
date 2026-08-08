import { component$, useStylesScoped$, $ } from "@builder.io/qwik";
import { playMidiNote } from "../../audio/play-midi-note";
import { getScaleById, type ScaleId } from "../../music/scales";

/**
 * ScaleReference — the linear, sequential view of the current scale.
 *
 * Complements the Diapason (which shows the scale on the physical
 * fretboard) with a row of 12 note buttons in chromatic order
 * (Do, Do#, Re, Re#, Mi, Fa, Fa#, Sol, Sol#, La, La#, Si). The
 * notes that belong to the current scale get the digitation-red
 * filled circle; the notes outside the scale are visible but
 * de-emphasized (paper knockout). The tonic of diatonic scales
 * gets a small "tónica" label.
 *
 * Each note is a real <button> — click it to play the synthesized
 * pitch. The audio uses the same additive pluck graph as the
 * Diapason (1 lazy AudioContext, 8-voice cap, 40 ms debounce).
 *
 * The component lives between the controls frame (key + mode
 * selectors) and the Diapason (physical fretboard) inside the
 * ScaleSwitcher. The two views together teach both the abstract
 * scale (here) and the physical fingering (Diapason).
 */

// Pitch-class array in chromatic order, starting at PC 0 (C).
// Used for the visual sequence. The solfège names are the
// student-facing labels in Spanish.
const CHROMATIC_PCS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// Solfège names in Spanish — the student-facing labels in the
// row of buttons. The sharps are rendered with the typographic
// sharp symbol (♯) for visual consistency with the diapason note
// labels and the design tokens.
const PC_NAMES_ES = [
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

// Base MIDI pitch for the chromatic scale view. C4 (midi 60) is
// the central C and gives a sensible one-octave chromatic range
// (C4 to B4) that sits comfortably within the bandola's tuning
// (A3 57 through E5 76).
const BASE_MIDI = 60;

interface ScaleReferenceProps {
  scaleId: ScaleId;
}

export const ScaleReference = component$<ScaleReferenceProps>(({ scaleId }) => {
  useStylesScoped$(STYLES);

  const scale = getScaleById(scaleId);
  // The tonic is the first pitch class of the scale, except for
  // the chromatic scale where the tonic concept doesn't apply.
  const tonicPc =
    scale.mode === "cromatica" ? null : scale.pitchClasses[0];

  const handleClick = $((midi: number, targetId: string) => {
    return playMidiNote(midi, { targetId });
  });

  return (
    <div
      class="scale-reference"
      role="group"
      aria-label="Vista lineal de la escala"
    >
      <p class="reference-label" aria-hidden="true">
        Vista de escala
      </p>
      <ol class="note-row">
        {CHROMATIC_PCS.map((pc) => {
          const midi = BASE_MIDI + pc;
          const inScale = scale.pitchClasses.includes(pc);
          const isTonic = tonicPc !== null && pc === tonicPc;
          const cls = [
            "note",
            inScale ? "note--in-scale" : "",
            isTonic ? "note--tonic" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <li class="note-cell" key={pc}>
              <button
                type="button"
                class={cls}
                data-midi={String(midi)}
                data-pc={String(pc)}
                data-in-scale={inScale ? "true" : "false"}
                data-tonic={isTonic ? "true" : "false"}
                aria-label={`${PC_NAMES_ES[pc]}, MIDI ${midi}${
                  inScale ? ", nota de la escala" : ""
                }${isTonic ? ", tónica" : ""}`}
                onClick$={() => handleClick(midi, `scale-ref-${pc}`)}
              >
                <span class="note-name">{PC_NAMES_ES[pc]}</span>
                {isTonic && (
                  <span class="tonic-marker" aria-hidden="true">
                    tónica
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
});

const STYLES = `
  .scale-reference {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--color-paper);
    border-left: var(--frame-border);
    border-right: var(--frame-border);
  }

  .reference-label {
    margin: 0;
    font-family: var(--font-body);
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-ink-tint);
  }

  .note-row {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: var(--space-2);
  }

  .note-cell {
    margin: 0;
    padding: 0;
  }

  .note {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: transparent;
    border: 1.5px solid transparent;
    color: var(--color-ink-tint);
    font-family: var(--font-body);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    position: relative;
    padding: 0;
    transition:
      background-color 200ms ease-out,
      color 200ms ease-out,
      border-color 200ms ease-out;
  }

  .note:hover,
  .note:focus-visible {
    background: var(--color-ink);
    color: var(--color-paper);
    border-color: var(--color-ink);
    outline: none;
  }

  /* Active scale note — same digitation red as the diapason's
     in-scale frets. The circle IS the in-scale signal. */
  .note--in-scale {
    background: var(--color-digitation);
    color: var(--color-paper);
    border-color: var(--color-ink);
  }

  .note--in-scale:hover,
  .note--in-scale:focus-visible {
    background: var(--color-ink);
    color: var(--color-paper);
    border-color: var(--color-ink);
  }

  /* Tonic — the first note of diatonic scales. A small "tónica"
     label sits below the note name so the student can identify
     the root at a glance. */
  .note--tonic .note-name {
    font-weight: 700;
  }

  .tonic-marker {
    position: absolute;
    bottom: -14px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.45rem;
    color: var(--color-ground);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 700;
    white-space: nowrap;
  }

  /* Non-scale note — paper knockout label. The note is still
     readable so the student can see the chromatic sequence, but
     the muted style says "this is outside the current scale". */
  .note:not(.note--in-scale) {
    color: var(--color-ink-tint);
    background: var(--color-paper);
    border-color: var(--color-paper);
  }

  @media (max-width: 640px) {
    .scale-reference {
      padding: var(--space-2) var(--space-2);
    }
    .note {
      width: 30px;
      height: 30px;
      font-size: 0.65rem;
    }
    .tonic-marker {
      font-size: 0.4rem;
      bottom: -10px;
    }
    .reference-label {
      font-size: 0.6rem;
    }
  }

  /* Reduced-motion: transitions off. */
  @media (prefers-reduced-motion: reduce) {
    .note {
      transition: none;
    }
  }
`;
