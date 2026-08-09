/**
 * Strict TDD — ChordFretboard component tests.
 *
 * Asserts on the ChordFretboard component:
 *   - props {chord, onChordPlay?} (REQ-FRET-001)
 *   - cell data-string/data-fret/data-midi + aria-label (REQ-FRET-002)
 *   - playable ("in-chord") vs ghost visual treatment (REQ-FRET-003)
 *   - cell click plays via playMidiNote with the chord-scoped targetId;
 *     ghost click is a no-op (REQ-FRET-004)
 *   - anim-target subscribe + "playing" flash, scoped to this chord's
 *     own targetId prefix (REQ-FRET-005)
 *   - "Tocar {chord.name} completo" button (REQ-FRET-006/007)
 *   - locked Spanish cell aria-labels for all 5 chords, corrected A7
 *     (REQ-FRET-008)
 *   - Diapason string CSS custom properties reuse (REQ-FRET-009)
 *   - AudioStatusContext onStatus wiring (REQ-FRET-010)
 *   - focus order: button, then E5 -> A4 -> D4 -> A3 (REQ-FRET-011)
 *   - reduced-motion collapses the flash (REQ-FRET-012)
 */
import { $, component$, useContextProvider, useSignal } from "@builder.io/qwik";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";

vi.mock("../../audio/play-midi-note", () => ({
  playMidiNote: vi.fn().mockResolvedValue(null),
  AUDIO_UNAVAILABLE_MESSAGE:
    "Audio no disponible. Toca una nota para intentarlo de nuevo.",
}));

vi.mock("../../audio/play-chord", () => ({
  playChord: vi.fn().mockResolvedValue(undefined),
  AUDIO_UNAVAILABLE_MESSAGE:
    "Audio no disponible. Toca una nota para intentarlo de nuevo.",
}));

// anim-target is NOT mocked — the flash tests need the real pub/sub
// wiring (same choice `diapason.unit.tsx` makes), reset between tests
// via `__resetAnimTargetForTests()` so listeners never accumulate.

import { playMidiNote } from "../../audio/play-midi-note";
import { playChord } from "../../audio/play-chord";
import * as animTarget from "../../audio/anim-target";
import { ChordFretboard } from "./chord-fretboard";
import { AudioStatusContext } from "../../audio/audio-status-context";
import { getChordById, type Chord } from "../../music/chords";

const playMidiNoteMock = vi.mocked(playMidiNote);
const playChordMock = vi.mocked(playChord);

const TestHarness = component$<{ chord: Chord }>(({ chord }) => {
  const audioStatus = useSignal("");
  useContextProvider(AudioStatusContext, audioStatus);
  return <ChordFretboard chord={chord} />;
});

const RE_MAYOR = getChordById("re-mayor")!;
const LA_CON_SEPTIMA = getChordById("la-con-septima")!;
const SOL_MAYOR = getChordById("sol-mayor")!;
const RE_MENOR = getChordById("re-menor")!;
const SOL_MENOR = getChordById("sol-menor")!;

beforeEach(() => {
  vi.clearAllMocks();
  playMidiNoteMock.mockResolvedValue(null);
  playChordMock.mockResolvedValue(undefined);
  animTarget.__resetAnimTargetForTests();
});

describe("ChordFretboard — component signature (REQ-FRET-001)", () => {
  it("renders without onChordPlay, and shows the play-all button", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const btn = screen.querySelector(".chord-fretboard__play-all");
    expect(btn).not.toBeNull();
  });

  it("renders exactly one playable cell per (stringId, fret) pair in chord.voicing", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const playable = screen.querySelectorAll(".chord-fret--in-chord");
    expect(playable.length).toBe(RE_MAYOR.voicing.length);
  });
});

