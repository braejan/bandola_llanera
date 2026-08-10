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
import { KEY_DATA, ALL_KEYS_LIST, KEY_LETTER, getKeyLetter, type Key } from "./scales";

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

/**
 * The single source of truth for "what pitch class is note letter X":
 * derived from `scales.ts`'s own `KEY_LETTER` table (sharps only, no
 * flats — e.g. "C#", never "Db") rather than a second hand-typed copy.
 * Keyed by ASCII "#" — `KEY_LETTER` itself spells sharps as "♯", but
 * every call site here writes plain "#", so lookups normalize to it.
 */
const LETTER_TO_PC: ReadonlyMap<string, number> = new Map(
  ALL_KEYS_LIST.map((key) => [KEY_LETTER[key].replace("♯", "#"), KEY_DATA[key].pc]),
);

/** Lowest fret (0–11) at which `note` sounds on `stringId`. */
function fretForNote(stringId: StringId, note: string): number {
  const notePc = LETTER_TO_PC.get(note);
  if (notePc === undefined) {
    throw new Error(`Unknown note letter: ${note}`);
  }
  const openPc = OPEN_MIDI[stringId] % 12;
  return ((notePc - openPc) % 12 + 12) % 12;
}

/**
 * Builds one verified voicing entry FROM ITS NOTE LETTER — the fret and
 * midi are derived, never hand-typed, so a chord's stated note (e.g.
 * "C on A3") and its stored fret can never silently disagree the way a
 * hand-computed fret number could. This is how `VOICING_OVERRIDES`
 * below should read: string-by-string, exactly as the notes are
 * confirmed against the physical instrument.
 */
function at(stringId: StringId, note: string): ChordVoicingEntry {
  const fret = fretForNote(stringId, note);
  return { stringId, fret, midi: OPEN_MIDI[stringId] + fret };
}

/**
 * Manually verified voicings that override the generated formula.
 * Confirmed against the physical instrument one chord at a time — see
 * the KNOWN LIMITATION note above: the formula's single fixed
 * role-per-string shape doesn't generalize across every tono, so
 * verified chords are locked here as they're tested.
 *
 * Two independent key shapes share this one map:
 *  - Dominant7 chords are keyed by the full chord id
 *    (`${key}-con-septima`) — each tono has exactly one dominant7, no
 *    role ambiguity.
 *  - Triads (mayor/menor) are keyed by `${key}-${quality}` ONLY, with
 *    NO role suffix. A confirmed triad has exactly one physical shape
 *    on this instrument, independent of which harmonic function
 *    borrows it — e.g. La mayor is fretted identically whether it's
 *    the I of the La circle or the IV of the Mi circle. `buildTriad`
 *    looks this same key up for both the tonic and subdominant builds,
 *    so there is never a second, independently-typed copy of a
 *    chord's fret numbers to drift out of sync.
 */
