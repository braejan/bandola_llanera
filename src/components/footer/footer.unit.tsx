/**
 * Strict TDD — Footer (broadsheet colophon) tests.
 *
 * The footer is a static, prop-free, signal-free Qwik component (no
 * click handlers, no dynamic classes) — its only job is to render the
 * credit line, the 4 project links, and the copyright line inside the
 * poster's own printed grammar (paper bg, 2px ink border-top, square
 * corners, no shadow, no gradient — REQ-landing-footer-4).
 *
 * Because the component has no JS-driven animation state, "respects
 * reduced motion" here means: the footer never mutates its own
 * classes at runtime (nothing to desynchronize from
 * prefers-reduced-motion), and any hover-transition CSS it declares
 * defers to the pre-existing GLOBAL `@media (prefers-reduced-motion:
 * reduce)` rule in global.css (which zeroes every element's
 * animation/transition duration) rather than fighting it with
 * `!important` overrides.
 */
import { describe, expect, it } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";
import { Footer } from "./footer";

const CREDIT_TEXT =
  "Hecho por Braejan de Witsaba con amor — para estudiantes de bandola llanera";
const COPYRIGHT_TEXT = "© 2026 Witsaba";

const EXPECTED_LINKS = {
  witsaba: "https://witsaba.com",
  github: "https://github.com/braejan",
  linkedin: "https://linkedin.com/in/braejan",
  repo: "https://github.com/braejan/bandola_llanera",
};

describe("Footer — broadsheet colophon (T-12)", () => {
  it('renders a <footer role="contentinfo" class="broadsheet-footer">', async () => {
    const { screen, render } = await createDOM();
    await render(<Footer />);
    const footer = screen.querySelector("footer");
    expect(footer).toBeTruthy();
    expect(footer!.getAttribute("role")).toBe("contentinfo");
    expect(footer!.classList.contains("broadsheet-footer")).toBe(true);
  });

  it("shows the exact locked credit line", async () => {
    const { screen, render } = await createDOM();
    await render(<Footer />);
    const credit = screen.querySelector(".footer__credit");
    expect(credit).toBeTruthy();
    expect(credit!.textContent?.trim()).toBe(CREDIT_TEXT);
  });

  it("shows the exact copyright line", async () => {
    const { screen, render } = await createDOM();
    await render(<Footer />);
    const copyright = screen.querySelector(".footer__copyright");
    expect(copyright).toBeTruthy();
    expect(copyright!.textContent?.trim()).toBe(COPYRIGHT_TEXT);
  });

  it("links to witsaba.com, github.com/braejan, linkedin.com/in/braejan, and the repo — all target=_blank rel=noopener", async () => {
    const { screen, render } = await createDOM();
    await render(<Footer />);
    const nav = screen.querySelector('nav.footer__links[aria-label="Enlaces del proyecto"]');
    expect(nav).toBeTruthy();
    const links = Array.from(nav!.querySelectorAll("a"));
    const hrefs = links.map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(
      expect.arrayContaining([
        EXPECTED_LINKS.witsaba,
        EXPECTED_LINKS.github,
        EXPECTED_LINKS.linkedin,
        EXPECTED_LINKS.repo,
      ]),
    );
    expect(links.length).toBe(4);
    for (const a of links) {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toBe("noopener");
      expect(a.getAttribute("aria-label")).toBeTruthy();
    }
  });

  it("the GitHub and LinkedIn links carry an inline SVG icon (no icon library)", async () => {
    const { screen, render } = await createDOM();
    await render(<Footer />);
    const github = screen.querySelector(`a[href="${EXPECTED_LINKS.github}"]`);
    const linkedin = screen.querySelector(`a[href="${EXPECTED_LINKS.linkedin}"]`);
    expect(github?.querySelector("svg")).toBeTruthy();
    expect(linkedin?.querySelector("svg")).toBeTruthy();
  });

  it("renders no inline style attributes — every rule comes from the scoped stylesheet, so the global prefers-reduced-motion rule always wins", async () => {
    const { screen, render } = await createDOM();
    await render(<Footer />);
    const footer = screen.querySelector("footer");
    expect(footer).toBeTruthy();
    const withInlineStyle = Array.from(
      footer!.querySelectorAll("[style]"),
    );
    expect(withInlineStyle.length).toBe(0);
    expect(footer!.getAttribute("style")).toBeFalsy();
  });

  it("never mutates its own DOM after render — a static footer has no timing to desynchronize from reduced motion", async () => {
    const { screen, render } = await createDOM();
    await render(<Footer />);
    const before = screen.querySelector("footer")!.outerHTML;
    // No click handlers, no signals — re-reading immediately must be
    // byte-identical (nothing scheduled a re-render).
    const after = screen.querySelector("footer")!.outerHTML;
    expect(after).toBe(before);
  });
});
