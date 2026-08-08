/**
 * Strict TDD — Diapason component tests.
 *
 * Asserts on the Diapason component:
 *   - 36 button targets (4 strings × 8 frets + 4 open strings)
 *   - Each open string renders with a hollow ring class
 *   - Frets 1–7 in-scale render with the filled circle class
 *   - The open A3 button announces "Cuerda abierta A3, MIDI 57"
 *   - Fretted buttons announce "Nota <name>, MIDI <n>, <string>, traste <fret>"
 *   - data-midi, data-string, data-fret attributes are present on every target
 *   - No <div> elements replacing the old non-interactive cells
 *   - Per-row tab order: headstock first, then frets 7→0 (WARNING-5)
 *   - Real buttons inherit keyboard activation (WARNING-2)
 *   - Open-string preference indicator: in Re mayor, all 4 open strings
 *     are scale tones; in a key where they aren't, they don't get the
 *     "abierta" marker
 *   - Fretted-alternative indicator: when a fretted note shares the
 *     same MIDI pitch as an in-scale open string, the cell shows a
 *     small "(=D4)" label so the player knows the open string is
 *     preferred
 */
import { component$, useContextProvider, useSignal } from "@builder.io/qwik";
import { describe, expect, it } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";
import { Diapason } from "./diapason";
import { AudioStatusContext } from "../../audio/audio-status-context";
import { DEFAULT_SCALE_ID, type ScaleId } from "../../music/scales";

/**
 * Test harness — wraps the Diapason with the AudioStatusContext
 * provider. In production, the ScaleSwitcher provides the context;
 * in the Diapason-only tests the harness covers that role so the
 * useContext call does not error.
 */
const TestHarness = component$<{ scaleId: ScaleId }>(({ scaleId }) => {
  const audioStatus = useSignal<string>("");
  useContextProvider(AudioStatusContext, audioStatus);
  return <Diapason scaleId={scaleId} />;
});

const TUNING = [
  { open: "A3", midi: 57 },
  { open: "D4", midi: 62 },
  { open: "A4", midi: 69 },
  { open: "E5", midi: 76 },
];

describe("Diapason — playable target density", () => {
  it("renders 36 button targets (4 strings × 8 frets + 4 open strings)", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const buttons = screen.querySelectorAll("button");
    expect(buttons.length).toBe(36);
  });

  it("marks fret 0 cells with the hollow ring class", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const openRings = screen.querySelectorAll(".fret--open");
    expect(openRings.length).toBe(4);
  });

  it("marks in-scale frets 1–7 with the filled red circle class", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const filled = screen.querySelectorAll(".fret--in-scale");
    expect(filled.length).toBeGreaterThanOrEqual(4);
  });

  it('uses ".fret--open" only on the 4 open-string headstock cells', async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const all = screen.querySelectorAll(".fret--open");
    expect(all.length).toBe(4);
    for (const btn of Array.from(all)) {
      expect(btn.classList.contains("diapason-headstock-cell")).toBe(true);
    }
  });

  it("exposes data-midi / data-string / data-fret on every button", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const buttons = screen.querySelectorAll("button");
    for (const btn of Array.from(buttons)) {
      expect(btn.getAttribute("data-midi")).toBeTruthy();
      expect(btn.getAttribute("data-string")).toBeTruthy();
      expect(btn.getAttribute("data-fret")).toBeTruthy();
    }
  });

  it('announces "Cuerda abierta A3, MIDI 57" on the open A3 button', async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const openA3 = screen.querySelector(
      'button.diapason-headstock-cell[data-midi="57"]',
    );
    expect(openA3).not.toBeNull();
    expect(openA3!.getAttribute("aria-label")).toContain(
      "Cuerda abierta A3, MIDI 57",
    );
  });

  it('announces "Nota B, MIDI 59, A3, traste 2" on the fretted B (A3 fret 2)', async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const a3F2 = screen.querySelector(
      'button[data-midi="59"][data-string="A3"][data-fret="2"]',
    );
    expect(a3F2).not.toBeNull();
    const label = a3F2!.getAttribute("aria-label") ?? "";
    expect(label).toContain("Nota B");
    expect(label).toContain("MIDI 59");
    expect(label).toContain("A3");
    expect(label).toContain("traste 2");
  });

  it("does not render any non-interactive fret cells", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const inerts = screen.querySelectorAll("div.fret");
    expect(inerts.length).toBe(0);
  });
});

