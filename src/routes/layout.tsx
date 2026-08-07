import { component$, Slot } from '@builder.io/qwik';
import { SideMenu } from '~/components/side-menu/side-menu';
import { SkipLink } from './_components/skip-link';

/**
 * Responsive semantic shell.
 *
 * Desktop (≥1024px): <SiteHeader> + sticky 14rem sidebar SideMenu + <main> + <footer>.
 * Mobile (<1024px): <SiteHeader> + <details><summary>Menú</summary><SideMenu/></details> + <main> + <footer>.
 *
 * REQ-M-001, REQ-M-008.
 */
export default component$(() => {
  return (
    <>
      <SkipLink targetId="main-content" />
      <header class="site-header">
        <a href="/" class="site-brand">
          Bandola Llanera
        </a>
      </header>
      <div class="shell">
        <details class="shell-nav-details">
          <summary>Menú</summary>
          <SideMenu />
        </details>
        <aside class="shell-sidebar">
          <SideMenu />
        </aside>
        <main id="main-content" tabIndex={-1} class="shell-main">
          <Slot />
        </main>
      </div>
      <footer class="site-footer">
        <small>Sitio informativo sobre la bandola llanera ancestral y tradicional.</small>
      </footer>
    </>
  );
});
