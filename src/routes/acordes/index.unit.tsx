/**
 * Strict TDD — /acordes route integration tests.
 *
 * Integrates ChordData (12-tono circles), the ChordCarousel (which
 * renders 3x ChordFretboard internally), and ChordPlayback
 * (playCircleSequence on the "Tocar círculo completo" button, and its
 * onChordStart wiring driving the carousel's active slide).
 * StudentMenu is NOT re-tested here (it lives in the layout, not this
 * route). Covers:
 *   - default tono (Re) + modo (mayor) render the right 3 chords
 *   - switching tono / modo swaps the rendered chords
 *   - the rejected-audio status message surfaces on a cell click
 *   - playCircleSequence's onChordStart drives the carousel's slide
 *   - the Spanish `head` meta is present
 *
 * `play-midi-note` is left UNMOCKED (real) so a stubbed
 * `AudioContext = undefined` genuinely exercises the rejection path —
 * the same trick `scale-switcher.unit.tsx` uses. Only `play-chord`'s
 * `playCircleSequence`/`playChord` are mocked.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";
import { QwikCityMockProvider } from "@builder.io/qwik-city";

vi.mock("../../audio/play-chord", () => ({
  playChord: vi.fn().mockResolvedValue(undefined),
  playCircleSequence: vi.fn().mockResolvedValue(undefined),
  AUDIO_UNAVAILABLE_MESSAGE:
    "Audio no disponible. Toca una nota para intentarlo de nuevo.",
}));

import { playCircleSequence } from "../../audio/play-chord";
import Acordes, { head } from "./index";

const playCircleSequenceMock = vi.mocked(playCircleSequence);

beforeEach(() => {
  vi.clearAllMocks();
  playCircleSequenceMock.mockResolvedValue(undefined);
});

async function renderAcordes() {
  const { screen, render, userEvent } = await createDOM();
  await render(
    <QwikCityMockProvider url="http://localhost/acordes">
      <Acordes />
    </QwikCityMockProvider>,
  );
  return { screen, userEvent };
}

function findButtonByText(
  screen: { querySelectorAll: (sel: string) => NodeListOf<Element> },
  text: string,
): HTMLElement {
  const btn = Array.from(screen.querySelectorAll("button")).find(
    (b) => b.textContent?.trim() === text,
  );
  if (!btn) throw new Error(`No button with text "${text}"`);
  return btn as HTMLElement;
}

describe("/acordes — renders the default tono (Re) and modo (mayor)", () => {
  it("renders exactly 3 ChordFretboard instances for La con séptima, Re mayor, Sol mayor", async () => {
    const { screen } = await renderAcordes();
    const boards = Array.from(screen.querySelectorAll(".chord-fretboard"));
    expect(boards.length).toBe(3);
    expect(boards.map((b) => b.getAttribute("data-chord"))).toEqual([
      "la-con-septima",
      "re-mayor",
      "sol-mayor-cuarta",
    ]);
  });

  it("shows the big tono letter (D for Re)", async () => {
    const { screen } = await renderAcordes();
    expect(screen.querySelector(".tono-letter")?.textContent).toBe("D");
  });

  it('"Re" is checked in the tono selector, and "mayor" in the modo selector', async () => {
    const { screen } = await renderAcordes();
    expect(
      screen.querySelector('button[data-tono="re"]')?.getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen
        .querySelector('button[data-quality="mayor"]')
        ?.getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("shows the current circle label", async () => {
    const { screen } = await renderAcordes();
    expect(screen.querySelector(".current-circle")?.textContent).toBe(
      "Círculo de Re mayor",
    );
  });
});

describe("/acordes — switching tono swaps the rendered chords", () => {
  it("clicking Sol switches to the Sol mayor circle (Re con séptima, Sol mayor, Do mayor)", async () => {
    const { screen, userEvent } = await renderAcordes();
    const solBtn = screen.querySelector(
      'button[data-tono="sol"]',
    ) as HTMLElement;
    await userEvent(solBtn, "click");

    const boards = Array.from(screen.querySelectorAll(".chord-fretboard"));
    expect(boards.map((b) => b.getAttribute("data-chord"))).toEqual([
      "re-con-septima",
      "sol-mayor",
      "do-mayor-cuarta",
    ]);
    expect(screen.querySelector(".current-circle")?.textContent).toBe(
      "Círculo de Sol mayor",
    );
    expect(screen.querySelector(".tono-letter")?.textContent).toBe("G");
  });
});

describe("/acordes — switching modo swaps the rendered chords", () => {
  it("clicking menor swaps to La con séptima, Re menor, Sol menor", async () => {
    const { screen, userEvent } = await renderAcordes();
    const menorBtn = screen.querySelector(
      'button[data-quality="menor"]',
    ) as HTMLElement;
    await userEvent(menorBtn, "click");

    const boards = Array.from(screen.querySelectorAll(".chord-fretboard"));
    expect(boards.map((b) => b.getAttribute("data-chord"))).toEqual([
      "la-con-septima",
      "re-menor",
      "sol-menor-cuarta",
    ]);
  });

  it("the dominant (la-con-séptima) stays rendered across both modos", async () => {
    const { screen, userEvent } = await renderAcordes();
    const before = Array.from(screen.querySelectorAll(".chord-fretboard")).map(
      (b) => b.getAttribute("data-chord"),
    );
    expect(before).toContain("la-con-septima");

    const menorBtn = screen.querySelector(
      'button[data-quality="menor"]',
    ) as HTMLElement;
    await userEvent(menorBtn, "click");

    const after = Array.from(screen.querySelectorAll(".chord-fretboard")).map(
      (b) => b.getAttribute("data-chord"),
    );
    expect(after).toContain("la-con-septima");
  });

  it("toggling back to mayor restores the major circle's 3 chords", async () => {
    const { screen, userEvent } = await renderAcordes();
    const menorBtn = screen.querySelector(
      'button[data-quality="menor"]',
    ) as HTMLElement;
    await userEvent(menorBtn, "click");
    const mayorBtn = screen.querySelector(
      'button[data-quality="mayor"]',
    ) as HTMLElement;
    await userEvent(mayorBtn, "click");

    const boards = Array.from(screen.querySelectorAll(".chord-fretboard"));
    expect(boards.map((b) => b.getAttribute("data-chord"))).toEqual([
      "la-con-septima",
      "re-mayor",
      "sol-mayor-cuarta",
    ]);
  });
});

describe("/acordes — rejected-audio status message", () => {
  it('surfaces AUDIO_UNAVAILABLE_MESSAGE in the <p role="status"> when a cell click fails to acquire audio', async () => {
    const original = globalThis.AudioContext;
    // @ts-expect-error — explicit failure mode, mirrors scale-switcher.unit.tsx
    globalThis.AudioContext = undefined;
    try {
      const { screen, userEvent } = await renderAcordes();
      const cell = screen.querySelector(
        '.chord-fret--in-chord[data-string="A3"][data-fret="0"]',
      ) as HTMLElement;
      expect(cell).toBeTruthy();
      await userEvent(cell, "click");
      const status = screen.querySelector('[role="status"]');
      expect(status?.textContent).toBe(
        "Audio no disponible. Toca una nota para intentarlo de nuevo.",
      );
    } finally {
      globalThis.AudioContext = original;
    }
  });

  it('the status <p> has aria-live="polite" and is empty by default', async () => {
    const { screen } = await renderAcordes();
    const status = screen.querySelector('[role="status"]');
    expect(status?.getAttribute("aria-live")).toBe("polite");
    expect(status?.textContent ?? "").toBe("");
  });
});

describe('/acordes — "Tocar círculo completo" button', () => {
  it("renders with the exact locked label", async () => {
    const { screen } = await renderAcordes();
    expect(() => findButtonByText(screen, "Tocar círculo completo")).not.toThrow();
  });

  it("clicking it calls playCircleSequence with the active circle and a fresh AbortSignal", async () => {
    const { screen, userEvent } = await renderAcordes();
    const btn = findButtonByText(screen, "Tocar círculo completo");
    await userEvent(btn, "click");
    expect(playCircleSequenceMock).toHaveBeenCalledTimes(1);
    const [circle, opts] = playCircleSequenceMock.mock.calls[0];
    expect(circle.id).toBe("joropo-re-mayor");
    expect(opts?.signal).toBeInstanceOf(AbortSignal);
    expect(opts?.signal?.aborted).toBe(false);
  });

  it("plays the currently selected tono/modo, not always the default", async () => {
    const { screen, userEvent } = await renderAcordes();
    const solBtn = screen.querySelector(
      'button[data-tono="sol"]',
    ) as HTMLElement;
    await userEvent(solBtn, "click");
    const btn = findButtonByText(screen, "Tocar círculo completo");
    await userEvent(btn, "click");
    const [circle] = playCircleSequenceMock.mock.calls[0];
    expect(circle.id).toBe("joropo-sol-mayor");
  });
});

describe("/acordes — onChordStart drives the carousel's active slide", () => {
  it("moves the carousel track to the chord playCircleSequence reports via onChordStart", async () => {
    playCircleSequenceMock.mockImplementation(async (circle, opts) => {
      opts?.onChordStart?.(circle.chords[2], 4);
    });
    const { screen, userEvent } = await renderAcordes();
    const btn = findButtonByText(screen, "Tocar círculo completo");
    await userEvent(btn, "click");

    const track = screen.querySelector(
      ".chord-carousel__track",
    ) as HTMLElement;
    expect(track.style.transform).toBe("translateX(-200%)");
  });
});

describe("/acordes — Spanish head meta", () => {
  it("has a Spanish title mentioning Acordes", () => {
    if (typeof head === "function") {
      throw new Error("Expected the route's head export to be a plain object");
    }
    expect(head.title).toContain("Acordes");
  });

  it("has exactly one Spanish description meta entry", () => {
    if (typeof head === "function") {
      throw new Error("Expected the route's head export to be a plain object");
    }
    const descriptionMetas = (head.meta ?? []).filter(
      (m) => "name" in m && m.name === "description",
    );
    expect(descriptionMetas.length).toBe(1);
    expect(descriptionMetas[0]?.content).toBeTruthy();
    // Spanish-specific accented/diacritic content, not a generic
    // English word — a light but concrete signal this is Spanish copy.
    expect(descriptionMetas[0]?.content).toMatch(/acorde|círculo|joropo/i);
  });
});

describe("/acordes — Footer mount", () => {
  it('renders <footer class="broadsheet-footer" role="contentinfo"> AFTER <main class="acordes">, not inside it', async () => {
    const { screen } = await renderAcordes();
    const main = screen.querySelector("main.acordes");
    const footer = screen.querySelector("footer.broadsheet-footer");
    expect(main).toBeTruthy();
    expect(footer).toBeTruthy();
    expect(footer!.getAttribute("role")).toBe("contentinfo");
    expect(main!.contains(footer!)).toBe(false);
    const position = main!.compareDocumentPosition(footer!);
    expect(position & 4).toBeTruthy();
  });

  it("shows the footer credit text on /acordes", async () => {
    const { screen } = await renderAcordes();
    const text = screen.textContent ?? "";
    expect(text).toContain(
      "Creado por braejan desde los llanos de Casanare 🇨🇴 con 💛💙❤️ para estudiantes de la bandola llanera",
    );
  });
});