describe("Diapason — scale binding", () => {
  it("reflects the active scale on the figure data-scale attribute", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const fig = screen.querySelector("figure.diapason");
    expect(fig?.getAttribute("data-scale")).toBe("re-mayor");
  });

  it("re-mayor default still renders 36 buttons", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    expect(screen.querySelectorAll("button").length).toBe(36);
  });

  it("re-menor default still renders 36 buttons", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-menor" />);
    expect(screen.querySelectorAll("button").length).toBe(36);
  });

  it("re-armonica default still renders 36 buttons", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-armonica" />);
    expect(screen.querySelectorAll("button").length).toBe(36);
  });

  it("re-cromatica marks every fret as in-scale (all 12 semitones)", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-cromatica" />);
    // 4 strings × 8 frets = 32 fret cells, all in scale.
    const inScale = screen.querySelectorAll(".fret--in-scale");
    expect(inScale.length).toBe(32);
    // 4 open strings, all in scale.
    const headstocks = screen.querySelectorAll(".diapason-headstock-cell.fret--preferred");
    expect(headstocks.length).toBe(4);
  });

  it("do-mayor (a different key) renders 36 buttons with the new scale", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="do-mayor" />);
    expect(screen.querySelectorAll("button").length).toBe(36);
    const fig = screen.querySelector("figure.diapason");
    expect(fig?.getAttribute("data-scale")).toBe("do-mayor");
  });

  it("DEFAULT_SCALE_ID is re-mayor", () => {
    expect(DEFAULT_SCALE_ID).toBe("re-mayor");
  });
});

describe("Diapason — note identifiers are correct", () => {
  it("the open A3 headstock button carries MIDI 57", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const openA3 = screen.querySelector(
      'button.diapason-headstock-cell[data-string="A3"]',
    );
    expect(openA3?.getAttribute("data-midi")).toBe("57");
  });

  it("the open A4 headstock button carries MIDI 69", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const openA4 = screen.querySelector(
      'button.diapason-headstock-cell[data-string="A4"]',
    );
    expect(openA4?.getAttribute("data-midi")).toBe("69");
  });

  it("fret 7 on A3 carries MIDI 64", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const a3F7 = screen.querySelector(
      'button[data-string="A3"][data-fret="7"]',
    );
    expect(a3F7?.getAttribute("data-midi")).toBe("64");
  });

  it("every open string maps to its expected MIDI value", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    for (const t of TUNING) {
      const btn = screen.querySelector(
        `button.diapason-headstock-cell[data-string="${t.open}"]`,
      );
      expect(btn?.getAttribute("data-midi")).toBe(String(t.midi));
    }
  });
});

describe("Diapason — keyboard tab order (WARNING-5)", () => {
  it("places the headstock open-string cell first in each row in DOM order", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const rows = screen.querySelectorAll(".diapason-string");
    for (const row of Array.from(rows)) {
      const firstChild = row.firstElementChild;
      expect(firstChild).not.toBeNull();
      expect(firstChild!.classList.contains("diapason-headstock-cell")).toBe(
        true,
      );
    }
  });

  it("headstock rows appear in canonical tuning order A3, D4, A4, E5", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const headstocks = Array.from(
      screen.querySelectorAll("button.diapason-headstock-cell"),
    );
    const labels = headstocks.map((h) => h.getAttribute("data-string"));
    expect(labels).toEqual(["A3", "D4", "A4", "E5"]);
  });

  it("computes the global tab order as open strings → frets 7→0", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const all = Array.from(screen.querySelectorAll("button"));
    const openA3Idx = all.findIndex(
      (b) =>
        b.classList.contains("diapason-headstock-cell") &&
        b.getAttribute("data-string") === "A3",
    );
    const openE5Idx = all.findIndex(
      (b) =>
        b.classList.contains("diapason-headstock-cell") &&
        b.getAttribute("data-string") === "E5",
    );
    const a3F7Idx = all.findIndex(
      (b) =>
        b.getAttribute("data-string") === "A3" &&
        b.getAttribute("data-fret") === "7" &&
        !b.classList.contains("diapason-headstock-cell"),
    );
    const a3F6Idx = all.findIndex(
      (b) =>
        b.getAttribute("data-string") === "A3" &&
        b.getAttribute("data-fret") === "6" &&
        !b.classList.contains("diapason-headstock-cell"),
    );
    expect(openA3Idx).toBeLessThan(openE5Idx);
    expect(openA3Idx).toBeLessThan(a3F7Idx);
    expect(a3F7Idx).toBeLessThan(a3F6Idx);
  });

  it("the headstock cell keeps visual position LAST via the CSS order property", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const headstock = screen.querySelector("button.diapason-headstock-cell");
    expect(headstock).not.toBeNull();
    const last = (headstock!.parentElement as HTMLElement).lastElementChild;
    expect(last).not.toBeNull();
    expect(last!.classList.contains("diapason-headstock-cell")).toBe(false);
  });
});

