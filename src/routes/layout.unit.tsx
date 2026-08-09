/**
 * Strict TDD — root layout StudentMenu wiring.
 *
 * REQ-MENU-001/012: `<StudentMenu />` renders before `<Slot />`, so the
 * nav is a DOM SIBLING of the route's own content, never a descendant
 * — the layout was previously a bare `<Slot />`; wiring the menu
 * requires wrapping it in a fragment.
 */
import { describe, expect, it } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";
import { QwikCityMockProvider } from "@builder.io/qwik-city";
import Layout from "./layout";

describe("Layout — StudentMenu wiring (REQ-MENU-001/012)", () => {
  it('renders exactly one <nav aria-label="Menú del estudiante">, before the slotted route content', async () => {
    const { screen, render } = await createDOM();
    await render(
      <QwikCityMockProvider url="http://localhost/">
        <Layout>
          <main data-testid="route-main">contenido</main>
        </Layout>
      </QwikCityMockProvider>,
    );
    const nav = screen.querySelector('nav[aria-label="Menú del estudiante"]');
    const main = screen.querySelector('[data-testid="route-main"]');
    expect(nav).not.toBeNull();
    expect(main).not.toBeNull();
  });

  it("the nav is NOT a descendant of the slotted <main> — it is a sibling", async () => {
    const { screen, render } = await createDOM();
    await render(
      <QwikCityMockProvider url="http://localhost/">
        <Layout>
          <main data-testid="route-main">contenido</main>
        </Layout>
      </QwikCityMockProvider>,
    );
    const nav = screen.querySelector(
      'nav[aria-label="Menú del estudiante"]',
    ) as HTMLElement;
    const main = screen.querySelector(
      '[data-testid="route-main"]',
    ) as HTMLElement;
    expect(main.contains(nav)).toBe(false);
    expect(nav.contains(main)).toBe(false);
  });

  it("the nav comes BEFORE the slotted content in document order", async () => {
    const { screen, render } = await createDOM();
    await render(
      <QwikCityMockProvider url="http://localhost/">
        <Layout>
          <main data-testid="route-main">contenido</main>
        </Layout>
      </QwikCityMockProvider>,
    );
    const nav = screen.querySelector(
      'nav[aria-label="Menú del estudiante"]',
    ) as HTMLElement;
    const main = screen.querySelector(
      '[data-testid="route-main"]',
    ) as HTMLElement;
    // Node.DOCUMENT_POSITION_FOLLOWING = 4: main comes AFTER nav.
    const position = nav.compareDocumentPosition(main);
    expect(position & 4).toBeTruthy();
  });

  it("renders the nav exactly once (no duplicate on a different route)", async () => {
    const { screen, render } = await createDOM();
    await render(
      <QwikCityMockProvider url="http://localhost/acordes">
        <Layout>
          <main data-testid="route-main">acordes</main>
        </Layout>
      </QwikCityMockProvider>,
    );
    const navs = screen.querySelectorAll(
      'nav[aria-label="Menú del estudiante"]',
    );
    expect(navs.length).toBe(1);
  });
});