describe("ChordFretboard — cell data attributes (REQ-FRET-002)", () => {
  it("every cell carries data-string, data-fret, data-midi, and aria-label", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const cells = screen.querySelectorAll(".chord-fret");
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of Array.from(cells)) {
      expect(cell.getAttribute("data-string")).toBeTruthy();
      expect(cell.getAttribute("data-fret")).not.toBeNull();
      expect(cell.getAttribute("data-midi")).toBeTruthy();
      expect(cell.getAttribute("aria-label")).toBeTruthy();
    }
  });

  it("a playable cell's data-midi matches openMidi + fret (A3 fret 0 -> 57)", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const cell = screen.querySelector(
      '.chord-fret[data-string="A3"][data-fret="0"]',
    );
    expect(cell?.getAttribute("data-midi")).toBe("57");
  });
});

describe("ChordFretboard — playable vs ghost (REQ-FRET-003)", () => {
  it("a playable cell (A3 fret 0 for Re mayor) has the in-chord class and full opacity", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const cell = screen.querySelector(
      '.chord-fret[data-string="A3"][data-fret="0"]',
    ) as HTMLElement;
    expect(cell.classList.contains("chord-fret--in-chord")).toBe(true);
    expect(cell.classList.contains("chord-fret--ghost")).toBe(false);
  });

  it("a non-playable cell (A3 fret 1 for Re mayor) has the ghost class", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const cell = screen.querySelector(
      '.chord-fret[data-string="A3"][data-fret="1"]',
    ) as HTMLElement;
    expect(cell.classList.contains("chord-fret--ghost")).toBe(true);
    expect(cell.classList.contains("chord-fret--in-chord")).toBe(false);
  });

  it("exactly 4 cells are in-chord and the rest are ghost", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const all = screen.querySelectorAll(".chord-fret");
    const inChord = screen.querySelectorAll(".chord-fret--in-chord");
    const ghost = screen.querySelectorAll(".chord-fret--ghost");
    expect(inChord.length).toBe(4);
    expect(ghost.length).toBe(all.length - 4);
  });
});

describe("ChordFretboard — cell click plays via playMidiNote (REQ-FRET-004)", () => {
  it("clicking a playable cell calls playMidiNote(midi, { targetId: chord-<id>-<string>-<fret> })", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const cell = screen.querySelector(
      '.chord-fret[data-string="E5"][data-fret="2"]',
    ) as HTMLElement;
    expect(cell.classList.contains("chord-fret--in-chord")).toBe(true);
    await userEvent(cell, "click");
    expect(playMidiNoteMock).toHaveBeenCalledTimes(1);
    expect(playMidiNoteMock).toHaveBeenCalledWith(
      78,
      expect.objectContaining({ targetId: "chord-re-mayor-E5-2" }),
    );
  });

  it("clicking a ghost cell does not call playMidiNote", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const cell = screen.querySelector(
      '.chord-fret[data-string="A3"][data-fret="1"]',
    ) as HTMLElement;
    await userEvent(cell, "click");
    expect(playMidiNoteMock).not.toHaveBeenCalled();
  });
});

describe("ChordFretboard — anim-target subscribe + flash (REQ-FRET-005)", () => {
  it('flashes the matching in-chord cell (by data-midi) with "chord-fret--playing" when its own chord-<id>- event publishes', async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    animTarget.publish({ midi: 78, targetId: "chord-re-mayor-E5-2" });
    const cell = screen.querySelector(
      '.chord-fret[data-string="E5"][data-fret="2"]',
    ) as HTMLElement;
    expect(cell.classList.contains("chord-fret--playing")).toBe(true);
  });

  it("also flashes on the index-based targetId shape published by playChord (chord-<id>-<i>)", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    animTarget.publish({ midi: 78, targetId: "chord-re-mayor-3" });
    const cell = screen.querySelector(
      '.chord-fret[data-string="E5"][data-fret="2"]',
    ) as HTMLElement;
    expect(cell.classList.contains("chord-fret--playing")).toBe(true);
  });

  it("ignores an event published for a DIFFERENT chord id", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    animTarget.publish({ midi: 78, targetId: "chord-sol-mayor-E5-2" });
    const cell = screen.querySelector(
      '.chord-fret[data-string="E5"][data-fret="2"]',
    ) as HTMLElement;
    expect(cell.classList.contains("chord-fret--playing")).toBe(false);
  });

  it("unsubscribes on cleanup — no flash after the captured off() runs", async () => {
    // anim-target is real in this file (see the note above the mock
    // block at the top) — subscribe/publish route through the actual
    // pub/sub Set, so off() genuinely removes the component's listener
    // and this test can observe the real effect of that removal.
    const subscribeSpy = vi.spyOn(animTarget, "subscribe");
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    const off = subscribeSpy.mock.results[0]?.value as (() => void) | undefined;
    expect(typeof off).toBe("function");

    const cell = screen.querySelector(
      '.chord-fret[data-string="E5"][data-fret="2"]',
    ) as HTMLElement;

    off!();

    // Publishing the exact event that flashes this cell (proven by the
    // REQ-FRET-005 test above) must not throw AND — the actual cleanup
    // contract — must not flash the cell, because off() already removed
    // the listener that would have located and flashed it.
    expect(() =>
      animTarget.publish({ midi: 78, targetId: "chord-re-mayor-E5-2" }),
    ).not.toThrow();
    expect(cell.classList.contains("chord-fret--playing")).toBe(false);
  });
});