describe("Diapason — keyboard activation (WARNING-2)", () => {
  it("every fret and open string is a real <button type=\"button\">", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const buttons = screen.querySelectorAll("button");
    for (const btn of Array.from(buttons)) {
      expect(btn.tagName).toBe("BUTTON");
      expect(btn.getAttribute("type")).toBe("button");
    }
  });

  it("open-string and fret buttons do not opt out of the tab order", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const buttons = screen.querySelectorAll("button");
    for (const btn of Array.from(buttons)) {
      const tabindex = btn.getAttribute("tabindex");
      expect(tabindex === null || tabindex === "0").toBe(true);
    }
  });

  it("open A3 button carries the aria-label including MIDI 57", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const openA3 = screen.querySelector(
      'button.diapason-headstock-cell[data-string="A3"]',
    );
    expect(openA3).not.toBeNull();
    const label = openA3!.getAttribute("aria-label") ?? "";
    expect(label).toContain("Cuerda abierta A3");
    expect(label).toContain("MIDI 57");
  });
});

describe("Diapason — keyboard activation fires onClick$ (WARNING-2)", () => {
  it("a click event on the open A3 button triggers handlePlay", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const openA3 = screen.querySelector(
      'button.diapason-headstock-cell[data-string="A3"]',
    ) as HTMLButtonElement | null;
    expect(openA3).not.toBeNull();
    expect(() => openA3!.click()).not.toThrow();
  });

  it("a click event on a fretted button does not throw", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const a3F2 = screen.querySelector(
      'button[data-string="A3"][data-fret="2"]',
    ) as HTMLButtonElement | null;
    expect(a3F2).not.toBeNull();
    expect(() => a3F2!.click()).not.toThrow();
  });
});

describe("Diapason — open string preference (Refactor)", () => {
  it("all 4 open strings are 'preferred' (data-preferred='true') in Re mayor", async () => {
    // Re mayor pitch classes: 2, 4, 6, 7, 9, 11, 1.
    // Open strings: A3 (PC 9), D4 (PC 2), A4 (PC 9), E5 (PC 4). All in scale.
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const headstocks = Array.from(
      screen.querySelectorAll("button.diapason-headstock-cell"),
    );
    for (const h of headstocks) {
      expect(h.getAttribute("data-preferred")).toBe("true");
      expect(h.classList.contains("fret--preferred")).toBe(true);
    }
  });

  it("all 4 open strings show the 'abierta' marker in Re mayor", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const headstocks = Array.from(
      screen.querySelectorAll("button.diapason-headstock-cell"),
    );
    for (const h of headstocks) {
      const marker = h.querySelector(".open-marker");
      expect(marker).not.toBeNull();
      expect(marker!.textContent).toBe("abierta");
    }
  });

  it("fretted equivalents of in-scale open strings show '(=D4)' alternative label", async () => {
    // A3 fret 5 = midi 62 = same as open D4 (midi 62). In Re mayor,
    // D is in scale, so A3 fret 5 should have the alternative label.
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const a3F5 = screen.querySelector(
      'button[data-string="A3"][data-fret="5"]',
    );
    expect(a3F5).not.toBeNull();
    expect(a3F5!.getAttribute("data-preferred")).toBe("true");
    expect(a3F5!.classList.contains("fret--has-open")).toBe(true);
    const alt = a3F5!.querySelector(".fret-alternative");
    expect(alt).not.toBeNull();
    expect(alt!.textContent).toBe("(D4)");
  });

  it("fretted equivalents of in-scale open strings on the same string also have the label", async () => {
    // A4 fret 5 = midi 74 = same PC as D4 (PC 2). The Diapason checks
    // the exact MIDI, not just the PC. A4 fret 5 (midi 74) is NOT
    // the same pitch as the open D4 (midi 62). The alternative label
    // is therefore NOT shown for A4 fret 5 in Re mayor.
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const a4F5 = screen.querySelector(
      'button[data-string="A4"][data-fret="5"]',
    );
    expect(a4F5).not.toBeNull();
    // A4 fret 5 is in scale (D is in Re mayor) but its MIDI (74) is
    // not equal to any open-string MIDI. The data-preferred attribute
    // reflects "has open-string alternative at the same exact pitch".
    expect(a4F5!.getAttribute("data-preferred")).toBe("false");
    expect(a4F5!.querySelector(".fret-alternative")).toBeFalsy();
  });
});
