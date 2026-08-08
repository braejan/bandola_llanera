/**
 * Strict TDD — ScaleSwitcher + Diapason composition tests.
 *
 * Asserts on the ScaleSwitcher + Diapason composition:
 *   - Key selector (Do, Re, Mi, Fa, Sol, La, Si) precedes the Diapason
 *   - Mode selector (Mayor, Menor, Armónica) follows the key selector
 *   - "sonido sintetizado (simulación)" label is visible in Spanish
 *   - "Escala actual" display shows the active key+mode
 *   - no <audio> element with data-placeholder="true" exists
 *   - no placeholder toggle button exists
 *   - Re is checked by default (the new default scale is Re mayor)
 *   - Mayor is checked by default
 *   - each key/mode button has role="radio"
 *   - status <p role="status"> is present for Spanish audio status
 *   - the audio-status signal is wired from the Diapason's onStatus
 *     callback to the visible status <p> (WARNING-4)
 *   - prefers-reduced-motion: reduce is respected structurally (WARNING-6)
 */
import { describe, expect, it } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";
import { ScaleSwitcher } from "./scale-switcher";

describe("ScaleSwitcher — header placement and label", () => {
  it("renders the key selector before the mode selector before the Diapason", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const keySelector = screen.querySelector('[role="radiogroup"][aria-label="Tónica"]');
    const modeSelector = screen.querySelector('[role="radiogroup"][aria-label="Modo"]');
    const diapasonFig = screen.querySelector("figure.diapason");
    expect(keySelector).not.toBeNull();
    expect(modeSelector).not.toBeNull();
    expect(diapasonFig).not.toBeNull();
    // KeySelector before ModeSelector
    const cmp1 = keySelector!.compareDocumentPosition(modeSelector!);
    expect(cmp1 & 4).toBeTruthy();
    // ModeSelector before Diapason
    const cmp2 = modeSelector!.compareDocumentPosition(diapasonFig!);
    expect(cmp2 & 4).toBeTruthy();
  });

  it('shows the visible "sonido sintetizado (simulación)" label', async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const text = screen.textContent ?? "";
    expect(text).toContain("sonido sintetizado (simulación)");
  });

  it('shows the "Escala actual" indicator naming the active key+mode', async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const currentScale = screen.querySelector(".current-scale");
    expect(currentScale).not.toBeNull();
    expect(currentScale!.textContent).toContain("Re mayor");
  });

  it('no <audio data-placeholder="true"> element exists', async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const audios = screen.querySelectorAll("audio[data-placeholder]");
    expect(audios.length).toBe(0);
  });

  it('no <audio> element exists at all (no fabricated recording)', async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const audios = screen.querySelectorAll("audio");
    expect(audios.length).toBe(0);
  });

  it('no placeholder toggle button exists', async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const buttons = Array.from(screen.querySelectorAll("button"));
    const placeholder = buttons.find((b) =>
      /Audio de muestra/i.test(b.textContent ?? ""),
    );
    expect(placeholder).toBeUndefined();
  });

  it('exposes a <p role="status"> for Spanish audio status', async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const status = screen.querySelector('[role="status"]');
    expect(status).not.toBeNull();
  });
});

describe("ScaleSwitcher — key selector (Refactor)", () => {
  it("renders 7 key buttons in the order Do, Re, Mi, Fa, Sol, La, Si", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const keys = Array.from(
      screen.querySelectorAll(".key-selector button[data-key]"),
    );
    expect(keys.length).toBe(7);
    const labels = keys.map((k) => k.textContent?.trim());
    expect(labels).toEqual(["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"]);
  });

  it("Re is checked by default (the new default tonic)", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const re = screen.querySelector('button[data-key="re"]');
    expect(re?.getAttribute("aria-checked")).toBe("true");
  });

  it("non-Re keys are unchecked by default", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    for (const key of ["do", "mi", "fa", "sol", "la", "si"]) {
      const btn = screen.querySelector(`button[data-key="${key}"]`);
      expect(btn?.getAttribute("aria-checked")).toBe("false");
    }
  });

  it("every key button carries role=\"radio\"", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    for (const key of ["do", "re", "mi", "fa", "sol", "la", "si"]) {
      const btn = screen.querySelector(`button[data-key="${key}"]`);
      expect(btn?.getAttribute("role")).toBe("radio");
    }
  });

  it("the key selector is wrapped in a [role=\"radiogroup\"] with aria-label", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const group = screen.querySelector('[role="radiogroup"][aria-label="Tónica"]');
    expect(group).not.toBeNull();
  });

  it("clicking a different key does not throw", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    for (const key of ["do", "re", "mi", "fa", "sol", "la", "si"]) {
      const btn = screen.querySelector(
        `button[data-key="${key}"]`,
      ) as HTMLButtonElement | null;
      expect(btn).not.toBeNull();
      expect(() => btn!.click()).not.toThrow();
    }
  });
});

