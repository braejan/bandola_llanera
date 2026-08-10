/**
 * Strict TDD — /404 route tests.
 *
 * Qwik City's file-based convention: `src/routes/404.tsx` is the
 * custom not-found page, inherits `layout.tsx`, and is statically
 * emitted as `404.html`. This route is static/prop-free like
 * `camino/index.tsx` — no signals, no click handlers beyond the
 * standard `<Link>` navigation.
 */
import { describe, expect, it } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";
import { QwikCityMockProvider } from "@builder.io/qwik-city";
import NotFound, { head } from "./404";

async function renderNotFound() {
  const { screen, render } = await createDOM();
  await render(
    <QwikCityMockProvider>
      <NotFound />
    </QwikCityMockProvider>,
  );
  return screen;
}

describe("/404 — content", () => {
  it('renders the "404" heading', async () => {
    const screen = await renderNotFound();
    const heading = screen.querySelector("h1");
    expect(heading?.textContent?.trim()).toBe("404");
  });

  it("states the page doesn't exist and how to recover", async () => {
    const screen = await renderNotFound();
    const text = screen.textContent ?? "";
    expect(text).toContain("La página que buscas no existe");
    expect(text).toContain("Volver al cartel");
  });

  it("renders the bandola illustration with the broken-string treatment", async () => {
    const screen = await renderNotFound();
    const svg = screen.querySelector("svg.bandola-svg");
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute("aria-label")).toBe(
      "Silueta de bandola llanera con una cuerda rota.",
    );
  });

  it('the CTA links to "/"', async () => {
    const screen = await renderNotFound();
    const cta = screen.querySelector('[data-testid="cta-home"]');
    expect(cta).toBeTruthy();
    expect(cta!.getAttribute("href")).toBe("/");
    expect(cta!.textContent?.trim()).toBe("Volver al cartel");
  });

  it('renders <footer class="broadsheet-footer" role="contentinfo"> after <main>, not inside it', async () => {
    const screen = await renderNotFound();
    const main = screen.querySelector("main.not-found");
    const footer = screen.querySelector("footer.broadsheet-footer");
    expect(main).toBeTruthy();
    expect(footer).toBeTruthy();
    expect(main!.contains(footer!)).toBe(false);
  });
});

describe("/404 — Spanish head meta", () => {
  it("has a Spanish title mentioning it's not found", () => {
    if (typeof head === "function") {
      throw new Error("Expected the route's head export to be a plain object");
    }
    expect(head.title).toContain("Página no encontrada");
  });

  it("has a noindex robots meta entry", () => {
    if (typeof head === "function") {
      throw new Error("Expected the route's head export to be a plain object");
    }
    const robotsMeta = (head.meta ?? []).find(
      (m) => "name" in m && m.name === "robots",
    );
    expect(robotsMeta?.content).toBe("noindex");
  });

  it("has exactly one Spanish description meta entry", () => {
    if (typeof head === "function") {
      throw new Error("Expected the route's head export to be a plain object");
    }
    const descriptionMetas = (head.meta ?? []).filter(
      (m) => "name" in m && m.name === "description",
    );
    expect(descriptionMetas.length).toBe(1);
    expect(descriptionMetas[0]?.content).toMatch(/página|cartel/i);
  });
});
