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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";
import { Diapason } from "./diapason";
import { AudioStatusContext } from "../../audio/audio-status-context";
import { DEFAULT_SCALE_ID, type ScaleId } from "../../music/scales";
import * as animTarget from "../../audio/anim-target";

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

describe("Diapason — anim-target subscription (T-5, risk callout R2)", () => {
  beforeEach(() => {
    animTarget.__resetAnimTargetForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    animTarget.__resetAnimTargetForTests();
  });

  it("subscribes to anim-target on mount and flashes the matching open-string cell for a tuning-* event", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);

    animTarget.publish({ midi: 57, targetId: "tuning-A3" });

    const openA3 = screen.querySelector(
      '.diapason-headstock-cell[data-string="A3"][data-fret="0"]',
    );
    expect(openA3).not.toBeNull();
    expect(openA3!.classList.contains("fret--playing")).toBe(true);
  });

  it("flashes the matching cell by MIDI for a scale-* event, preferring the open-string cell", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);

    // MIDI 62 = D4 open AND A3 fret 5 AND D4's own regular fret-0 cell.
    // The subscription must prefer the true open-string (headstock) cell.
    animTarget.publish({ midi: 62, targetId: "scale-re-mayor-2" });

    const openD4 = screen.querySelector(
      '.diapason-headstock-cell[data-string="D4"][data-fret="0"]',
    ) as HTMLElement;
    expect(openD4).not.toBeNull();
    expect(openD4.classList.contains("fret--playing")).toBe(true);

    const a3Fret5 = screen.querySelector(
      'button[data-string="A3"][data-fret="5"]',
    ) as HTMLElement;
    expect(a3Fret5.classList.contains("fret--playing")).toBe(false);

    const d4RegularFret0 = screen.querySelector(
      'button[data-string="D4"][data-fret="0"]:not(.diapason-headstock-cell)',
    ) as HTMLElement;
    expect(d4RegularFret0).not.toBeNull();
    expect(d4RegularFret0.classList.contains("fret--playing")).toBe(false);
  });

  it("does not flash when prefers-reduced-motion is set (matchMedia mocked on the render window)", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);

    const openA3 = screen.querySelector(
      '.diapason-headstock-cell[data-string="A3"][data-fret="0"]',
    ) as HTMLElement;
    const view = openA3.ownerDocument.defaultView as unknown as {
      matchMedia: (query: string) => { matches: boolean };
    };
    view.matchMedia = () => ({ matches: true });

    animTarget.publish({ midi: 57, targetId: "tuning-A3" });

    expect(openA3.classList.contains("fret--playing")).toBe(false);
  });

  it("unsubscribes when the captured cleanup fn runs — no listener leak across remounts (R2)", async () => {
    const subscribeSpy = vi.spyOn(animTarget, "subscribe");
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    const off = subscribeSpy.mock.results[0]?.value as (() => void) | undefined;
    expect(typeof off).toBe("function");

    const openA3 = screen.querySelector(
      '.diapason-headstock-cell[data-string="A3"][data-fret="0"]',
    ) as HTMLElement;

    // Simulate Qwik's cleanup(off) firing on component teardown.
    off!();

    animTarget.publish({ midi: 57, targetId: "tuning-A3" });
    expect(openA3.classList.contains("fret--playing")).toBe(false);
  });
});

describe("Diapason — click animation (T-6)", () => {
  // Fake timers are deliberately NOT used for the "removed after
  // 400ms" assertions below: flash()'s setTimeout is scheduled during
  // a REAL-timer click dispatched through Qwik's own QRL resolution
  // pipeline (userEvent). Switching to fake timers only AFTER that
  // real timer is already scheduled cannot control it — fake timers
  // only intercept timers scheduled after vi.useFakeTimers() runs. A
  // short real-time wait is simpler and avoids any risk of interfering
  // with Qwik's own async dispatch machinery.

  it("click on an in-scale cell applies .fret--playing, then removes it after 400ms", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);

    // A3 fret 2 = midi 59 = pc 11. Re mayor pitch classes: 1,2,4,6,7,9,11.
    const cell = screen.querySelector(
      'button[data-string="A3"][data-fret="2"]',
    ) as HTMLElement;
    expect(cell.classList.contains("fret--in-scale")).toBe(true);

    await userEvent(cell, "click");
    expect(cell.classList.contains("fret--playing")).toBe(true);
    expect(cell.classList.contains("fret--ghost")).toBe(false);

    await new Promise((r) => setTimeout(r, 410));
    expect(cell.classList.contains("fret--playing")).toBe(false);
  }, 2000);

  it("click on a non-scale cell applies .fret--ghost, then removes it after 400ms", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);

    // A3 fret 1 = midi 58 = pc 10. Not in Re mayor's pitch classes.
    const cell = screen.querySelector(
      'button[data-string="A3"][data-fret="1"]',
    ) as HTMLElement;
    expect(cell.classList.contains("fret--in-scale")).toBe(false);

    await userEvent(cell, "click");
    expect(cell.classList.contains("fret--ghost")).toBe(true);
    expect(cell.classList.contains("fret--playing")).toBe(false);

    await new Promise((r) => setTimeout(r, 410));
    expect(cell.classList.contains("fret--ghost")).toBe(false);
  }, 2000);

  it("in-scale click never applies the ghost class (red circle stays scale-only)", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const cell = screen.querySelector(
      'button[data-string="A3"][data-fret="2"]',
    ) as HTMLElement;
    await userEvent(cell, "click");
    expect(cell.classList.contains("fret--in-scale")).toBe(true);
    expect(cell.classList.contains("fret--ghost")).toBe(false);
  });

  it("clicking the open A3 headstock cell (in scale) applies .fret--playing", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const openA3 = screen.querySelector(
      '.diapason-headstock-cell[data-string="A3"][data-fret="0"]',
    ) as HTMLElement;
    await userEvent(openA3, "click");
    expect(openA3.classList.contains("fret--playing")).toBe(true);
  });

  it("does not flash on click when prefers-reduced-motion is set", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const cell = screen.querySelector(
      'button[data-string="A3"][data-fret="1"]',
    ) as HTMLElement;
    const view = cell.ownerDocument.defaultView as unknown as {
      matchMedia: (query: string) => { matches: boolean };
    };
    view.matchMedia = () => ({ matches: true });

    await userEvent(cell, "click");
    expect(cell.classList.contains("fret--ghost")).toBe(false);
    expect(cell.classList.contains("fret--playing")).toBe(false);
  });
});