describe('ChordFretboard — "Tocar {chord.name} completo" button (REQ-FRET-006/007)', () => {
  it("shows the exact locked Spanish label per chord, matching visible text and aria-label", async () => {
    const cases: Array<[Chord, string]> = [
      [RE_MAYOR, "Tocar Re mayor completo"],
      [LA_CON_SEPTIMA, "Tocar La con séptima completo"],
      [SOL_MAYOR, "Tocar Sol mayor completo"],
    ];
    for (const [chord, expected] of cases) {
      const { screen, render } = await createDOM();
      await render(<TestHarness chord={chord} />);
      const btn = screen.querySelector(
        ".chord-fretboard__play-all",
      ) as HTMLElement;
      expect(btn.textContent?.trim()).toBe(expected);
      expect(btn.getAttribute("aria-label")).toBe(expected);
    }
  });

  it("clicking the button invokes onChordPlay exactly once", async () => {
    // A captured `vi.fn()` cannot be closed over inside a `$()` QRL —
    // Qwik's serialization check rejects mock-function internals. A
    // Qwik signal IS serializable, so invocation is tracked through a
    // rendered counter instead of a spy.
    const Harness = component$(() => {
      const audioStatus = useSignal("");
      const callCount = useSignal(0);
      useContextProvider(AudioStatusContext, audioStatus);
      return (
        <>
          <p data-testid="call-count">{callCount.value}</p>
          <ChordFretboard
            chord={RE_MAYOR}
            onChordPlay={$(() => {
              callCount.value++;
            })}
          />
        </>
      );
    });
    const { screen, render, userEvent } = await createDOM();
    await render(<Harness />);
    const btn = screen.querySelector(
      ".chord-fretboard__play-all",
    ) as HTMLElement;
    await userEvent(btn, "click");
    expect(
      screen.querySelector('[data-testid="call-count"]')?.textContent,
    ).toBe("1");
  });

  it("clicking the button triggers playChord with the chord's voicing midis", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const btn = screen.querySelector(
      ".chord-fretboard__play-all",
    ) as HTMLElement;
    await userEvent(btn, "click");
    expect(playChordMock).toHaveBeenCalledTimes(1);
    const [midis, opts] = playChordMock.mock.calls[0];
    expect(midis).toEqual([57, 62, 69, 78]);
    expect((opts as { targetIdPrefix?: string })?.targetIdPrefix).toBe(
      "chord-re-mayor",
    );
  });
});

