/**
 * Chords — the joropo D (Re) major/minor harmonic circles for the
 * bandola llanera.
 *
 * Mirrors `scales.ts`: a pure, immutable, SSR-safe data module. No DOM,
 * no audio, no Web Audio API, no runtime side effects at import time.
 *
 * Tuning: A3(57) – D4(62) – A4(69) – E5(76). Every voicing entry's
 * `midi` equals `openMidiFor(stringId) + fret` (REQ-DATA-008).
 *
 * Voicings are LOCKED (confirmed by the bandolista in spec review —
 * see REQ-DATA-003). `la-con-septima` (the dominant A7) is the exact
 * same `Chord` object in both circles — the dominant does not change
 * between the major and minor joropo progressions.
 */

/** The four bandola llanera strings, low to high. */
export type StringId = "A3" | "D4" | "A4" | "E5";

export interface ChordVoicingEntry {
  stringId: StringId;
  fret: number;
  midi: number;
}

export interface Chord {
  /** URL-safe kebab-case slug, e.g. "re-mayor". */
  id: string;
  /** Spanish label, e.g. "Re mayor". */
  name: string;
  /** Integer 0–11, semitone from C (0 = Do, 2 = Re, 7 = Sol, 9 = La). */
  rootPitchClass: number;
  /** Semitones from the root, e.g. [0, 4, 7] for major. */
  intervals: readonly number[];
  /** The four-string bandola position — one entry per string. */
  voicing: readonly ChordVoicingEntry[];
}

export type CircleId = "joropo-d-mayor" | "joropo-d-menor";

export interface Circle {
  id: CircleId;
  label: string;
  chords: readonly Chord[];
}

const RE_MAYOR: Chord = {
  id: "re-mayor",
  name: "Re mayor",
  rootPitchClass: 2,
  intervals: [0, 4, 7],
  voicing: [
    { stringId: "A3", fret: 0, midi: 57 },
    { stringId: "D4", fret: 0, midi: 62 },
    { stringId: "A4", fret: 0, midi: 69 },
    { stringId: "E5", fret: 2, midi: 78 },
  ],
};

/**
 * The dominant of both circles — a single shared object. Corrected full
 * A7 voicing (A3 fret 0, D4 fret 5, A4 fret 4, E5 fret 0), confirmed by
 * the bandolista: the original D4-fret-1 voicing was not physically
 * reachable at the intended pitch (see spec key learning #1).
 */
const LA_CON_SEPTIMA: Chord = {
  id: "la-con-septima",
  name: "La con séptima",
  rootPitchClass: 9,
  intervals: [0, 4, 7, 10],
  voicing: [
    { stringId: "A3", fret: 0, midi: 57 },
    { stringId: "D4", fret: 5, midi: 67 },
    { stringId: "A4", fret: 4, midi: 73 },
    { stringId: "E5", fret: 0, midi: 76 },
  ],
};

const SOL_MAYOR: Chord = {
  id: "sol-mayor",
  name: "Sol mayor",
  rootPitchClass: 7,
  intervals: [0, 4, 7],
  voicing: [
    { stringId: "A3", fret: 5, midi: 62 },
    { stringId: "D4", fret: 5, midi: 67 },
    { stringId: "A4", fret: 0, midi: 69 },
    { stringId: "E5", fret: 2, midi: 78 },
  ],
};

const RE_MENOR: Chord = {
  id: "re-menor",
  name: "Re menor",
  rootPitchClass: 2,
  intervals: [0, 3, 7],
  voicing: [
    { stringId: "A3", fret: 0, midi: 57 },
    { stringId: "D4", fret: 0, midi: 62 },
    { stringId: "A4", fret: 1, midi: 70 },
    { stringId: "E5", fret: 1, midi: 77 },
  ],
};

const SOL_MENOR: Chord = {
  id: "sol-menor",
  name: "Sol menor",
  rootPitchClass: 7,
  intervals: [0, 3, 7],
  voicing: [
    { stringId: "A3", fret: 0, midi: 57 },
    { stringId: "D4", fret: 3, midi: 65 },
    { stringId: "A4", fret: 0, midi: 69 },
    { stringId: "E5", fret: 3, midi: 79 },
  ],
};

export const JOROPO_D_MAJOR: readonly Chord[] = [
  RE_MAYOR,
  LA_CON_SEPTIMA,
  SOL_MAYOR,
];

export const JOROPO_D_MINOR: readonly Chord[] = [
  RE_MENOR,
  LA_CON_SEPTIMA,
  SOL_MENOR,
];

export const JOROPO_D_MAJOR_CIRCLE: Circle = {
  id: "joropo-d-mayor",
  label: "Círculo de Re mayor",
  chords: JOROPO_D_MAJOR,
};

export const JOROPO_D_MINOR_CIRCLE: Circle = {
  id: "joropo-d-menor",
  label: "Círculo de Re menor",
  chords: JOROPO_D_MINOR,
};

export const CIRCLES: readonly Circle[] = [
  JOROPO_D_MAJOR_CIRCLE,
  JOROPO_D_MINOR_CIRCLE,
];

const ALL_CHORDS: readonly Chord[] = [
  RE_MAYOR,
  LA_CON_SEPTIMA,
  SOL_MAYOR,
  RE_MENOR,
  SOL_MENOR,
];

/** Returns the chord matching `id` from any circle, or `undefined`. */
export function getChordById(id: string): Chord | undefined {
  return ALL_CHORDS.find((c) => c.id === id);
}