const VOICING_OVERRIDES: Partial<Record<string, readonly ChordVoicingEntry[]>> =
  {
    // Dominant7 — one voicing per tono.
    "sol-con-septima": [at("A3", "B"), at("D4", "F"), at("A4", "D"), at("E5", "G")],
    "sol#-con-septima": [at("A3", "C"), at("D4", "F#"), at("A4", "D#"), at("E5", "G#")],
    "do-con-septima": [at("A3", "C"), at("D4", "E"), at("A4", "A#"), at("E5", "G")],
    "do#-con-septima": [at("A3", "C#"), at("D4", "F"), at("A4", "B"), at("E5", "G#")],
    // D's own dominant7 — a different string-role pattern than the
    // locked dominant7Voicing formula (which fits La con séptima):
    // here A3 carries the 5th, D4 the open root, A4 the ♭7th, and E5
    // the 3rd, giving an open-position 0/0/3/2 shape instead of the
    // formula's unplayable 5/7/9/8 spread.
    "re-con-septima": [at("A3", "A"), at("D4", "D"), at("A4", "C"), at("E5", "F#")],
    "re#-con-septima": [at("A3", "A#"), at("D4", "D#"), at("A4", "C#"), at("E5", "G")],
    "mi-con-septima": [at("A3", "B"), at("D4", "E"), at("A4", "D"), at("E5", "G#")],
    "fa-con-septima": [at("A3", "A"), at("D4", "D#"), at("A4", "C"), at("E5", "F")],
    "si-con-septima": [at("A3", "B"), at("D4", "D#"), at("A4", "A"), at("E5", "F#")],
    // F#'s own dominant7 — the raw dominant7Voicing formula lands on an
    // unplayable fret9/11/1/0 spread; this is the confirmed shape.
    "fa#-con-septima": [at("A3", "C#"), at("D4", "F#"), at("A4", "A#"), at("E5", "E")],

    // Triads — one physical shape per key+quality, shared by the tonic
    // and subdominant roles wherever that chord appears.
    //
    // D's own tonic (and Dm) — this is exactly what tonicVoicing()
    // already produces (D was one of the 5 originally-confirmed
    // chords the formula itself was reverse-engineered from), locked
    // here explicitly so the subdominant role (D as IV of La) shares
    // it instead of independently falling back to subdominantVoicing(),
    // which computes an unplayable fret9/7/9/10 spread.
    "re-mayor": [at("A3", "A"), at("D4", "D"), at("A4", "A"), at("E5", "F#")],
    "re-menor": [at("A3", "A"), at("D4", "D"), at("A4", "A"), at("E5", "F")],
    "do-mayor": [at("A3", "C"), at("D4", "E"), at("A4", "C"), at("E5", "G")],
    "do-menor": [at("A3", "C"), at("D4", "D#"), at("A4", "C"), at("E5", "G")],
    "fa-mayor": [at("A3", "C"), at("D4", "F"), at("A4", "A"), at("E5", "F")],
    "fa-menor": [at("A3", "C"), at("D4", "F"), at("A4", "C"), at("E5", "G#")],
    "do#-mayor": [at("A3", "C#"), at("D4", "F"), at("A4", "C#"), at("E5", "G#")],
    "do#-menor": [at("A3", "C#"), at("D4", "E"), at("A4", "C#"), at("E5", "G#")],
    "fa#-mayor": [at("A3", "C#"), at("D4", "F#"), at("A4", "A#"), at("E5", "F#")],
    "fa#-menor": [at("A3", "C#"), at("D4", "F#"), at("A4", "A"), at("E5", "F#")],
    // G's own tonic — the raw tonic formula gives an unplayable fret5/7
    // spread; the real shape is this one, matching what the raw
    // subdominant formula already produced for Sol-as-IV-of-Re.
    "sol-mayor": [at("A3", "B"), at("D4", "D"), at("A4", "B"), at("E5", "G")],
    "sol-menor": [at("A3", "A#"), at("D4", "D"), at("A4", "A#"), at("E5", "G")],
    "sol#-mayor": [at("A3", "C"), at("D4", "D#"), at("A4", "C"), at("E5", "G#")],
    "sol#-menor": [at("A3", "B"), at("D4", "D#"), at("A4", "B"), at("E5", "G#")],
    // A's own tonic — A3 is tuned to A, so the root rings open here
    // instead of the raw tonic formula's fret7/7/7/9 barre.
    "la-mayor": [at("A3", "A"), at("D4", "E"), at("A4", "C#"), at("E5", "A")],
    // Same reasoning as la-mayor: A3 rings the open root instead of
    // the raw formula's fretted 3rd.
    "la-menor": [at("A3", "A"), at("D4", "E"), at("A4", "C"), at("E5", "A")],
    "la#-mayor": [at("A3", "A#"), at("D4", "D"), at("A4", "A#"), at("E5", "F")],
    // A#'s own minor tonic — A3 rings the open-position root at fret 1
    // and E5 the 5th at fret 1, same as la#-mayor; D4/A4 already
    // matched the raw subdominant formula's Fa/Do# and needed no change.
    "la#-menor": [at("A3", "A#"), at("D4", "F"), at("A4", "C#"), at("E5", "F")],
    // D#'s own tonic — this is what the raw tonic formula already
    // produces by coincidence; locked here explicitly so it no longer
    // depends on that coincidence once shared with the subdominant role.
    "re#-mayor": [at("A3", "A#"), at("D4", "D#"), at("A4", "A#"), at("E5", "G")],
    // D#m — same reasoning: the tonic formula already lands on the
    // right shape, locked here so the subdominant role (D#m as IV of
    // La# menor) shares it instead of the raw formula's fret9/8/9/11.
    "re#-menor": [at("A3", "A#"), at("D4", "D#"), at("A4", "A#"), at("E5", "F#")],
    "si-mayor": [at("A3", "B"), at("D4", "D#"), at("A4", "B"), at("E5", "F#")],
    "si-menor": [at("A3", "B"), at("D4", "D"), at("A4", "B"), at("E5", "F#")],
    // E's own tonic — this is what the raw tonic formula already
    // produces (same doubled-5th shape as D/D#); locked here explicitly
    // so the subdominant role (E as IV of Si) shares it instead of the
    // raw formula's unplayable fret11/9/11/0 spread.
    "mi-mayor": [at("A3", "B"), at("D4", "E"), at("A4", "B"), at("E5", "G#")],
    // Em — same reasoning as mi-mayor: locked here so the subdominant
    // role (Em as IV of Si menor) shares it instead of the raw
    // formula's unplayable fret10/9/10/0 spread.
    "mi-menor": [at("A3", "B"), at("D4", "E"), at("A4", "B"), at("E5", "G")],
  };

/** One dominant7 chord per tono — shared across a key's mayor/menor circles. */
export const DOMINANT7_CHORDS: readonly Chord[] = ALL_KEYS_LIST.map((key) => {
  const pc = KEY_DATA[key].pc;
  const id = `${key}-con-septima`;
  return {
    id,
    // Letter-shorthand chord symbol (e.g. "A7"), matching the printed
    // bandola llanera chord-reference convention — not the Spanish
    // "La con séptima" phrasing used for the tonic/subdominant names.
    name: `${getKeyLetter(key)}7`,
    rootPitchClass: pc,
    intervals: [0, MAJOR_THIRD, PERFECT_FIFTH, MINOR_SEVENTH],
    role: "dominant7",
    voicing: VOICING_OVERRIDES[id] ?? dominant7Voicing(pc),
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
  const id = `${key}-${quality}${idSuffix}`;
  // Overrides are keyed by key+quality only (no role suffix) — a
  // confirmed triad has one physical shape, shared by every role it
  // plays across circles. Only an UNconfirmed triad falls back to the
  // role-specific formula, which can legitimately differ per role.
  const computedVoicing =
    role === "tonic"
      ? tonicVoicing(pc, thirdInterval)
      : subdominantVoicing(pc, thirdInterval);
  const voicing = VOICING_OVERRIDES[`${key}-${quality}`] ?? computedVoicing;
  return {
    id,
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
 * (id suffixed `-cuarta`). Once a key+quality has a confirmed
 * `VOICING_OVERRIDES` entry, this and `TONIC_CHORDS` render the
 * identical shape — only an unconfirmed triad falls back to its own
 * role-specific formula, which can differ from the tonic formula's
 * result until it's locked too.
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
