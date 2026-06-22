import { component$, useStylesScoped$ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import styles from './side-menu.module.css?inline';
import { type NavEntry, NAV_ENTRIES } from './nav-entries';

// Re-export the data from the module so existing consumers keep working.
export { NAV_ENTRIES };
export type { NavEntry };

interface SideMenuProps {
  /** Optional override for the entries shown — defaults to NAV_ENTRIES. */
  readonly entries?: ReadonlyArray<NavEntry>;
}

export const SideMenu = component$<SideMenuProps>((props) => {
  useStylesScoped$(styles);

  const loc = useLocation();
  const entries = props.entries ?? NAV_ENTRIES;

  return (
    <nav class="nav" aria-label="Navegación principal">
      <ul class="list">
        {entries.map((entry) => {
          const isActive = loc.url.pathname === entry.href;
          const className = [
            'link',
            isActive ? 'linkActive' : '',
            entry.disabled ? 'linkDisabled' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li class="item" key={entry.href}>
              {entry.disabled ? (
                <span
                  class={className}
                  aria-disabled="true"
                  data-testid={`nav-${entry.label.toLowerCase()}`}
                >
                  <span class="label">{entry.label}</span>
                </span>
              ) : (
                <Link
                  href={entry.href}
                  class={className}
                  aria-current={isActive ? 'page' : undefined}
                  data-testid={`nav-${entry.label.toLowerCase()}`}
                >
                  <span class="label">{entry.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
});