describe("ChordFretboard — locked Spanish cell aria-labels (REQ-FRET-008)", () => {
  it("Re mayor cells carry the correct Spanish labels", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const expected = [
      ["A3", "0", "Cuerda A3, traste 0, nota La, acorde Re mayor"],
      ["D4", "0", "Cuerda D4, traste 0, nota Re, acorde Re mayor"],
      ["A4", "0", "Cuerda A4, traste 0, nota La, acorde Re mayor"],
      ["E5", "2", "Cuerda E5, traste 2, nota Fa sostenido, acorde Re mayor"],
    ];
    for (const [str, fret, label] of expected) {
      const cell = screen.querySelector(
        `.chord-fret[data-string="${str}"][data-fret="${fret}"]`,
      );
      expect(cell?.getAttribute("aria-label")).toBe(label);
    }
  });

  it("La con séptima (corrected) cells carry the correct Spanish labels", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={LA_CON_SEPTIMA} />);
    const expected = [
      ["A3", "0", "Cuerda A3, traste 0, nota La, acorde La con séptima"],
      ["D4", "5", "Cuerda D4, traste 5, nota Sol, acorde La con séptima"],
      [
        "A4",
        "4",
        "Cuerda A4, traste 4, nota Do sostenido, acorde La con séptima",
      ],
      ["E5", "0", "Cuerda E5, traste 0, nota Mi, acorde La con séptima"],
    ];
    for (const [str, fret, label] of expected) {
      const cell = screen.querySelector(
        `.chord-fret[data-string="${str}"][data-fret="${fret}"]`,
      );
      expect(cell?.getAttribute("aria-label")).toBe(label);
    }
  });

  it("Sol mayor cells carry the correct Spanish labels", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={SOL_MAYOR} />);
    const expected = [
      ["A3", "5", "Cuerda A3, traste 5, nota Re, acorde Sol mayor"],
      ["D4", "5", "Cuerda D4, traste 5, nota Sol, acorde Sol mayor"],
      ["A4", "0", "Cuerda A4, traste 0, nota La, acorde Sol mayor"],
      ["E5", "2", "Cuerda E5, traste 2, nota Fa sostenido, acorde Sol mayor"],
    ];
    for (const [str, fret, label] of expected) {
      const cell = screen.querySelector(
        `.chord-fret[data-string="${str}"][data-fret="${fret}"]`,
      );
      expect(cell?.getAttribute("aria-label")).toBe(label);
    }
  });

  it("Re menor cells carry the correct Spanish labels", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MENOR} />);
    const expected = [
      ["A3", "0", "Cuerda A3, traste 0, nota La, acorde Re menor"],
      ["D4", "0", "Cuerda D4, traste 0, nota Re, acorde Re menor"],
      ["A4", "1", "Cuerda A4, traste 1, nota Si bemol, acorde Re menor"],
      ["E5", "1", "Cuerda E5, traste 1, nota Fa, acorde Re menor"],
    ];
    for (const [str, fret, label] of expected) {
      const cell = screen.querySelector(
        `.chord-fret[data-string="${str}"][data-fret="${fret}"]`,
      );
      expect(cell?.getAttribute("aria-label")).toBe(label);
    }
  });

  it("Sol menor cells carry the correct Spanish labels", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={SOL_MENOR} />);
    const expected = [
      ["A3", "0", "Cuerda A3, traste 0, nota La, acorde Sol menor"],
      ["D4", "3", "Cuerda D4, traste 3, nota Fa, acorde Sol menor"],
      ["A4", "0", "Cuerda A4, traste 0, nota La, acorde Sol menor"],
      ["E5", "3", "Cuerda E5, traste 3, nota Sol, acorde Sol menor"],
    ];
    for (const [str, fret, label] of expected) {
      const cell = screen.querySelector(
        `.chord-fret[data-string="${str}"][data-fret="${fret}"]`,
      );
      expect(cell?.getAttribute("aria-label")).toBe(label);
    }
  });
});

describe("ChordFretboard — Diapason string CSS custom properties reuse (REQ-FRET-009)", () => {
  it("each string row carries the correct data-string-row and a matching per-string modifier class", async () => {
    // `vitest.config.ts` runs with `css: false`, so scoped-stylesheet
    // rule VALUES are never testable here — same reason Diapason's own
    // tests never assert on computed CSS, only class presence/naming.
    // An inline-style approach was tried and rejected: the test DOM's
    // lightweight style-attribute tokenizer cannot parse a multi-stop
    // `linear-gradient(...)` value and throws on any `.style.*` read.
    // The --string-thickness/--string-color custom properties are
    // declared per class in the scoped stylesheet (STYLES, matching
    // Diapason's own `.string-row--a3` etc. values verbatim) — this
    // test verifies the class-selection wiring that drives them.
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const expectedClass: Record<string, string> = {
      A3: "chord-fretboard__row--a3",
      D4: "chord-fretboard__row--d4",
      A4: "chord-fretboard__row--a4",
      E5: "chord-fretboard__row--e5",
    };
    for (const [stringId, cls] of Object.entries(expectedClass)) {
      const row = screen.querySelector(
        `.chord-fretboard__row[data-string-row="${stringId}"]`,
      ) as HTMLElement | null;
      expect(row).not.toBeNull();
      expect(row!.classList.contains(cls)).toBe(true);
    }
  });
});

