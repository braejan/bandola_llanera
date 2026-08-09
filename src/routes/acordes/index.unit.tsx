/**
 * Strict TDD — /acordes route integration tests.
 *
 * Integrates all 4 capabilities: ChordData (CIRCLES), ChordFretboard
 * (3x rendered), ChordPlayback (playCircleSequence on the "Tocar
 * círculo completo" button), and StudentMenu is NOT re-tested here
 * (it lives in the layout, not this route). Covers:
 *   - toggling Mayor/Menor switches the 3 rendered chords
 *   - the rejected-audio status message surfaces on a cell click
 *   - the Spanish `head` meta is present
 *
 * `play-midi-note` is left UNMOCKED (real) so a stubbed
 * `AudioContext = undefined` genuinely exercises the rejection path —
 * the same trick `scale-switcher.unit.tsx` uses. Only `play-chord`'s
 * `playCircleSequence`/`playChord` are mocked, since the circle-level
 * sequencing itself is already fully covered by `play-chord.unit.ts`.
 */
import { describe, expect, it, vi } from "vitest";
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

async function renderAcordes() {
  const { screen, render, userEvent } = await createDOM();
  await render(
    <QwikCityMockProvider url="http://localhost/acordes">
      <Acordes />
    </QwikCityMockProvider>,
  );
  return { screen, userEvent };
}

describe("/acordes — renders the default (Mayor) circle", () => {
  it("renders exactly 3 ChordFretboard instances for La con séptima, Re mayor, Sol mayor", async () => {
    const { screen } = await renderAcordes();
    const boards = Array.from(screen.querySelectorAll(".chord-fretboard"));
    expect(boards.length).toBe(3);
    expect(boards.map((b) => b.getAttribute("data-chord"))).toEqual([
      "la-con-septima",
      "re-mayor",
      "sol-mayor",
    ]);
  });

  it('the "mayor" toggle is checked by default', async () => {
    const { screen } = await renderAcordes();
    const mayorBtn = screen.querySelector(
      'button[data-circle="joropo-d-mayor"]',
    );
    expect(mayorBtn?.getAttribute("aria-checked")).toBe("true");
  });
});

describe("/acordes — toggling Mayor/Menor switches the 3 rendered chords", () => {
  it("clicking the Menor toggle swaps to La con séptima, Re menor, Sol menor", async () => {
    const { screen, userEvent } = await renderAcordes();
    const menorBtn = screen.querySelector(
      'button[data-circle="joropo-d-menor"]',
    ) as HTMLElement;
    await userEvent(menorBtn, "click");

    const boards = Array.from(screen.querySelectorAll(".chord-fretboard"));
    expect(boards.map((b) => b.getAttribute("data-chord"))).toEqual([
      "la-con-septima",
      "re-menor",
      "sol-menor",
    ]);
  });

  it("the dominant (la-con-séptima) stays rendered across both circles", async () => {
    const { screen, userEvent } = await renderAcordes();
    const before = Array.from(screen.querySelectorAll(".chord-fretboard")).map(
      (b) => b.getAttribute("data-chord"),
    );
    expect(before).toContain("la-con-septima");

    const menorBtn = screen.querySelector(
      'button[data-circle="joropo-d-menor"]',
    ) as HTMLElement;
    await userEvent(menorBtn, "click");

    const after = Array.from(screen.querySelectorAll(".chord-fretboard")).map(
      (b) => b.getAttribute("data-chord"),
    );
    expect(after).toContain("la-con-septima");
  });

  it("toggling back to Mayor restores the major circle's 3 chords", async () => {
    const { screen, userEvent } = await renderAcordes();
    const menorBtn = screen.querySelector(
      'button[data-circle="joropo-d-menor"]',
    ) as HTMLElement;
    await userEvent(menorBtn, "click");
    const mayorBtn = screen.querySelector(
      'button[data-circle="joropo-d-mayor"]',
    ) as HTMLElement;
    await userEvent(mayorBtn, "click");

    const boards = Array.from(screen.querySelectorAll(".chord-fretboard"));
    expect(boards.map((b) => b.getAttribute("data-chord"))).toEqual([
      "la-con-septima",
      "re-mayor",
      "sol-mayor",
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
    const btn = Array.from(screen.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Tocar círculo completo",
    );
    expect(btn).toBeTruthy();
  });

  it("clicking it calls playCircleSequence with the active circle and a fresh AbortSignal", async () => {
    const { screen, userEvent } = await renderAcordes();
    const btn = Array.from(screen.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Tocar círculo completo",
    ) as HTMLElement;
    await userEvent(btn, "click");
    expect(playCircleSequenceMock).toHaveBeenCalledTimes(1);
    const [circle, opts] = playCircleSequenceMock.mock.calls[0];
    expect(circle.id).toBe("joropo-d-mayor");
    expect(opts?.signal).toBeInstanceOf(AbortSignal);
    expect(opts?.signal?.aborted).toBe(false);
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
