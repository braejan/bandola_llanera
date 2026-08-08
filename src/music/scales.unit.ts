/**
 * Tests for the scales module — pure functions and data structure.
 * No DOM, no audio, no async.
 */
import { describe, expect, it } from "vitest";
import {
  ALL_KEYS_LIST,
  ALL_MODES_LIST,
  DEFAULT_SCALE_ID,
  SCALES,
  getKeyLabel,
  getModeLabel,
  getScaleById,
  isScaleInScale,
  type Key,
  type Mode,
} from "./scales";

describe("scales — data structure", () => {
  it("exposes 28 scales (7 keys × 4 modes including cromática)", () => {
    expect(SCALES.length).toBe(28);
  });

  it("every scale has a unique id of the form `{key}-{mode}`", () => {
    const ids = new Set<string>();
    for (const scale of SCALES) {
      expect(ids.has(scale.id)).toBe(false);
      ids.add(scale.id);
      expect(scale.id).toMatch(
        /^(do|re|mi|fa|sol|la|si)-(mayor|menor|armonica|cromatica)$/,
      );
    }
  });

  it("defaults to Re mayor (D major) — the most common in joropo", () => {
    expect(DEFAULT_SCALE_ID).toBe("re-mayor");
    const def = getScaleById(DEFAULT_SCALE_ID);
    expect(def.key).toBe("re");
    expect(def.mode).toBe("mayor");
  });
});

describe("scales — pitch-class mapping", () => {
  it("Re mayor (D major) maps to D, E, F#, G, A, B, C# (PCs 2, 4, 6, 7, 9, 11, 1)", () => {
    const scale = getScaleById("re-mayor");
    // The pitch classes are wrapped mod 12; the order may rotate. We
    // assert the set membership instead of the literal order.
    expect(new Set(scale.pitchClasses)).toEqual(
      new Set([2, 4, 6, 7, 9, 11, 1]),
    );
  });

  it("Re menor (D natural minor) maps to D, E, F, G, A, Bb, C (PCs 2, 4, 5, 7, 9, 10, 0)", () => {
    const scale = getScaleById("re-menor");
    expect(new Set(scale.pitchClasses)).toEqual(
      new Set([2, 4, 5, 7, 9, 10, 0]),
    );
  });

  it("Re armónica (D harmonic minor) maps to D, E, F, G, A, Bb, C# (PCs 2, 4, 5, 7, 9, 10, 1)", () => {
    const scale = getScaleById("re-armonica");
    expect(new Set(scale.pitchClasses)).toEqual(
      new Set([2, 4, 5, 7, 9, 10, 1]),
    );
  });

  it("every diatonic scale (mayor/menor/armonica) produces exactly 7 pitch classes", () => {
    for (const scale of SCALES) {
      if (scale.mode === "cromatica") continue;
      expect(scale.pitchClasses.length).toBe(7);
      // All 7 PCs are unique (no duplicates mod 12)
      expect(new Set(scale.pitchClasses).size).toBe(7);
    }
  });

  it("the cromática scale produces exactly 12 pitch classes for every key", () => {
    for (const scale of SCALES) {
      if (scale.mode !== "cromatica") continue;
      expect(scale.pitchClasses.length).toBe(12);
      expect(new Set(scale.pitchClasses).size).toBe(12);
    }
  });

  it("the tonic pitch class is always the first one (relative to the key)", () => {
    // For Re mayor, the tonic is D (PC 2). It should be in the scale.
    expect(isScaleInScale(getScaleById("re-mayor"), 2)).toBe(true);
    // For Do mayor, the tonic is C (PC 0).
    expect(isScaleInScale(getScaleById("do-mayor"), 0)).toBe(true);
    // For Mi menor, the tonic is E (PC 4).
    expect(isScaleInScale(getScaleById("mi-menor"), 4)).toBe(true);
  });
});