/**
 * Unlike `TestHarness` (which only provides the context), this harness
 * also RENDERS the signal's value in a queryable `<p role="status">` —
 * the same ownership split as production, where the route/page owns
 * the visible status node and ChordFretboard only writes to it.
 */
const StatusHarness = component$<{ chord: Chord }>(({ chord }) => {
  const audioStatus = useSignal("");
  useContextProvider(AudioStatusContext, audioStatus);
  return (
    <>
      <p role="status">{audioStatus.value}</p>
      <ChordFretboard chord={chord} />
    </>
  );
});

describe("ChordFretboard — AudioStatusContext onStatus wiring (REQ-FRET-010)", () => {
  it("surfaces AUDIO_UNAVAILABLE_MESSAGE to the AudioStatusContext when playMidiNote rejects on a cell click", async () => {
    playMidiNoteMock.mockImplementation(async (_midi, opts) => {
      (opts as { onStatus?: (m: string) => void })?.onStatus?.(
        "Audio no disponible. Toca una nota para intentarlo de nuevo.",
      );
      return null;
    });

    const { screen, render, userEvent } = await createDOM();
    await render(<StatusHarness chord={RE_MAYOR} />);
    const cell = screen.querySelector(
      '.chord-fret[data-string="A3"][data-fret="0"]',
    ) as HTMLElement;
    await userEvent(cell, "click");
    const status = screen.querySelector('[role="status"]');
    expect(status?.textContent).toBe(
      "Audio no disponible. Toca una nota para intentarlo de nuevo.",
    );
  });
});

describe("ChordFretboard — focus order (REQ-FRET-011)", () => {
  it("orders cells E5 -> A4 -> D4 -> A3 in the DOM, ascending fret within each string", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const all = Array.from(screen.querySelectorAll("button"));
    const btnIdx = all.findIndex((b) =>
      b.classList.contains("chord-fretboard__play-all"),
    );
    const e5First = all.findIndex(
      (b) => b.getAttribute("data-string") === "E5",
    );
    const a4First = all.findIndex(
      (b) => b.getAttribute("data-string") === "A4",
    );
    const d4First = all.findIndex(
      (b) => b.getAttribute("data-string") === "D4",
    );
    const a3First = all.findIndex(
      (b) => b.getAttribute("data-string") === "A3",
    );
    expect(btnIdx).toBeLessThan(e5First);
    expect(e5First).toBeLessThan(a4First);
    expect(a4First).toBeLessThan(d4First);
    expect(d4First).toBeLessThan(a3First);
  });

  it("within the E5 row, frets ascend from 0 to 7", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const row = screen.querySelector(
      '.chord-fretboard__row[data-string-row="E5"]',
    );
    expect(row).not.toBeNull();
    const cells = Array.from(row!.querySelectorAll(".chord-fret"));
    const frets = cells.map((c) => Number(c.getAttribute("data-fret")));
    expect(frets).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("ChordFretboard — reduced motion (REQ-FRET-012)", () => {
  it("does not apply the playing flash when prefers-reduced-motion is set", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness chord={RE_MAYOR} />);
    const cell = screen.querySelector(
      '.chord-fret[data-string="E5"][data-fret="2"]',
    ) as HTMLElement;
    const view = cell.ownerDocument.defaultView as unknown as {
      matchMedia: (query: string) => { matches: boolean };
    };
    view.matchMedia = () => ({ matches: true });

    animTarget.publish({ midi: 78, targetId: "chord-re-mayor-E5-2" });
    expect(cell.classList.contains("chord-fret--playing")).toBe(false);
  });
});
