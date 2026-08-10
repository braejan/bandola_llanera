/**
 * Strict TDD — StudentMenu component tests.
 *
 * Asserts on the StudentMenu component:
 *   - a <nav aria-label="Menú del estudiante"> with 3 <a> in order
 *     (REQ-MENU-001/002)
 *   - hrefs are "/", "/joropo", "/camino" (REQ-MENU-003)
 *   - aria-current="page" on the matching item, absent elsewhere,
 *     including the nested /joropo/* case (REQ-MENU-004/005)
 *   - the active item carries the active class, others don't
 *     (REQ-MENU-006)
 *   - exact Spanish labels (REQ-MENU-007)
 *   - the typed readonly StudentMenuItem[] data source (REQ-MENU-008)
 *   - items stay real, focusable, always-visible <a> elements — no
 *     hamburger/drawer collapse (REQ-MENU-009/010)
 *
 * `QwikCityMockProvider`'s `url` prop mocks `useLocation()` per test —
 * confirmed present/working in `src/routes/index.unit.tsx`.
 */
import { describe, expect, it } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";
import { QwikCityMockProvider } from "@builder.io/qwik-city";
import {
  StudentMenu,
  STUDENT_MENU_ITEMS,
  type StudentMenuItem,
} from "./student-menu";

async function renderAt(pathname: string) {
  const { screen, render } = await createDOM();
  await render(
    <QwikCityMockProvider url={`http://localhost${pathname}`}>
      <StudentMenu />
    </QwikCityMockProvider>,
  );
  return screen;
}

describe("StudentMenu — persistent nav (REQ-MENU-001)", () => {
  it('renders exactly one <nav aria-label="Menú del estudiante">', async () => {
    const screen = await renderAt("/");
    const navs = screen.querySelectorAll(
      'nav[aria-label="Menú del estudiante"]',
    );
    expect(navs.length).toBe(1);
  });
});

describe("StudentMenu — item order and hrefs (REQ-MENU-002/003)", () => {
  it("renders exactly 3 items, in order Inicio, Joropo, Camino", async () => {
    const screen = await renderAt("/");
    const links = Array.from(
      screen.querySelectorAll('nav[aria-label="Menú del estudiante"] a'),
    );
    expect(links.length).toBe(3);
    expect(links.map((a) => a.textContent?.trim())).toEqual([
      "Inicio",
      "Joropo",
      "Camino",
    ]);
  });

  it('hrefs are exactly "/", "/joropo", "/camino" in that order', async () => {
    const screen = await renderAt("/");
    const links = Array.from(
      screen.querySelectorAll('nav[aria-label="Menú del estudiante"] a'),
    );
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/",
      "/joropo",
      "/camino",
    ]);
  });
});

describe("StudentMenu — aria-current on the active item (REQ-MENU-004/005)", () => {
  it("Inicio is active on the landing route", async () => {
    const screen = await renderAt("/");
    const links = Array.from(
      screen.querySelectorAll('nav[aria-label="Menú del estudiante"] a'),
    );
    expect(links[0].getAttribute("aria-current")).toBe("page");
    expect(links[1].getAttribute("aria-current")).toBeNull();
    expect(links[2].getAttribute("aria-current")).toBeNull();
  });

  it("Joropo is active on /joropo", async () => {
    const screen = await renderAt("/joropo");
    const links = Array.from(
      screen.querySelectorAll('nav[aria-label="Menú del estudiante"] a'),
    );
    expect(links[0].getAttribute("aria-current")).toBeNull();
    expect(links[1].getAttribute("aria-current")).toBe("page");
    expect(links[2].getAttribute("aria-current")).toBeNull();
  });

  it("Joropo stays active on a nested /joropo/* path", async () => {
    const screen = await renderAt("/joropo/alguna-sub-ruta");
    const links = Array.from(
      screen.querySelectorAll('nav[aria-label="Menú del estudiante"] a'),
    );
    expect(links[1].getAttribute("aria-current")).toBe("page");
  });

  it("Camino is active on /camino", async () => {
    const screen = await renderAt("/camino");
    const links = Array.from(
      screen.querySelectorAll('nav[aria-label="Menú del estudiante"] a'),
    );
    expect(links[0].getAttribute("aria-current")).toBeNull();
    expect(links[1].getAttribute("aria-current")).toBeNull();
    expect(links[2].getAttribute("aria-current")).toBe("page");
  });

  it("no item is active on an unrelated route — none carry aria-current", async () => {
    const screen = await renderAt("/algo-mas");
    const links = Array.from(
      screen.querySelectorAll('nav[aria-label="Menú del estudiante"] a'),
    );
    for (const a of links) {
      expect(a.getAttribute("aria-current")).toBeNull();
    }
  });
});

describe("StudentMenu — active visual class (REQ-MENU-006)", () => {
  it("only the Joropo item carries the active class on /joropo", async () => {
    const screen = await renderAt("/joropo");
    const links = Array.from(
      screen.querySelectorAll('nav[aria-label="Menú del estudiante"] a'),
    );
    expect(links[1].classList.contains("student-menu__item--active")).toBe(
      true,
    );
    expect(links[0].classList.contains("student-menu__item--active")).toBe(
      false,
    );
    expect(links[2].classList.contains("student-menu__item--active")).toBe(
      false,
    );
  });
});

describe("StudentMenu — exact Spanish labels (REQ-MENU-007)", () => {
  it('labels are exactly "Inicio", "Joropo", "Camino"', async () => {
    const screen = await renderAt("/");
    const links = Array.from(
      screen.querySelectorAll('nav[aria-label="Menú del estudiante"] a'),
    );
    expect(links.map((a) => a.textContent)).toEqual([
      "Inicio",
      "Joropo",
      "Camino",
    ]);
  });
});

describe("StudentMenu — typed data source (REQ-MENU-008)", () => {
  it("STUDENT_MENU_ITEMS has exactly 3 entries with href, label, and isActive", () => {
    expect(STUDENT_MENU_ITEMS.length).toBe(3);
    for (const item of STUDENT_MENU_ITEMS as StudentMenuItem[]) {
      expect(typeof item.href).toBe("string");
      expect(typeof item.label).toBe("string");
      expect(typeof item.isActive).toBe("function");
    }
  });

  it("each item's isActive predicate matches its own href literally", () => {
    for (const item of STUDENT_MENU_ITEMS as StudentMenuItem[]) {
      expect(item.isActive!(item.href)).toBe(true);
    }
  });
});

describe("StudentMenu — keyboard/no-hamburger contract (REQ-MENU-009/010)", () => {
  it("all 3 items are real <a> elements with no tabindex opt-out", async () => {
    const screen = await renderAt("/");
    const links = Array.from(
      screen.querySelectorAll('nav[aria-label="Menú del estudiante"] a'),
    );
    for (const a of links) {
      expect(a.tagName).toBe("A");
      const tabindex = a.getAttribute("tabindex");
      expect(tabindex === null || tabindex === "0").toBe(true);
    }
  });

  it("no hamburger/toggle button exists — the 3 items are unconditionally rendered", async () => {
    const screen = await renderAt("/");
    const buttons = screen.querySelectorAll(
      'nav[aria-label="Menú del estudiante"] button',
    );
    expect(buttons.length).toBe(0);
    const links = screen.querySelectorAll(
      'nav[aria-label="Menú del estudiante"] a',
    );
    expect(links.length).toBe(3);
  });
});
