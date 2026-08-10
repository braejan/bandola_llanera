/**
 * Tests for the chords module — pure functions and data structure.
 * No DOM, no audio, no side effects at import time.
 *
 * Mirrors `scales.unit.ts`'s style: plain data assertions, no Qwik,
 * no createDOM.
 */
import { describe, expect, it } from "vitest";
import {
  CIRCLES,
  DEFAULT_CIRCLE_ID,
  DOMINANT7_CHORDS,
  TONIC_CHORDS,
  SUBDOMINANT_CHORDS,
  getChordById,
  getCircleById,
  type Chord,
  type StringId,
} from "./chords";

const OPEN_MIDI: Record<StringId, number> = {
  A3: 57,
  D4: 62,
  A4: 69,
  E5: 76,
};

function sortedMidis(chord: Chord): number[] {
  return chord.voicing
    .map((v) => v.midi)
    .slice()
    .sort((a, b) => a - b);
}

const ALL_CHORDS: readonly Chord[] = [
  ...DOMINANT7_CHORDS,
  ...TONIC_CHORDS,
  ...SUBDOMINANT_CHORDS,
];

describe("chords — data structure", () => {
  it("every chord has id, name, rootPitchClass, intervals, role, and a 4-entry voicing", () => {
    for (const chord of ALL_CHORDS) {
      expect(typeof chord.id).toBe("string");
      expect(typeof chord.name).toBe("string");
      expect(chord.rootPitchClass).toBeGreaterThanOrEqual(0);
      expect(chord.rootPitchClass).toBeLessThanOrEqual(11);
      expect(Array.isArray(chord.intervals)).toBe(true);
      expect(["dominant7", "tonic", "subdominant"]).toContain(chord.role);
      expect(chord.voicing.length).toBe(4);
    }
  });

  it("voicing has exactly one entry per bandola string (A3, D4, A4, E5)", () => {
    for (const chord of ALL_CHORDS) {
      const strings = chord.voicing
        .map((v) => v.stringId)
        .slice()
        .sort();
      expect(strings).toEqual(["A3", "A4", "D4", "E5"]);
    }
  });

  it("every voicing entry's fret is within the fretted range 0..11", () => {
    for (const chord of ALL_CHORDS) {
      for (const entry of chord.voicing) {
        expect(entry.fret).toBeGreaterThanOrEqual(0);
        expect(entry.fret).toBeLessThanOrEqual(11);
      }
    }
  });

  it("all chord ids are unique", () => {
    const ids = ALL_CHORDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("chords — pool sizes (12 tonos)", () => {
  it("has 12 dominant7 chords, one per tono", () => {
    expect(DOMINANT7_CHORDS.length).toBe(12);
  });

  it("has 24 tonic chords (12 tonos x mayor/menor)", () => {
    expect(TONIC_CHORDS.length).toBe(24);
  });

  it("has 24 subdominant chords (12 tonos x mayor/menor)", () => {
    expect(SUBDOMINANT_CHORDS.length).toBe(24);
  });

  it("has 24 circles (12 tonos x mayor/menor)", () => {
    expect(CIRCLES.length).toBe(24);
  });
});

describe("chords — the fret formula reproduces every locked D-circle voicing", () => {
  it("re-mayor voicing sorted ascending is exactly [57, 62, 69, 78]", () => {
    expect(sortedMidis(getChordById("re-mayor")!)).toEqual([57, 62, 69, 78]);
  });

  it("re-menor voicing sorted ascending is exactly [57, 62, 69, 77]", () => {
    expect(sortedMidis(getChordById("re-menor")!)).toEqual([57, 62, 69, 77]);
  });

  it("la-con-septima (dominant of Re) voicing is exactly [57, 64, 73, 79]", () => {
    const chord = getChordById("la-con-septima")!;
    expect(sortedMidis(chord)).toEqual([57, 64, 73, 79]);
    const byString = Object.fromEntries(
      chord.voicing.map((v) => [v.stringId, v.fret]),
    ) as Record<StringId, number>;
    expect(byString.A3).toBe(0);
    expect(byString.D4).toBe(2);
    expect(byString.A4).toBe(4);
    expect(byString.E5).toBe(3);
  });

  it("every dominant7 chord's name is the letter-shorthand symbol (e.g. A7), not the Spanish phrasing", () => {
    expect(getChordById("la-con-septima")!.name).toBe("A7");
    expect(getChordById("re-con-septima")!.name).toBe("D7");
    expect(getChordById("fa#-con-septima")!.name).toBe("F♯7");
    for (const chord of DOMINANT7_CHORDS) {
      expect(chord.name).toMatch(/^[A-G]♯?7$/);
    }
  });

  it("every tonic/subdominant chord's name is the letter-shorthand symbol (e.g. D, Dm), not the Spanish phrasing", () => {
    expect(getChordById("re-mayor")!.name).toBe("D");
    expect(getChordById("re-menor")!.name).toBe("Dm");
    expect(getChordById("sol-mayor-cuarta")!.name).toBe("G");
    expect(getChordById("sol-menor-cuarta")!.name).toBe("Gm");
    for (const chord of [...TONIC_CHORDS, ...SUBDOMINANT_CHORDS]) {
      expect(chord.name).toMatch(/^[A-G]♯?m?$/);
    }
  });

  it("sol-mayor-cuarta (subdominant of Re mayor) voicing sorted ascending is exactly [59, 62, 71, 79]", () => {
    expect(sortedMidis(getChordById("sol-mayor-cuarta")!)).toEqual([
      59, 62, 71, 79,
    ]);
  });

  it("sol-menor-cuarta (subdominant of Re menor) voicing sorted ascending is exactly [58, 62, 70, 79]", () => {
    expect(sortedMidis(getChordById("sol-menor-cuarta")!)).toEqual([
      58, 62, 70, 79,
    ]);
  });
});

describe("chords — Do circle voicings, corrected against the instrument (overrides the generated formula)", () => {
  function byString(id: string): Record<StringId, number> {
    return Object.fromEntries(
      getChordById(id)!.voicing.map((v) => [v.stringId, v.fret]),
    ) as Record<StringId, number>;
  }

  it("sol-con-septima (dominant of Do) is A3=2, D4=3, A4=5, E5=3", () => {
    const frets = byString("sol-con-septima");
    expect(frets.A3).toBe(2);
    expect(frets.D4).toBe(3);
    expect(frets.A4).toBe(5);
    expect(frets.E5).toBe(3);
    expect(sortedMidis(getChordById("sol-con-septima")!)).toEqual([
      59, 65, 74, 79,
    ]);
  });

  it("do-mayor is A3=3, D4=2, A4=3, E5=3", () => {
    const frets = byString("do-mayor");
    expect(frets.A3).toBe(3);
    expect(frets.D4).toBe(2);
    expect(frets.A4).toBe(3);
    expect(frets.E5).toBe(3);
    expect(sortedMidis(getChordById("do-mayor")!)).toEqual([60, 64, 72, 79]);
  });

  it("do-menor is A3=3, D4=1, A4=3, E5=3", () => {
    const frets = byString("do-menor");
    expect(frets.A3).toBe(3);
    expect(frets.D4).toBe(1);
    expect(frets.A4).toBe(3);
    expect(frets.E5).toBe(3);
    expect(sortedMidis(getChordById("do-menor")!)).toEqual([60, 63, 72, 79]);
  });

  it("fa-mayor-cuarta (subdominant of Do mayor) is A3=3, D4=3, A4=open(0), E5=1", () => {
    const frets = byString("fa-mayor-cuarta");
    expect(frets.A3).toBe(3);
    expect(frets.D4).toBe(3);
    expect(frets.A4).toBe(0);
    expect(frets.E5).toBe(1);
    expect(sortedMidis(getChordById("fa-mayor-cuarta")!)).toEqual([
      60, 65, 69, 77,
    ]);
  });

  it("fa-menor-cuarta (subdominant of Do menor) is A3=3, D4=3, A4=3, E5=4", () => {
    const frets = byString("fa-menor-cuarta");
    expect(frets.A3).toBe(3);
    expect(frets.D4).toBe(3);
    expect(frets.A4).toBe(3);
    expect(frets.E5).toBe(4);
    expect(sortedMidis(getChordById("fa-menor-cuarta")!)).toEqual([
      60, 65, 72, 80,
    ]);
  });

  it("do-mayor-cuarta (Do as IV of Sol) reuses the confirmed do-mayor shape: A3=3, D4=2, A4=3, E5=3", () => {
    const frets = byString("do-mayor-cuarta");
    expect(frets.A3).toBe(3);
    expect(frets.D4).toBe(2);
    expect(frets.A4).toBe(3);
    expect(frets.E5).toBe(3);
    expect(sortedMidis(getChordById("do-mayor-cuarta")!)).toEqual([
      60, 64, 72, 79,
    ]);
  });

  it("do-menor-cuarta (Do as IV of Sol menor) reuses the confirmed do-menor shape: A3=3, D4=1, A4=3, E5=3", () => {
    const frets = byString("do-menor-cuarta");
    expect(frets.A3).toBe(3);
    expect(frets.D4).toBe(1);
    expect(frets.A4).toBe(3);
    expect(frets.E5).toBe(3);
    expect(sortedMidis(getChordById("do-menor-cuarta")!)).toEqual([
      60, 63, 72, 79,
    ]);
  });

  it("fa-mayor (Fa's own tonic) reuses the confirmed F shape: A3=3, D4=3, A4=open(0), E5=1", () => {
    const frets = byString("fa-mayor");
    expect(frets.A3).toBe(3);
    expect(frets.D4).toBe(3);
    expect(frets.A4).toBe(0);
    expect(frets.E5).toBe(1);
    expect(sortedMidis(getChordById("fa-mayor")!)).toEqual([60, 65, 69, 77]);
  });

  it("fa-menor (Fa's own tonic) already matches the confirmed Fm shape by formula: A3=3, D4=3, A4=3, E5=4", () => {
    const frets = byString("fa-menor");
    expect(frets.A3).toBe(3);
    expect(frets.D4).toBe(3);
    expect(frets.A4).toBe(3);
    expect(frets.E5).toBe(4);
    expect(sortedMidis(getChordById("fa-menor")!)).toEqual([60, 65, 72, 80]);
  });
});

describe("chords — Do# circle voicings, corrected against the instrument", () => {
  function byString(id: string): Record<StringId, number> {
    return Object.fromEntries(
      getChordById(id)!.voicing.map((v) => [v.stringId, v.fret]),
    ) as Record<StringId, number>;
  }

  it("sol#-con-septima (dominant of Do#, G#7) is A3=3, D4=4, A4=6, E5=4", () => {
    const frets = byString("sol#-con-septima");
    expect(frets.A3).toBe(3);
    expect(frets.D4).toBe(4);
    expect(frets.A4).toBe(6);
    expect(frets.E5).toBe(4);
    expect(sortedMidis(getChordById("sol#-con-septima")!)).toEqual([
      60, 66, 75, 80,
    ]);
  });

  it("do#-mayor (C#) is A3=4, D4=3, A4=4, E5=4", () => {
    const frets = byString("do#-mayor");
    expect(frets.A3).toBe(4);
    expect(frets.D4).toBe(3);
    expect(frets.A4).toBe(4);
    expect(frets.E5).toBe(4);
    expect(sortedMidis(getChordById("do#-mayor")!)).toEqual([
      61, 65, 73, 80,
    ]);
  });

  it("do#-menor (C#m) is A3=4, D4=2 (E — the minor 3rd, not D# at fret 1), A4=4, E5=4", () => {
    const frets = byString("do#-menor");
    expect(frets.A3).toBe(4);
    expect(frets.D4).toBe(2);
    expect(frets.A4).toBe(4);
    expect(frets.E5).toBe(4);
    expect(sortedMidis(getChordById("do#-menor")!)).toEqual([
      61, 64, 73, 80,
    ]);
  });

  it("fa#-mayor-cuarta (subdominant of Do# mayor, F#) is A3=4, D4=4, A4=1, E5=2", () => {
    const frets = byString("fa#-mayor-cuarta");
    expect(frets.A3).toBe(4);
    expect(frets.D4).toBe(4);
    expect(frets.A4).toBe(1);
    expect(frets.E5).toBe(2);
    expect(sortedMidis(getChordById("fa#-mayor-cuarta")!)).toEqual([
      61, 66, 70, 78,
    ]);
  });

  it("fa#-menor-cuarta (subdominant of Do# menor, F#m) is A3=4, D4=4, A4=open(0), E5=2", () => {
    const frets = byString("fa#-menor-cuarta");
    expect(frets.A3).toBe(4);
    expect(frets.D4).toBe(4);
    expect(frets.A4).toBe(0);
    expect(frets.E5).toBe(2);
    expect(sortedMidis(getChordById("fa#-menor-cuarta")!)).toEqual([
      61, 66, 69, 78,
    ]);
  });
});

describe("chords — Alejo Cordero reference chart cross-check (per key, mayor/menor/dominant7)", () => {
  function byString(id: string): Record<StringId, number> {
    return Object.fromEntries(
      getChordById(id)!.voicing.map((v) => [v.stringId, v.fret]),
    ) as Record<StringId, number>;
  }

  it("do-con-septima (C7, dominant of Fa) is A3=3, D4=2, A4=1, E5=3", () => {
    const frets = byString("do-con-septima");
    expect(frets.A3).toBe(3);
    expect(frets.D4).toBe(2);
    expect(frets.A4).toBe(1);
    expect(frets.E5).toBe(3);
    expect(sortedMidis(getChordById("do-con-septima")!)).toEqual([
      60, 64, 70, 79,
    ]);
  });

  it("do#-con-septima (C#7, dominant of Fa#) is A3=4, D4=3, A4=2, E5=4", () => {
    const frets = byString("do#-con-septima");
    expect(frets.A3).toBe(4);
    expect(frets.D4).toBe(3);
    expect(frets.A4).toBe(2);
    expect(frets.E5).toBe(4);
    expect(sortedMidis(getChordById("do#-con-septima")!)).toEqual([
      61, 65, 71, 80,
    ]);
  });

  it("re#-con-septima (D#7/Eb7, dominant of Sol#) is A3=1, D4=1, A4=4, E5=3", () => {
    const frets = byString("re#-con-septima");
    expect(frets.A3).toBe(1);
    expect(frets.D4).toBe(1);
    expect(frets.A4).toBe(4);
    expect(frets.E5).toBe(3);
    expect(sortedMidis(getChordById("re#-con-septima")!)).toEqual([
      58, 63, 73, 79,
    ]);
  });

  it("mi-con-septima (E7, dominant of La) is A3=2, D4=2, A4=5, E5=4", () => {
    const frets = byString("mi-con-septima");
    expect(frets.A3).toBe(2);
    expect(frets.D4).toBe(2);
    expect(frets.A4).toBe(5);
    expect(frets.E5).toBe(4);
    expect(sortedMidis(getChordById("mi-con-septima")!)).toEqual([
      59, 64, 74, 80,
    ]);
  });

  it("fa-con-septima (F7, dominant of La#) is A3=3, D4=1, A4=open(0), E5=1", () => {
    const frets = byString("fa-con-septima");
    expect(frets.A3).toBe(3);
    expect(frets.D4).toBe(1);
    expect(frets.A4).toBe(0);
    expect(frets.E5).toBe(1);
    expect(sortedMidis(getChordById("fa-con-septima")!)).toEqual([
      60, 63, 69, 77,
    ]);
  });

  it("fa#-mayor (F#'s own tonic) reuses the confirmed fa#-mayor-cuarta shape", () => {
    const frets = byString("fa#-mayor");
    expect(frets.A3).toBe(4);
    expect(frets.D4).toBe(4);
    expect(frets.A4).toBe(1);
    expect(frets.E5).toBe(2);
    expect(sortedMidis(getChordById("fa#-mayor")!)).toEqual([61, 66, 70, 78]);
  });

  it("fa#-menor (F#'s own tonic) reuses the confirmed fa#-menor-cuarta shape", () => {
    const frets = byString("fa#-menor");
    expect(frets.A3).toBe(4);
    expect(frets.D4).toBe(4);
    expect(frets.A4).toBe(0);
    expect(frets.E5).toBe(2);
    expect(sortedMidis(getChordById("fa#-menor")!)).toEqual([61, 66, 69, 78]);
  });

  it("sol-mayor (G) is A3=2, D4=open(0), A4=2, E5=3 — NOT the raw formula's fret5/7 guess", () => {
    const frets = byString("sol-mayor");
    expect(frets.A3).toBe(2);
    expect(frets.D4).toBe(0);
    expect(frets.A4).toBe(2);
    expect(frets.E5).toBe(3);
    expect(sortedMidis(getChordById("sol-mayor")!)).toEqual([59, 62, 71, 79]);
  });

  it("sol-menor (Gm) is A3=1, D4=open(0), A4=1, E5=3", () => {
    const frets = byString("sol-menor");
    expect(frets.A3).toBe(1);
    expect(frets.D4).toBe(0);
    expect(frets.A4).toBe(1);
    expect(frets.E5).toBe(3);
    expect(sortedMidis(getChordById("sol-menor")!)).toEqual([58, 62, 70, 79]);
  });

  it("sol#-con-septima (Ab7/G#7) already matches the physically-tested override — reference chart confirms 3 of 4 notes", () => {
    const frets = byString("sol#-con-septima");
    expect(frets.A3).toBe(3);
    expect(frets.D4).toBe(4);
    expect(frets.A4).toBe(6);
    expect(frets.E5).toBe(4);
  });

  it("sol#-mayor (Ab/G#'s own tonic) is A3=3, D4=1, A4=3, E5=4", () => {
    const frets = byString("sol#-mayor");
    expect(frets.A3).toBe(3);
    expect(frets.D4).toBe(1);
    expect(frets.A4).toBe(3);
    expect(frets.E5).toBe(4);
    expect(sortedMidis(getChordById("sol#-mayor")!)).toEqual([60, 63, 72, 80]);
  });

  it("sol#-menor (Abm/G#m) is A3=2, D4=1, A4=2, E5=4", () => {
    const frets = byString("sol#-menor");
    expect(frets.A3).toBe(2);
    expect(frets.D4).toBe(1);
    expect(frets.A4).toBe(2);
    expect(frets.E5).toBe(4);
    expect(sortedMidis(getChordById("sol#-menor")!)).toEqual([59, 63, 71, 80]);
  });

  it("la#-mayor (Bb/A#'s own tonic) is A3=1, D4=open(0), A4=1, E5=1", () => {
    const frets = byString("la#-mayor");
    expect(frets.A3).toBe(1);
    expect(frets.D4).toBe(0);
    expect(frets.A4).toBe(1);
    expect(frets.E5).toBe(1);
    expect(sortedMidis(getChordById("la#-mayor")!)).toEqual([58, 62, 70, 77]);
  });

  it("si-mayor (B) is A3=2, D4=1, A4=2, E5=2", () => {
    const frets = byString("si-mayor");
    expect(frets.A3).toBe(2);
    expect(frets.D4).toBe(1);
    expect(frets.A4).toBe(2);
    expect(frets.E5).toBe(2);
    expect(sortedMidis(getChordById("si-mayor")!)).toEqual([59, 63, 71, 78]);
  });

  it("si-menor (Bm) is A3=2, D4=open(0), A4=2, E5=2", () => {
    const frets = byString("si-menor");
    expect(frets.A3).toBe(2);
    expect(frets.D4).toBe(0);
    expect(frets.A4).toBe(2);
    expect(frets.E5).toBe(2);
    expect(sortedMidis(getChordById("si-menor")!)).toEqual([59, 62, 71, 78]);
  });

  it("si-con-septima (B7, dominant of Mi) is A3=2, D4=1, A4=open(0), E5=2", () => {
    const frets = byString("si-con-septima");
    expect(frets.A3).toBe(2);
    expect(frets.D4).toBe(1);
    expect(frets.A4).toBe(0);
    expect(frets.E5).toBe(2);
    expect(sortedMidis(getChordById("si-con-septima")!)).toEqual([
      59, 63, 69, 78,
    ]);
  });
});

describe("chords — pitch-class correctness (the generated notes are always right)", () => {
  it("every chord's voicing covers every one of its own interval pitch classes at least once", () => {
    for (const chord of ALL_CHORDS) {
      const requiredPcs = new Set(
        chord.intervals.map((i) => (chord.rootPitchClass + i) % 12),
      );
      const voicedPcs = new Set(chord.voicing.map((v) => v.midi % 12));
      for (const pc of requiredPcs) {
        expect(voicedPcs.has(pc)).toBe(true);
      }
    }
  });

  it("no voicing contains a pitch class outside its own chord tones", () => {
    for (const chord of ALL_CHORDS) {
      const requiredPcs = new Set(
        chord.intervals.map((i) => (chord.rootPitchClass + i) % 12),
      );
      for (const entry of chord.voicing) {
        expect(requiredPcs.has(entry.midi % 12)).toBe(true);
      }
    }
  });
});

describe("chords — MIDI invariant midi = open + fret", () => {
  it("holds for every voicing entry across every chord", () => {
    for (const chord of ALL_CHORDS) {
      for (const entry of chord.voicing) {
        expect(entry.midi).toBe(OPEN_MIDI[entry.stringId] + entry.fret);
      }
    }
  });
});

describe("chords — getChordById", () => {
  it("returns the chord for a known id", () => {
    const chord = getChordById("re-mayor");
    expect(chord).toBeDefined();
    expect(chord!.name).toBe("D");
    expect(chord!.voicing.length).toBe(4);
  });

  it("returns undefined for an unknown id", () => {
    expect(getChordById("acorde-inexistente")).toBeUndefined();
  });
});

describe("chords — circles", () => {
  it("every circle has exactly [dominant7, tonic, subdominant] in that order", () => {
    for (const circle of CIRCLES) {
      expect(circle.chords.length).toBe(3);
      expect(circle.chords[0].role).toBe("dominant7");
      expect(circle.chords[1].role).toBe("tonic");
      expect(circle.chords[2].role).toBe("subdominant");
    }
  });

  it("the Re mayor circle is [la-con-septima, re-mayor, sol-mayor-cuarta]", () => {
    const circle = getCircleById("joropo-re-mayor")!;
    expect(circle.chords.map((c) => c.id)).toEqual([
      "la-con-septima",
      "re-mayor",
      "sol-mayor-cuarta",
    ]);
  });

  it("the Re menor circle is [la-con-septima, re-menor, sol-menor-cuarta]", () => {
    const circle = getCircleById("joropo-re-menor")!;
    expect(circle.chords.map((c) => c.id)).toEqual([
      "la-con-septima",
      "re-menor",
      "sol-menor-cuarta",
    ]);
  });

  it("the dominant is the same chord reference across a tono's mayor and menor circles", () => {
    const mayor = getCircleById("joropo-re-mayor")!;
    const menor = getCircleById("joropo-re-menor")!;
    expect(mayor.chords[0]).toBe(menor.chords[0]);
  });

  it("DEFAULT_CIRCLE_ID is joropo-re-mayor and resolves via getCircleById", () => {
    expect(DEFAULT_CIRCLE_ID).toBe("joropo-re-mayor");
    expect(getCircleById(DEFAULT_CIRCLE_ID)).toBeDefined();
  });

  it("every circle id round-trips through getCircleById", () => {
    for (const circle of CIRCLES) {
      expect(getCircleById(circle.id)).toBe(circle);
    }
  });
});

describe("chords — pure module, no DOM/audio, no side effects", () => {
  it("imports cleanly in a Node environment with no window global", () => {
    expect(typeof window).toBe("undefined");
    expect(CIRCLES.length).toBe(24);
  });

  it("has no disallowed import paths (audio, web-audio, window, document, dom)", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const source = await fs.readFile(
      path.resolve(__dirname, "./chords.ts"),
      "utf-8",
    );
    const importLines = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line));
    for (const line of importLines) {
      expect(line).not.toMatch(/audio|web-audio|window|document|['"]dom['"]/i);
    }
  });
});
