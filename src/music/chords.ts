/**
 * Chords — the joropo harmonic circle (V7–I–IV) generated for all 12
 * tonos, for the bandola llanera.
 *
 * Mirrors `scales.ts`: a pure, immutable, SSR-safe data module. No DOM,
 * no audio, no Web Audio API, no runtime side effects at import time.
 *
 * Tuning: A3(57) – D4(62) – A4(69) – E5(76). Every voicing entry's
 * `midi` equals `openMidiFor(stringId) + fret`.
 *
 * GENERATION, NOT HARDCODING. The original 5 chords (A7, D, Dm, G, Gm)
 * were locked one at a time by playing them against the physical
 * instrument. Reverse-engineering those 5 voicings surfaces a fixed
 * "which string carries which chord tone" role assignment per
 * harmonic function (dominant7 / tonic / subdominant) that reproduces
 * every one of them exactly:
 *
 *   fret(string, root) = (root + roleInterval(function, string) - openPitchClass(string)) mod 12
 *
 * This is the same shape as `scales.ts`'s `(tonic_pc + interval) mod
 * 12` — just projected onto 4 fixed strings via a per-string role
 * instead of onto a single note. Every one of the 60 generated chords
 * below (12 dominant7 + 24 tonic + 24 subdominant, covering all 12
 * tonos × mayor/menor) is produced by this one formula, not typed in
 * by hand.
 *
 * KNOWN LIMITATION: this picks the single fret 0–11 the formula
 * yields per string independently — there is no "shift down an
 * octave" escape hatch on a fretted, non-capo instrument. For tonos
 * close to Re (the tonic/subdominant role keeps 3 of 4 strings within
 * ~2 frets of each other for EVERY key), the result is a compact,
 * playable open-position shape. For tonos further around the circle
 * of fifths the four frets can land far apart, which is
 * mathematically correct (right notes) but may not be the most
 * comfortable physical fingering. Exactly like the original 5 chords,
 * these are expected to be corrected key-by-key against the real
 * instrument as they get tested.
 */
import { KEY_DATA, ALL_KEYS_LIST, getKeyLetter, type Key } from "./scales";

/** The four bandola llanera strings, low to high. */
export type StringId = "A3" | "D4" | "A4" | "E5";

export interface ChordVoicingEntry {
  stringId: StringId;
  fret: number;
  midi: number;
}

/** The chord's function within the joropo V7–I–IV progression. */
export type ChordRole = "dominant7" | "tonic" | "subdominant";

export interface Chord {
  /** URL-safe kebab-case slug, e.g. "re-mayor". */
  id: string;
  /** Spanish label, e.g. "Re mayor". */
  name: string;
  /** Integer 0–11, semitone from C (0 = Do, 2 = Re, 7 = Sol, 9 = La). */
  rootPitchClass: number;
  /** Semitones from the root, e.g. [0, 4, 7] for major. */
  intervals: readonly number[];
  /** Which joropo progression step this voicing was built for. */
  role: ChordRole;
  /** The four-string bandola position — one entry per string. */
  voicing: readonly ChordVoicingEntry[];
}

export type CircleQuality = "mayor" | "menor";
export type CircleId = `joropo-${Key}-${CircleQuality}`;

export interface Circle {
  id: CircleId;
  label: string;
  tonoKey: Key;
  quality: CircleQuality;
  chords: readonly Chord[];
}

const STRING_ORDER: readonly StringId[] = ["A3", "D4", "A4", "E5"];
const OPEN_MIDI: Record<StringId, number> = { A3: 57, D4: 62, A4: 69, E5: 76 };

const MAJOR_THIRD = 4;
const MINOR_THIRD = 3;
const PERFECT_FIFTH = 7;
const MINOR_SEVENTH = 10;

/**
 * `roleIntervals` maps each string to the semitone offset from the
 * root it should carry. One fret per string, chosen as the lowest
 * non-negative solution (there is exactly one fret 0–11 that satisfies
 * `(openPitchClass + fret) mod 12 === (root + interval) mod 12`).
 */
function buildVoicing(
  rootPitchClass: number,
  roleIntervals: Record<StringId, number>,
): ChordVoicingEntry[] {
  return STRING_ORDER.map((stringId) => {
    const openPc = OPEN_MIDI[stringId] % 12;
    const interval = roleIntervals[stringId];
    const fret = (((rootPitchClass + interval - openPc) % 12) + 12) % 12;
    return { stringId, fret, midi: OPEN_MIDI[stringId] + fret };
  });
}

/**
 * Locked role assignment, reverse-engineered from Re mayor/menor
 * (A3=5th, D4=root, A4=5th, E5=3rd — doubling the 5th, matching a
 * standard open-position triad shape on this tuning).
 */
function tonicVoicing(rootPitchClass: number, thirdInterval: number) {
  return buildVoicing(rootPitchClass, {
    A3: PERFECT_FIFTH,
    D4: 0,
    A4: PERFECT_FIFTH,
    E5: thirdInterval,
  });
}

/**
 * Locked role assignment, reverse-engineered from Sol mayor/menor
 * (A3=3rd, D4=5th, A4=3rd, E5=root — doubling the 3rd).
 */
function subdominantVoicing(rootPitchClass: number, thirdInterval: number) {
  return buildVoicing(rootPitchClass, {
    A3: thirdInterval,
    D4: PERFECT_FIFTH,
    A4: thirdInterval,
    E5: 0,
  });
}

