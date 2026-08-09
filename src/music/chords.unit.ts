/**
 * Tests for the chords module — pure functions and data structure.
 * No DOM, no audio, no side effects at import time (REQ-DATA-006).
 *
 * Mirrors `scales.unit.ts`'s style: plain data assertions, no Qwik,
 * no createDOM.
 */
import { describe, expect, it } from "vitest";
import {
  CIRCLES,
  JOROPO_D_MAJOR,
  JOROPO_D_MAJOR_CIRCLE,
  JOROPO_D_MINOR,
  JOROPO_D_MINOR_CIRCLE,
  getChordById,
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

describe("chords — data structure (REQ-DATA-001)", () => {
  it("every chord has id, name, rootPitchClass, intervals, and a 4-entry voicing", () => {
    for (const circle of CIRCLES) {
      for (const chord of circle.chords) {
        expect(typeof chord.id).toBe("string");
        expect(typeof chord.name).toBe("string");
        expect(typeof chord.rootPitchClass).toBe("number");
        expect(chord.rootPitchClass).toBeGreaterThanOrEqual(0);
        expect(chord.rootPitchClass).toBeLessThanOrEqual(11);
        expect(Array.isArray(chord.intervals)).toBe(true);
        expect(chord.voicing.length).toBe(4);
      }
    }
  });

  it("voicing has exactly one entry per bandola string (A3, D4, A4, E5)", () => {
    for (const circle of CIRCLES) {
      for (const chord of circle.chords) {
        const strings = chord.voicing
          .map((v) => v.stringId)
          .slice()
          .sort();
        expect(strings).toEqual(["A3", "A4", "D4", "E5"]);
      }
    }
  });
});

describe("chords — circles, major first then minor (REQ-DATA-002)", () => {
  it("JOROPO_D_MAJOR has exactly [re-mayor, la-con-septima, sol-mayor] in order", () => {
    expect(JOROPO_D_MAJOR.length).toBe(3);
    expect(JOROPO_D_MAJOR[0].id).toBe("re-mayor");
    expect(JOROPO_D_MAJOR[1].id).toBe("la-con-septima");
    expect(JOROPO_D_MAJOR[2].id).toBe("sol-mayor");
  });

  it("JOROPO_D_MINOR has exactly [re-menor, la-con-septima, sol-menor] in order", () => {
    expect(JOROPO_D_MINOR.length).toBe(3);
    expect(JOROPO_D_MINOR[0].id).toBe("re-menor");
    expect(JOROPO_D_MINOR[1].id).toBe("la-con-septima");
    expect(JOROPO_D_MINOR[2].id).toBe("sol-menor");
  });

  it("the dominant (la-con-septima) is the SAME chord reference in both circles", () => {
    expect(JOROPO_D_MAJOR[1]).toBe(JOROPO_D_MINOR[1]);
  });
});

describe("chords — locked MIDI voicings (REQ-DATA-003)", () => {
  it("re-mayor voicing sorted ascending is exactly [57, 62, 69, 78]", () => {
    expect(sortedMidis(JOROPO_D_MAJOR[0])).toEqual([57, 62, 69, 78]);
  });

  it("la-con-septima voicing is exactly [57, 64, 73, 79] and shared between circles", () => {
    expect(sortedMidis(JOROPO_D_MAJOR[1])).toEqual([57, 64, 73, 79]);
    expect(sortedMidis(JOROPO_D_MINOR[1])).toEqual([57, 64, 73, 79]);
  });

  it("la-con-septima is the locked A7 voicing (A3-0, D4-2, A4-4, E5-3)", () => {
    const chord = JOROPO_D_MAJOR[1];
    const byString = Object.fromEntries(
      chord.voicing.map((v) => [v.stringId, v.fret]),
    ) as Record<StringId, number>;
    expect(byString.A3).toBe(0);
    expect(byString.D4).toBe(2);
    expect(byString.A4).toBe(4);
    expect(byString.E5).toBe(3);
  });

  it("sol-mayor voicing sorted ascending is exactly [59, 62, 71, 79]", () => {
    expect(sortedMidis(JOROPO_D_MAJOR[2])).toEqual([59, 62, 71, 79]);
  });

  it("re-menor voicing sorted ascending is exactly [57, 62, 69, 77]", () => {
    expect(sortedMidis(JOROPO_D_MINOR[0])).toEqual([57, 62, 69, 77]);
  });

  it("sol-menor voicing sorted ascending is exactly [58, 62, 70, 79]", () => {
    expect(sortedMidis(JOROPO_D_MINOR[2])).toEqual([58, 62, 70, 79]);
  });
});

describe("chords — getChordById (REQ-DATA-004)", () => {
  it("returns the chord for a known id", () => {
    const chord = getChordById("re-mayor");
    expect(chord).toBeDefined();
    expect(chord!.name).toBe("Re mayor");
    expect(chord!.voicing.length).toBe(4);
  });

  it("returns undefined for an unknown id", () => {
    expect(getChordById("acorde-inexistente")).toBeUndefined();
  });
});

describe("chords — Spanish names (REQ-DATA-005)", () => {
  it("the set of chord names is exactly the 5 locked Spanish strings", () => {
    const names = new Set(
      CIRCLES.flatMap((c) => c.chords.map((ch) => ch.name)),
    );
    expect(names).toEqual(
      new Set([
        "Re mayor",
        "La con séptima",
        "Sol mayor",
        "Re menor",
        "Sol menor",
      ]),
    );
  });
});

describe("chords — pure module, no DOM/audio, no side effects (REQ-DATA-006)", () => {
  it("imports cleanly in a Node environment with no window global", () => {
    expect(typeof window).toBe("undefined");
    expect(CIRCLES.length).toBe(2);
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

describe("chords — Circle and CIRCLES exports (REQ-DATA-007)", () => {
  it("CIRCLES has both circles, mayor first", () => {
    expect(CIRCLES.length).toBe(2);
    expect(CIRCLES[0].id).toBe("joropo-d-mayor");
    expect(CIRCLES[1].id).toBe("joropo-d-menor");
    expect(CIRCLES[0].chords).toBe(JOROPO_D_MAJOR);
    expect(CIRCLES[1].chords).toBe(JOROPO_D_MINOR);
  });

  it("JOROPO_D_MAJOR_CIRCLE has the locked id, Spanish label, and chords reference", () => {
    expect(JOROPO_D_MAJOR_CIRCLE.id).toBe("joropo-d-mayor");
    expect(JOROPO_D_MAJOR_CIRCLE.label).toBe("Círculo de Re mayor");
    expect(JOROPO_D_MAJOR_CIRCLE.chords).toBe(JOROPO_D_MAJOR);
  });

  it("JOROPO_D_MINOR_CIRCLE has the locked id, Spanish label, and chords reference", () => {
    expect(JOROPO_D_MINOR_CIRCLE.id).toBe("joropo-d-menor");
    expect(JOROPO_D_MINOR_CIRCLE.label).toBe("Círculo de Re menor");
    expect(JOROPO_D_MINOR_CIRCLE.chords).toBe(JOROPO_D_MINOR);
  });
});

describe("chords — MIDI invariant midi = open + fret (REQ-DATA-008)", () => {
  it("holds for every voicing entry across every chord in CIRCLES", () => {
    for (const circle of CIRCLES) {
      for (const chord of circle.chords) {
        for (const entry of chord.voicing) {
          expect(entry.midi).toBe(OPEN_MIDI[entry.stringId] + entry.fret);
        }
      }
    }
  });

  it("holds explicitly for the la-con-septima voicing (57+0, 62+2, 69+4, 76+3)", () => {
    const chord = JOROPO_D_MAJOR[1];
    const byString = Object.fromEntries(
      chord.voicing.map((v) => [v.stringId, v.midi]),
    ) as Record<StringId, number>;
    expect(byString.A3).toBe(57);
    expect(byString.D4).toBe(64);
    expect(byString.A4).toBe(73);
    expect(byString.E5).toBe(79);
  });
});
