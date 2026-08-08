/**
 * Strict TDD — landing route integration tests.
 *
 * Renders the actual route component (not an isolated fixture) so the
 * top CTA, the retired bottom CTA, and the ScaleSwitcher's #diapason
 * anchor target are all asserted against the real page tree.
 *
 * T-11: top CTA "Toca tu primera cuerda", bottom CTA retirement, meta
 * description update, #diapason anchor.
 * T-13: the mounted <Footer /> renders below <main>, not inside it.
 */
import { describe, expect, it } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";
import { QwikCityMockProvider } from "@builder.io/qwik-city";
import Index, { head } from "./index";

describe("Landing route — top CTA (T-11)", () => {
  it('renders the top CTA reading exactly "Toca tu primera cuerda"', async () => {
    const { screen, render } = await createDOM();
    await render(
      <QwikCityMockProvider>
        <Index />
      </QwikCityMockProvider>,
    );
    const cta = screen.querySelector('[data-testid="cta-top"]');
    expect(cta).toBeTruthy();
    expect(cta!.textContent?.trim()).toBe("Toca tu primera cuerda");
  });

  it('the top CTA links to "#diapason"', async () => {
    const { screen, render } = await createDOM();
    await render(
      <QwikCityMockProvider>
        <Index />
      </QwikCityMockProvider>,
    );
    const cta = screen.querySelector('[data-testid="cta-top"]');
    // Qwik City's <Link> normalizes a fragment-only href against the
    // current route (mocked as "/" by QwikCityMockProvider), so the
    // rendered attribute is "/#diapason" — still a same-page anchor,
    // and the correct absolute form for the real "/" deploy target.
    expect(cta?.getAttribute("href")).toBe("/#diapason");
  });

  it("the top CTA renders before the ScaleSwitcher in document order (first viewport)", async () => {
    const { screen, render } = await createDOM();
    await render(
      <QwikCityMockProvider>
        <Index />
      </QwikCityMockProvider>,
    );
    const cta = screen.querySelector('[data-testid="cta-top"]');
    const switcher = screen.querySelector("section.scale-switcher");
    expect(cta).toBeTruthy();
    expect(switcher).toBeTruthy();
    const position = cta!.compareDocumentPosition(switcher!);
    // Node.DOCUMENT_POSITION_FOLLOWING = 4: switcher comes AFTER cta.
    expect(position & 4).toBeTruthy();
  });

  it('retires the old bottom CTA ("Empezar el camino" / data-testid="cta")', async () => {
    const { screen, render } = await createDOM();
    await render(
      <QwikCityMockProvider>
        <Index />
      </QwikCityMockProvider>,
    );
    expect(screen.querySelector('[data-testid="cta"]')).toBeFalsy();
    const text = screen.textContent ?? "";
    expect(text).not.toContain("Empezar el camino");
  });

  it('marks the ScaleSwitcher section with id="diapason" as the CTA anchor target', async () => {
    const { screen, render } = await createDOM();
    await render(
      <QwikCityMockProvider>
        <Index />
      </QwikCityMockProvider>,
    );
    const section = screen.querySelector("section.scale-switcher");
    expect(section?.getAttribute("id")).toBe("diapason");
  });

  it("updates the meta description to the new CTA copy", () => {
    // `head` is exported typed as `DocumentHead`, a union of the plain
    // value and a `(props) => DocumentHeadValue` function form — the
    // actual export in index.tsx is the plain object, so narrow with
    // a type guard rather than assuming `.meta` exists unconditionally.
    if (typeof head === "function") {
      throw new Error("Expected the route's head export to be a plain object");
    }
    const descriptionMeta = head.meta?.find(
      (m) => "name" in m && m.name === "description",
    );
    expect(descriptionMeta?.content).toBe(
      "Toca tu primera cuerda — aprende bandola llanera con la afinación A3 – D4 – A4 – E5, escalas mayor, menor y armónica, y un diapason interactivo.",
    );
  });

  it("the meta description array still has exactly one description entry (no duplicate)", () => {
    if (typeof head === "function") {
      throw new Error("Expected the route's head export to be a plain object");
    }
    const descriptionMetas = (head.meta ?? []).filter(
      (m) => "name" in m && m.name === "description",
    );
    expect(descriptionMetas.length).toBe(1);
  });
});

describe("Landing route — Footer mount (T-13)", () => {
  it('renders <footer class="broadsheet-footer" role="contentinfo"> AFTER <main class="poster">, not inside it', async () => {
    const { screen, render } = await createDOM();
    await render(
      <QwikCityMockProvider>
        <Index />
      </QwikCityMockProvider>,
    );
    const main = screen.querySelector("main.poster");
    const footer = screen.querySelector("footer.broadsheet-footer");
    expect(main).toBeTruthy();
    expect(footer).toBeTruthy();
    expect(footer!.getAttribute("role")).toBe("contentinfo");
    // The footer must NOT be a descendant of <main> — it sits below
    // the poster as its own printed colophon, not inside it.
    expect(main!.contains(footer!)).toBe(false);
    // And it must come AFTER <main> in document order.
    const position = main!.compareDocumentPosition(footer!);
    expect(position & 4).toBeTruthy();
  });

  it("shows the footer credit text at the page root", async () => {
    const { screen, render } = await createDOM();
    await render(
      <QwikCityMockProvider>
        <Index />
      </QwikCityMockProvider>,
    );
    const text = screen.textContent ?? "";
    expect(text).toContain(
      "Hecho por Braejan de Witsaba con amor — para estudiantes de bandola llanera",
    );
  });
});