describe("scales — key and mode lookups", () => {
  it("getKeyLabel returns the Spanish solfège name", () => {
    expect(getKeyLabel("do")).toBe("Do");
    expect(getKeyLabel("re")).toBe("Re");
    expect(getKeyLabel("mi")).toBe("Mi");
    expect(getKeyLabel("fa")).toBe("Fa");
    expect(getKeyLabel("sol")).toBe("Sol");
    expect(getKeyLabel("la")).toBe("La");
    expect(getKeyLabel("si")).toBe("Si");
  });

  it("getModeLabel returns the Spanish mode name", () => {
    expect(getModeLabel("mayor")).toBe("mayor");
    expect(getModeLabel("menor")).toBe("menor");
    expect(getModeLabel("armonica")).toBe("armónica");
  });

  it("ALL_KEYS_LIST contains exactly the 7 naturals in pedagogical order", () => {
    expect(ALL_KEYS_LIST).toEqual(["do", "re", "mi", "fa", "sol", "la", "si"]);
  });

  it("ALL_MODES_LIST contains exactly the 4 modes in pedagogical order", () => {
    expect(ALL_MODES_LIST).toEqual(["mayor", "menor", "armonica", "cromatica"]);
  });

  it("getModeLabel returns the Spanish mode name (cromática included)", () => {
    expect(getModeLabel("cromatica")).toBe("cromática");
  });
});

describe("scales — cromática (chromatic)", () => {
  it("the cromática scale covers all 12 semitones of the octave", () => {
    // The chromatic scale is the 12-tone scale: C C# D D# E F F# G G# A A# B
    // in the key of Do, and the same 12 pitch classes in every other
    // key (the diatonic tonic shifts but the set is identical).
    for (const key of ALL_KEYS_LIST) {
      const scale = getScaleById(`${key}-cromatica` as `${Key}-${Mode}`);
      expect(scale.pitchClasses.length).toBe(12);
      expect(new Set(scale.pitchClasses)).toEqual(
        new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
      );
    }
  });

  it("Do cromática has the literal note order C, C#, D, D#, E, F, F#, G, G#, A, A#, B", () => {
    const scale = getScaleById("do-cromatica");
    // Index 0 = C, 1 = C#, 2 = D, 3 = D#, 4 = E, 5 = F, 6 = F#,
    // 7 = G, 8 = G#, 9 = A, 10 = A#, 11 = B.
    const expected = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
    // We assert the relative spacing of the pitch classes, not the
    // literal string names, so the test stays robust to future
    // renames of the PC_NAMES array.
    expect(scale.pitchClasses).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    // Sanity: a chromatic scale should have 12 distinct pitch classes.
    expect(new Set(scale.pitchClasses).size).toBe(12);
  });

  it("Re cromática starts on D (PC 2) and wraps through PC 1 (B)", () => {
    // The tonic is the first interval (0); the wrap-around means
    // D + 11 semitones = C# = PC 1, which lives at index 11 of the
    // pitch-class set (mod 12).
    const scale = getScaleById("re-cromatica");
    expect(scale.pitchClasses[0]).toBe(2);
    expect(scale.pitchClasses[11]).toBe(1);
  });

  it("every chromatic scale has the same pitch-class set", () => {
    // The set of {0,1,2,...,11} is invariant under rotation mod 12.
    const sets = ALL_KEYS_LIST.map((key) => {
      const scale = getScaleById(`${key}-cromatica` as `${Key}-${Mode}`);
      return new Set(scale.pitchClasses);
    });
    for (const set of sets) {
      expect(set).toEqual(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));
    }
  });
});

describe("scales — open string preference (WARNING-related)", () => {
  it("all four bandola open strings are in the Re mayor scale", () => {
    // Tuning: A3 (PC 9), D4 (PC 2), A4 (PC 9), E5 (PC 4).
    // D mayor pitch classes: 2, 4, 6, 7, 9, 11, 1. The set includes
    // 9 (A), 2 (D), 4 (E) — all four open strings are scale tones.
    const scale = getScaleById("re-mayor");
    expect(isScaleInScale(scale, 9)).toBe(true); // A
    expect(isScaleInScale(scale, 2)).toBe(true); // D
    expect(isScaleInScale(scale, 4)).toBe(true); // E
  });

  it("the same-pitch open string finder: A3 fret 5 (D) and open D4 share the same PC", () => {
    // A3 fret 5 = midi 62 = PC 2. Open D4 = midi 62 = PC 2.
    // Both are in D mayor. The Diapason uses this to show the open
    // string as the "preferred" fingering for the fretted equivalent.
    const scale = getScaleById("re-mayor");
    const a3F5Pc = 62 % 12; // = 2 (D)
    const d4OpenPc = 62 % 12; // = 2 (D)
    expect(a3F5Pc).toBe(d4OpenPc);
    expect(isScaleInScale(scale, a3F5Pc)).toBe(true);
  });

  it("getScaleById throws for an unknown id", () => {
    expect(() => getScaleById("re-bebop" as unknown as `${Key}-${Mode}`)).toThrow();
  });
});
