/**
 * Scales — pitch-class sets for the bandola llanera.
 *
 * Each scale is defined by:
 *   - a tonic key (Do, Re, Mi, Fa, Sol, La, Si — the 7 natural notes)
 *   - a mode (Mayor, Menor, Armónica — major, natural minor, harmonic minor)
 *
 * The pitch classes are calculated as (tonic_pc + interval) mod 12.
 * The diapason uses these to mark which frets are in the current scale
 * and which open strings are "preferred" fingerings.
 *
 * Defaults: Re mayor (D major), the most common scale in joropo.
 */
export type Key =
  | "do"
  | "do#"
  | "re"
  | "re#"
  | "mi"
  | "fa"
  | "fa#"
  | "sol"
  | "sol#"
  | "la"
  | "la#"
  | "si";
export type Mode = "mayor" | "menor" | "armonica" | "cromatica";
export type ScaleId = `${Key}-${Mode}`;

export interface Scale {
  id: ScaleId;
  key: Key;
  mode: Mode;
  /** Pitch classes 0..11 that belong to this scale, in order from the tonic. */
  pitchClasses: number[];
  /** Human-readable label in Spanish, e.g. "Re mayor". */
  label: string;
}

export const KEY_DATA: Record<Key, { pc: number; label: string }> = {
  do: { pc: 0, label: "Do" },
  "do#": { pc: 1, label: "Do♯" },
  re: { pc: 2, label: "Re" },
  "re#": { pc: 3, label: "Re♯" },
  mi: { pc: 4, label: "Mi" },
  fa: { pc: 5, label: "Fa" },
  "fa#": { pc: 6, label: "Fa♯" },
  sol: { pc: 7, label: "Sol" },
  "sol#": { pc: 8, label: "Sol♯" },
  la: { pc: 9, label: "La" },
  "la#": { pc: 10, label: "La♯" },
  si: { pc: 11, label: "Si" },
};

/**
 * Conventional international letter names (A–G, sharps only), matching
 * how printed chord references (e.g. Alejo Cordero's bandola llanera
 * charts) label roots — distinct from the Spanish solfège used
 * everywhere else in this app's copy. Used only for the big single-
 * letter tono indicator on `/joropo`.
 */
export const KEY_LETTER: Record<Key, string> = {
  do: "C",
  "do#": "C♯",
  re: "D",
  "re#": "D♯",
  mi: "E",
  fa: "F",
  "fa#": "F♯",
  sol: "G",
  "sol#": "G♯",
  la: "A",
  "la#": "A♯",
  si: "B",
};

export function getKeyLetter(key: Key): string {
  return KEY_LETTER[key];
}

const MODE_INTERVALS: Record<Mode, number[]> = {
  mayor: [0, 2, 4, 5, 7, 9, 11],
  menor: [0, 2, 3, 5, 7, 8, 10],
  armonica: [0, 2, 3, 5, 7, 8, 11],
  // The chromatic scale covers all 12 semitones of the octave. The
  // tonic is still the first interval (0) so the scale reads "C
  // cromática", "D♯ cromática", etc. — but since every PC is
  // included, the actual pitch-class set is identical for every key
  // (0..11). The label still names the key so the player can read the
  // absolute pitch of any note from the standard MIDI mapping.
  cromatica: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

const MODE_LABEL: Record<Mode, string> = {
  mayor: "mayor",
  menor: "menor",
  armonica: "armónica",
  cromatica: "cromática",
};

// All 12 keys in strict chromatic order — the same sequence the
// student sees in the linear scale reference (Do, Do♯, Re, Re♯,
// Mi, Fa, Fa♯, Sol, Sol♯, La, La♯, Si). The visual order in the
// key selector matches the order the user reads.
const ALL_KEYS: Key[] = [
  "do",
  "do#",
  "re",
  "re#",
  "mi",
  "fa",
  "fa#",
  "sol",
  "sol#",
  "la",
  "la#",
  "si",
];
const ALL_MODES: Mode[] = ["mayor", "menor", "armonica", "cromatica"];

export const SCALES: Scale[] = ALL_KEYS.flatMap((key) =>
  ALL_MODES.map((mode) => ({
    id: `${key}-${mode}` as ScaleId,
    key,
    mode,
    pitchClasses: MODE_INTERVALS[mode].map(
      (i) => (KEY_DATA[key].pc + i) % 12,
    ),
    label: `${KEY_DATA[key].label} ${MODE_LABEL[mode]}`,
  })),
);

export const DEFAULT_SCALE_ID: ScaleId = "re-mayor";

export function getScaleById(id: ScaleId): Scale {
  const scale = SCALES.find((s) => s.id === id);
  if (!scale) throw new Error(`Unknown scale id: ${id}`);
  return scale;
}

export function getKeyLabel(key: Key): string {
  return KEY_DATA[key].label;
}

export function getModeLabel(mode: Mode): string {
  return MODE_LABEL[mode];
}

export function isScaleInScale(
  scale: Scale,
  pitchClass: number,
): boolean {
  return scale.pitchClasses.includes(pitchClass);
}

export const ALL_KEYS_LIST = ALL_KEYS;
export const ALL_MODES_LIST = ALL_MODES;