describe("Diapason — gray ghost digitation element (T-7)", () => {
  it("renders exactly 36 fret__ghost spans (one per fret cell), all aria-hidden", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const buttons = Array.from(screen.querySelectorAll("button"));
    expect(buttons.length).toBe(36);
    const ghosts = Array.from(screen.querySelectorAll(".fret__ghost"));
    expect(ghosts.length).toBe(36);
    for (const ghost of ghosts) {
      expect(ghost.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("every fret cell contains its own fret__ghost span", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const buttons = Array.from(screen.querySelectorAll("button"));
    for (const btn of buttons) {
      const ghost = btn.querySelector(".fret__ghost");
      expect(ghost).toBeTruthy();
    }
  });

  it("the ghost span is present regardless of scale membership (always rendered, opacity governed by CSS)", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const inScaleCell = screen.querySelector(
      'button[data-string="A3"][data-fret="2"]',
    ) as HTMLElement;
    const nonScaleCell = screen.querySelector(
      'button[data-string="A3"][data-fret="1"]',
    ) as HTMLElement;
    expect(inScaleCell.querySelector(".fret__ghost")).toBeTruthy();
    expect(nonScaleCell.querySelector(".fret__ghost")).toBeTruthy();
  });
});

/**
 * Reactive harness — unlike `TestHarness` (which fixes `scaleId` for
 * the lifetime of the render), this owns a live `useSignal<ScaleId>`
 * and a button that flips it, exactly mirroring how `ScaleSwitcher`
 * drives `Diapason` in production (`<Diapason scaleId={scaleId.value} />`
 * where `scaleId` is a signal owned by the parent). Only a render
 * driven by an actual signal update — not a fresh mount with a
 * different initial prop — can catch a stale-closure bug in a `$()`
 * handler.
 */
const ReactiveHarness = component$(() => {
  const scaleId = useSignal<ScaleId>("re-mayor");
  const audioStatus = useSignal<string>("");
  useContextProvider(AudioStatusContext, audioStatus);
  return (
    <>
      <button
        type="button"
        class="switch-to-re-sharp"
        onClick$={() => {
          scaleId.value = "re#-mayor";
        }}
      >
        switch
      </button>
      <Diapason scaleId={scaleId.value} />
    </>
  );
});

describe("Diapason — click flash reflects a live scale switch (bugfix)", () => {
  beforeEach(() => {
    animTarget.__resetAnimTargetForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    animTarget.__resetAnimTargetForTests();
  });

  it("after switching from Re mayor to Re♯ mayor, clicking a fret that is in-scale for Re but NOT for Re♯ shows the ghost flash, not the playing flash", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<ReactiveHarness />);

    await userEvent(".switch-to-re-sharp", "click");

    // A3 fret 7 = MIDI 64, pitch class 4 (E). E IS one of Re mayor's
    // pitch classes {2,4,6,7,9,11,1} but is NOT one of Re♯ mayor's
    // {3,5,7,8,10,0,2} — so after the switch this cell must render
    // (and flash) as out-of-scale.
    const cell = screen.querySelector(
      'button[data-string="A3"][data-fret="7"]',
    ) as HTMLElement;
    expect(cell.classList.contains("fret--in-scale")).toBe(false);

    await userEvent(cell, "click");

    expect(cell.classList.contains("fret--ghost")).toBe(true);
    expect(cell.classList.contains("fret--playing")).toBe(false);
  });

  it("after switching from Re mayor to Re♯ mayor, clicking a fret that IS in-scale for Re♯ shows the playing flash", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<ReactiveHarness />);

    await userEvent(".switch-to-re-sharp", "click");

    // A3 fret 1 = MIDI 58, pitch class 10 (A♯) — in Re♯ mayor's
    // pitch classes {3,5,7,8,10,0,2}, not in Re mayor's.
    const cell = screen.querySelector(
      'button[data-string="A3"][data-fret="1"]',
    ) as HTMLElement;
    expect(cell.classList.contains("fret--in-scale")).toBe(true);

    await userEvent(cell, "click");

    expect(cell.classList.contains("fret--playing")).toBe(true);
    expect(cell.classList.contains("fret--ghost")).toBe(false);
  });
});
