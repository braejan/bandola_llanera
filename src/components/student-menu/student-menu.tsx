import { component$, useStylesScoped$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";

/**
 * StudentMenu — the persistent printed-paper strip above every route.
 *
 * A documented exception to DESIGN.md's original "no nav, no footer,
 * no second viewport" rule (REQ-MENU-001, amended a second time after
 * Footer): a single row of three items — Inicio / Joropo / Camino —
 * printed above the poster in the SAME paper-on-ink grammar as the
 * Footer, so it reads as another band of the same broadsheet, not as
 * chrome.
 *
 * `src/routes/layout.tsx` renders `<StudentMenu />` BEFORE `<Slot />`,
 * so this nav is always a DOM SIBLING of each route's `<main>`, never
 * a descendant (REQ-MENU-012). This component only owns the nav's own
 * markup; the sibling-vs-descendant placement is the layout's job.
 */

export interface StudentMenuItem {
  href: string;
  label: string;
  isActive?: (pathname: string) => boolean;
}

export const STUDENT_MENU_ITEMS: readonly StudentMenuItem[] = [
  {
    href: "/",
    label: "Inicio",
    isActive: (pathname) => pathname === "/",
  },
  {
    href: "/joropo",
    label: "Joropo",
    isActive: (pathname) => pathname.startsWith("/joropo"),
  },
  {
    href: "/camino",
    label: "Camino",
    isActive: (pathname) => pathname === "/camino",
  },
];

export const StudentMenu = component$(() => {
  useStylesScoped$(STYLES);

  const location = useLocation();
  const pathname = location.url.pathname;

  return (
    <nav class="student-menu" aria-label="Menú del estudiante">
      {STUDENT_MENU_ITEMS.map((item) => {
        const active = item.isActive
          ? item.isActive(pathname)
          : pathname === item.href;
        const cls = [
          "student-menu__item",
          active ? "student-menu__item--active" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <Link
            key={item.href}
            href={item.href}
            class={cls}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
});

const STYLES = `
  .student-menu {
    width: 100%;
    box-sizing: border-box;
    background: var(--color-paper);
    color: var(--color-ink);
    border-bottom: 2px solid var(--color-ink);
    border-top: none;
    border-left: none;
    border-right: none;
    border-radius: 0;
    box-shadow: none;
    background-image: none;
    padding: var(--space-3) var(--space-4);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-5);
  }

  .student-menu__item {
    position: relative;
    font-family: var(--font-display);
    letter-spacing: 0.02em;
    color: var(--color-ink);
    padding: var(--space-1) var(--space-2);
    border-bottom: 2px solid transparent;
    transition:
      color var(--motion-fast) var(--ease-printed),
      border-color var(--motion-fast) var(--ease-printed);
  }

  .student-menu__item:hover,
  .student-menu__item:focus-visible {
    color: var(--color-ground);
  }

  .student-menu__item--active {
    background: var(--color-paper);
    border-bottom-color: var(--color-ink);
  }

  @media (prefers-reduced-motion: reduce) {
    .student-menu__item {
      transition: none;
    }
  }

  /* No hamburger, no drawer — the strip stays on a single row and
     wraps onto a second line if it does not fit (REQ-MENU-010). */
  @media (max-width: 640px) {
    .student-menu {
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
    }
  }
`;
