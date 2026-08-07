import { component$ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import { type NavEntry, NAV_ENTRIES } from './nav-entries';

// Re-export the data from the module so existing consumers keep working.
export { NAV_ENTRIES };
export type { NavEntry };

/**
 * Locked navigation contract (INV-4): exactly 4 entries.
 *
 * Visible styling lives in src/global.css (no useStylesScoped$) so first paint
 * is never blocked by Qwik's `<style hidden>` hydration trick.
 */
export const SideMenu = component$(() => {
  const loc = useLocation();
  const normalize = (p: string) =>
    p === '/' ? '/' : p.replace(/\/+$/, '');
  const isActive = (href: string) => normalize(loc.url.pathname) === normalize(href);

  return (
    <nav class="side-nav" aria-label="Navegación principal">
      <ul class="side-nav-list">
        {NAV_ENTRIES.map((entry) => {
          const active = isActive(entry.href);
          const className = [
            'side-nav-link',
            active ? 'side-nav-link-active' : '',
            entry.disabled ? 'side-nav-link-disabled' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li class="side-nav-item" key={entry.href}>
              {entry.disabled ? (
                <span
                  class={className}
                  aria-disabled="true"
                  data-testid={`nav-${entry.label.toLowerCase()}`}
                >
                  <span class="side-nav-label">{entry.label}</span>
                </span>
              ) : (
                <Link
                  href={entry.href}
                  class={className}
                  aria-current={active ? 'page' : undefined}
                  data-testid={`nav-${entry.label.toLowerCase()}`}
                >
                  <span class="side-nav-label">{entry.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
});