/**
 * Locked role assignment, reverse-engineered from La con séptima
 * (A3=root, D4=5th, A4=3rd, E5=♭7th). Dominant7 quality never changes
 * with the circle's mayor/menor mode — the raised leading tone is
 * shared by both.
 */
function dominant7Voicing(rootPitchClass: number) {
  return buildVoicing(rootPitchClass, {
    A3: 0,
    D4: PERFECT_FIFTH,
    A4: MAJOR_THIRD,
    E5: MINOR_SEVENTH,
  });
}

const QUALITIES: readonly CircleQuality[] = ["mayor", "menor"];

/** One dominant7 chord per tono — shared across a key's mayor/menor circles. */
export const DOMINANT7_CHORDS: readonly Chord[] = ALL_KEYS_LIST.map((key) => {
  const pc = KEY_DATA[key].pc;
  return {
    id: `${key}-con-septima`,
    // Letter-shorthand chord symbol (e.g. "A7"), matching the printed
    // bandola llanera chord-reference convention — not the Spanish
    // "La con séptima" phrasing used for the tonic/subdominant names.
    name: `${getKeyLetter(key)}7`,
    rootPitchClass: pc,
    intervals: [0, MAJOR_THIRD, PERFECT_FIFTH, MINOR_SEVENTH],
    role: "dominant7",
    voicing: dominant7Voicing(pc),
  };
});

function buildTriad(
  key: Key,
  quality: CircleQuality,
  role: "tonic" | "subdominant",
  idSuffix: string,
): Chord {
  const pc = KEY_DATA[key].pc;
  const thirdInterval = quality === "mayor" ? MAJOR_THIRD : MINOR_THIRD;
  const voicing =
    role === "tonic"
      ? tonicVoicing(pc, thirdInterval)
      : subdominantVoicing(pc, thirdInterval);
  return {
    id: `${key}-${quality}${idSuffix}`,
    // Letter-shorthand chord symbol (e.g. "D", "Dm"), matching the
    // printed bandola llanera chord-reference convention and the
    // dominant7 chords' own "A7"-style naming.
    name: quality === "mayor" ? getKeyLetter(key) : `${getKeyLetter(key)}m`,
    rootPitchClass: pc,
    intervals: [0, thirdInterval, PERFECT_FIFTH],
    role,
    voicing,
  };
}

/** Every key's chord, voiced with the tonic-shape role assignment. */
export const TONIC_CHORDS: readonly Chord[] = ALL_KEYS_LIST.flatMap((key) =>
  QUALITIES.map((quality) => buildTriad(key, quality, "tonic", "")),
);

/**
 * Every key's chord, voiced with the subdominant-shape role assignment
 * (id suffixed `-cuarta` — the SAME root+quality as a `TONIC_CHORDS`
 * entry can need a DIFFERENT voicing depending on which role it plays,
 * e.g. Sol mayor as IV-of-Re vs Sol mayor as I-of-Sol).
 */
export const SUBDOMINANT_CHORDS: readonly Chord[] = ALL_KEYS_LIST.flatMap(
  (key) => QUALITIES.map((quality) => buildTriad(key, quality, "subdominant", "-cuarta")),
);

const ALL_CHORDS: readonly Chord[] = [
  ...DOMINANT7_CHORDS,
  ...TONIC_CHORDS,
  ...SUBDOMINANT_CHORDS,
];

const chordById = new Map(ALL_CHORDS.map((c) => [c.id, c]));

/** Returns the chord matching `id` from any circle, or `undefined`. */
export function getChordById(id: string): Chord | undefined {
  return chordById.get(id);
}

function pcOfKey(key: Key): number {
  return KEY_DATA[key].pc;
}

function keyAtPc(pc: number): Key {
  return ALL_KEYS_LIST[((pc % 12) + 12) % 12];
}

function buildJoropoCircle(tonoKey: Key, quality: CircleQuality): Circle {
  const tonicPc = pcOfKey(tonoKey);
  const dominantKey = keyAtPc(tonicPc + PERFECT_FIFTH);
  const subdominantKey = keyAtPc(tonicPc + 5);

  const dominant7 = chordById.get(`${dominantKey}-con-septima`);
  const tonic = chordById.get(`${tonoKey}-${quality}`);
  const subdominant = chordById.get(`${subdominantKey}-${quality}-cuarta`);
  if (!dominant7 || !tonic || !subdominant) {
    throw new Error(`Unable to assemble joropo circle for ${tonoKey}-${quality}`);
  }

  return {
    id: `joropo-${tonoKey}-${quality}`,
    label: `Círculo de ${KEY_DATA[tonoKey].label} ${quality}`,
    tonoKey,
    quality,
    chords: [dominant7, tonic, subdominant],
  };
}

/** All 24 joropo circles (12 tonos × mayor/menor), in chromatic tono order. */
export const CIRCLES: readonly Circle[] = ALL_KEYS_LIST.flatMap((tonoKey) =>
  QUALITIES.map((quality) => buildJoropoCircle(tonoKey, quality)),
);

const circleById = new Map(CIRCLES.map((c) => [c.id, c]));

export function getCircleById(id: CircleId): Circle | undefined {
  return circleById.get(id);
}

/** Re mayor — the most common joropo tono, and the app's landing default. */
export const DEFAULT_CIRCLE_ID: CircleId = "joropo-re-mayor";