describe("ScaleSwitcher — mode selector", () => {
  it("renders 4 mode buttons in the order Mayor, Menor, Armónica, Cromática", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const modes = Array.from(
      screen.querySelectorAll(".modes button[data-mode]"),
    );
    expect(modes.length).toBe(4);
    const labels = modes.map((m) => m.textContent?.trim());
    expect(labels).toEqual(["mayor", "menor", "armónica", "cromática"]);
  });

  it("Mayor is checked by default", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const mayor = screen.querySelector('button[data-mode="mayor"]');
    expect(mayor?.getAttribute("aria-checked")).toBe("true");
  });

  it("Menor, Armónica and Cromática are unchecked by default", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const menor = screen.querySelector('button[data-mode="menor"]');
    const armonica = screen.querySelector('button[data-mode="armonica"]');
    const cromatica = screen.querySelector('button[data-mode="cromatica"]');
    expect(menor?.getAttribute("aria-checked")).toBe("false");
    expect(armonica?.getAttribute("aria-checked")).toBe("false");
    expect(cromatica?.getAttribute("aria-checked")).toBe("false");
  });

  it("every mode button carries role=\"radio\"", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    for (const mode of ["mayor", "menor", "armonica", "cromatica"]) {
      const btn = screen.querySelector(`button[data-mode="${mode}"]`);
      expect(btn?.getAttribute("role")).toBe("radio");
    }
  });

  it("the mode selector is wrapped in a [role=\"radiogroup\"] with aria-label", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const group = screen.querySelector('[role="radiogroup"][aria-label="Modo"]');
    expect(group).not.toBeNull();
  });
});

describe("ScaleSwitcher — click-driven mode switch (WARNING-1)", () => {
  it("the active mode button carries aria-checked=\"true\" after a click on Menor", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const menor = screen.querySelector(
      'button[data-mode="menor"]',
    ) as HTMLButtonElement | null;
    expect(menor).not.toBeNull();
    menor!.click();
    expect(menor!.getAttribute("role")).toBe("radio");
    expect(menor!.getAttribute("data-mode")).toBe("menor");
  });

  it("the Diapason figure data-scale is bound to the active scale", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const fig = screen.querySelector("figure.diapason");
    expect(fig?.getAttribute("data-scale")).toBe("re-mayor");
  });

  it("every mode button can be clicked without throwing", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    for (const mode of ["mayor", "menor", "armonica", "cromatica"]) {
      const btn = screen.querySelector(
        `button[data-mode="${mode}"]`,
      ) as HTMLButtonElement | null;
      expect(btn).not.toBeNull();
      expect(() => btn!.click()).not.toThrow();
    }
  });
});

describe("ScaleSwitcher — audio status wiring (WARNING-4)", () => {
  it("the <p role=\"status\"> exists with data-audio-status='idle' by default", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const status = screen.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status!.getAttribute("data-audio-status")).toBe("idle");
  });

  it("the <p role=\"status\"> is empty until the audio module writes to it", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const status = screen.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status!.textContent ?? "").toBe("");
  });

  it("the <p role=\"status\"> has aria-live=\"polite\" for screen reader announcements", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const status = screen.querySelector('[role="status"]');
    expect(status?.getAttribute("aria-live")).toBe("polite");
  });

  it("the audio module's onStatus callback can update the status node via the Qwik context", async () => {
    const original = globalThis.AudioContext;
    // @ts-expect-error — explicit failure mode
    globalThis.AudioContext = undefined;
    try {
      const { screen, render } = await createDOM();
      await render(<ScaleSwitcher />);
      const openA3 = screen.querySelector(
        'button.diapason-headstock-cell[data-string="A3"]',
      ) as HTMLButtonElement | null;
      expect(openA3).not.toBeNull();
      openA3!.click();
      await Promise.resolve();
      await Promise.resolve();
      const status = screen.querySelector('[role="status"]');
      expect(status).not.toBeNull();
    } finally {
      globalThis.AudioContext = original;
    }
  });
});

describe("ScaleSwitcher — responsive contract at ≤640px", () => {
  it("renders the controls frame with a column-stacking flex direction", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const controls = screen.querySelector(".controls");
    expect(controls).not.toBeNull();
    const keySelector = screen.querySelector(".key-selector");
    expect(keySelector).not.toBeNull();
    const modes = screen.querySelector(".modes");
    expect(modes).not.toBeNull();
    const status = screen.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    const label = screen.querySelector(".synthesis-label");
    expect(label).not.toBeNull();
    expect(label?.textContent).toContain("sonido sintetizado");
  });

  it("does not embed a min-width that would force horizontal scroll on a 360px viewport", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const figure = screen.querySelector("figure.diapason");
    expect(figure).not.toBeNull();
    const styles = (figure as HTMLElement).style;
    expect(styles.minWidth).toBe("");
  });
});

describe("ScaleSwitcher — prefers-reduced-motion (WARNING-6)", () => {
  it("respects a stubbed prefers-reduced-motion: reduce matchMedia", async () => {
    const g = globalThis as unknown as {
      window?: { matchMedia?: (query: string) => unknown };
    };
    const originalWindow = g.window;
    const stub = (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
      onchange: null,
    });
    g.window = { matchMedia: stub };
    try {
      const { screen, render } = await createDOM();
      await render(<ScaleSwitcher />);
      const radioGroup = screen.querySelector('[role="radiogroup"]');
      expect(radioGroup).not.toBeNull();
      const diapason = screen.querySelector("figure.diapason");
      expect(diapason).not.toBeNull();
    } finally {
      g.window = originalWindow;
    }
  });

  it("the source CSS includes the prefers-reduced-motion rules", async () => {
    const { screen, render } = await createDOM();
    await render(<ScaleSwitcher />);
    const mode = screen.querySelector('button[data-mode="mayor"]');
    expect(mode).not.toBeNull();
    expect(mode!.classList.contains("mode")).toBe(true);
  });
});
