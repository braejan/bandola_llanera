/**
 * Strict TDD — Bandola (hero illustration) tests.
 *
 * Default rendering (no props) must stay byte-for-byte what the
 * landing page already ships — `brokenString` only changes output
 * when explicitly passed `true` (the 404 page's own use).
 */
import { describe, expect, it } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";
import { Bandola } from "./bandola";

describe("Bandola — default (no props), unchanged for the landing hero", () => {
  it('renders exactly 4 <line> strings at y="138", "158", "176", "192"', async () => {
    const { screen, render } = await createDOM();
    await render(<Bandola />);
    const svg = screen.querySelector("svg.bandola-svg")!;
    // Strings are horizontal (y1 === y2); frets are vertical lines and
    // must not be counted here.
    const strings = Array.from(svg.querySelectorAll("line")).filter(
      (l) => l.getAttribute("y1") === l.getAttribute("y2"),
    );
    const ys = strings.map((l) => l.getAttribute("y1")).sort();
    expect(ys).toEqual(["138", "158", "176", "192"]);
  });

  it("has the 4-string aria-label", async () => {
    const { screen, render } = await createDOM();
    await render(<Bandola />);
    const svg = screen.querySelector("svg.bandola-svg")!;
    expect(svg.getAttribute("aria-label")).toBe(
      "Silueta de bandola llanera con cuatro cuerdas y clavijero.",
    );
  });

  it("renders no correction stamp", async () => {
    const { screen, render } = await createDOM();
    await render(<Bandola />);
    expect(screen.querySelector("svg.bandola-svg text")).toBeFalsy();
  });
});

describe("Bandola — brokenString (404 page only)", () => {
  it("splits the 3rd string into two segments around the break, leaving the other 3 whole", async () => {
    const { screen, render } = await createDOM();
    await render(<Bandola brokenString />);
    const svg = screen.querySelector("svg.bandola-svg")!;
    const linesAtY176 = Array.from(svg.querySelectorAll('line[y1="176"]'));
    expect(linesAtY176.length).toBe(2);
    const x1s = linesAtY176.map((l) => l.getAttribute("x1")).sort();
    const x2s = linesAtY176.map((l) => l.getAttribute("x2")).sort();
    expect(x1s).toEqual(["302", "530"]);
    expect(x2s).toEqual(["495", "640"]);

    // The other 3 strings are untouched — still one continuous line each.
    for (const y of ["138", "158", "192"]) {
      expect(svg.querySelectorAll(`line[y1="${y}"]`).length).toBe(1);
    }
  });

  it("uses the broken-string aria-label", async () => {
    const { screen, render } = await createDOM();
    await render(<Bandola brokenString />);
    const svg = screen.querySelector("svg.bandola-svg")!;
    expect(svg.getAttribute("aria-label")).toBe(
      "Silueta de bandola llanera con una cuerda rota.",
    );
  });

  it('renders the "NO ENCONTRADA" correction stamp as decorative (inside the aria-labelled svg, no separate a11y announcement)', async () => {
    const { screen, render } = await createDOM();
    await render(<Bandola brokenString />);
    const svg = screen.querySelector("svg.bandola-svg")!;
    const text = svg.querySelector("text");
    expect(text).toBeTruthy();
    expect(text!.textContent?.trim()).toBe("NO ENCONTRADA");
  });
});
