/**
 * Strict TDD — ScaleReference component tests.
 *
 * Asserts:
 *   - 12 note buttons rendered in chromatic order (Do, Do#, Re, Re#,
 *     Mi, Fa, Fa#, Sol, Sol#, La, La#, Si)
 *   - Each button has a sensible aria-label with the note name and
 *     MIDI number
 *   - In Re mayor, 7 notes are in-scale (note--in-scale) and 5 are not
 *   - In Re cromática, all 12 notes are in-scale
 *   - The tonic of diatonic scales gets the "tónica" marker
 *   - The tonic of the cromática scale is NOT marked (no tonic concept)
 *   - Each note is a real <button type="button">
 *   - data-midi, data-pc, data-in-scale, data-tonic attributes are set
 *   - Click on a note does not throw
 */
import { component$, useContextProvider, useSignal } from "@builder.io/qwik";
import { describe, expect, it } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";
import { ScaleReference } from "./scale-reference";
import { AudioStatusContext } from "../../audio/audio-status-context";
import type { ScaleId } from "../../music/scales";

/**
 * Test harness — wraps the ScaleReference with the AudioStatusContext
 * provider, matching how the ScaleSwitcher composes it in production.
 */
const TestHarness = component$<{ scaleId: ScaleId }>(({ scaleId }) => {
  const audioStatus = useSignal<string>("");
  useContextProvider(AudioStatusContext, audioStatus);
  return <ScaleReference scaleId={scaleId} />;
});

const CHROMATIC_NAMES = [
  "Do", "Do♯", "Re", "Re♯", "Mi", "Fa", "Fa♯", "Sol", "Sol♯", "La", "La♯", "Si",
];

describe("ScaleReference — chromatic sequence", () => {
  it("renders 12 note buttons in chromatic order", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const buttons = screen.querySelectorAll("button[data-pc]");
    expect(buttons.length).toBe(12);
    const labels = Array.from(buttons).map((b) =>
      b.querySelector(".note-name")?.textContent,
    );
    expect(labels).toEqual(CHROMATIC_NAMES);
  });

  it("every button carries a real <button type=\"button\">", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const buttons = screen.querySelectorAll("button[data-pc]");
    for (const btn of Array.from(buttons)) {
      expect(btn.tagName).toBe("BUTTON");
      expect(btn.getAttribute("type")).toBe("button");
    }
  });

  it("data-midi goes from 60 (C4) to 71 (B4) in chromatic order", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const buttons = Array.from(screen.querySelectorAll("button[data-pc]"));
    const midis = buttons.map((b) => Number(b.getAttribute("data-midi")));
    expect(midis).toEqual([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71]);
  });

  it("data-pc goes from 0 to 11", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const buttons = Array.from(screen.querySelectorAll("button[data-pc]"));
    const pcs = buttons.map((b) => Number(b.getAttribute("data-pc")));
    expect(pcs).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

describe("ScaleReference — diatonic (re-mayor)", () => {
  it("marks 7 notes as in-scale", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const inScale = screen.querySelectorAll(".note--in-scale");
    expect(inScale.length).toBe(7);
  });

  it("marks Do (PC 0) and Re♯ (PC 3) as NOT in-scale (Re mayor: 2, 4, 6, 7, 9, 11, 1)", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const doBtn = screen.querySelector('button[data-pc="0"]');
    const reSBtn = screen.querySelector('button[data-pc="3"]');
    expect(doBtn?.getAttribute("data-in-scale")).toBe("false");
    expect(reSBtn?.getAttribute("data-in-scale")).toBe("false");
  });

  it("marks Re (PC 2) as in-scale (the root)", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const re = screen.querySelector('button[data-pc="2"]');
    expect(re?.getAttribute("data-in-scale")).toBe("true");
    expect(re?.getAttribute("data-tonic")).toBe("true");
    expect(re?.classList.contains("note--tonic")).toBe(true);
  });

  it("the tonic marker is visible only on the root", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const tonics = screen.querySelectorAll(".note--tonic");
    expect(tonics.length).toBe(1);
    const marker = tonics[0].querySelector(".tonic-marker");
    expect(marker?.textContent).toBe("tónica");
  });

  it("aria-label includes the note name, MIDI number, and 'tónica' for the root", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const re = screen.querySelector('button[data-pc="2"]');
    const label = re?.getAttribute("aria-label") ?? "";
    expect(label).toContain("Re");
    expect(label).toContain("MIDI 62");
    expect(label).toContain("tónica");
  });

  it("aria-label for non-scale notes omits 'nota de la escala'", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const doBtn = screen.querySelector('button[data-pc="0"]');
    const label = doBtn?.getAttribute("aria-label") ?? "";
    expect(label).toContain("Do");
    expect(label).toContain("MIDI 60");
    expect(label).not.toContain("nota de la escala");
  });
});

describe("ScaleReference — cromática", () => {
  it("marks all 12 notes as in-scale", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-cromatica" />);
    const inScale = screen.querySelectorAll(".note--in-scale");
    expect(inScale.length).toBe(12);
  });

  it("does NOT mark any note as tonic (the chromatic scale has no tonic)", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-cromatica" />);
    const tonics = screen.querySelectorAll(".note--tonic");
    expect(tonics.length).toBe(0);
  });

  it("every button has 'nota de la escala' in its aria-label", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-cromatica" />);
    const buttons = Array.from(screen.querySelectorAll("button[data-pc]"));
    for (const btn of buttons) {
      const label = btn.getAttribute("aria-label") ?? "";
      expect(label).toContain("nota de la escala");
    }
  });
});

describe("ScaleReference — do-mayor (different key)", () => {
  it("marks Do (PC 0) as the tonic", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="do-mayor" />);
    const doBtn = screen.querySelector('button[data-pc="0"]');
    expect(doBtn?.getAttribute("data-tonic")).toBe("true");
    expect(doBtn?.classList.contains("note--tonic")).toBe(true);
  });

  it("marks 7 notes as in-scale (Do mayor: 0, 2, 4, 5, 7, 9, 11)", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="do-mayor" />);
    const inScale = screen.querySelectorAll(".note--in-scale");
    expect(inScale.length).toBe(7);
  });
});

describe("ScaleReference — keyboard activation", () => {
  it("clicking a note button does not throw", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const doBtn = screen.querySelector(
      'button[data-pc="0"]',
    ) as HTMLButtonElement | null;
    expect(doBtn).not.toBeNull();
    expect(() => doBtn!.click()).not.toThrow();
  });

  it("clicking an in-scale note (Re) does not throw", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const re = screen.querySelector(
      'button[data-pc="2"]',
    ) as HTMLButtonElement | null;
    expect(re).not.toBeNull();
    expect(() => re!.click()).not.toThrow();
  });
});

describe("ScaleReference — accessibility structure", () => {
  it("renders a <ol> for the chromatic sequence (semantic ordered list)", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const ol = screen.querySelector("ol.note-row");
    expect(ol).not.toBeNull();
  });

  it("wraps the group in role=\"group\" with aria-label", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness scaleId="re-mayor" />);
    const group = screen.querySelector('[role="group"]');
    expect(group).not.toBeNull();
    expect(group?.getAttribute("aria-label")).toBe("Vista lineal de la escala");
  });
});
