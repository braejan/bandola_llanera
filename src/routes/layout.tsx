import { component$, Slot } from '@builder.io/qwik';
import { SideMenu } from '~/components/side-menu/side-menu';
import { SkipLink } from './_components/skip-link';

/**
 * Responsive semantic shell.
 *
 * Mobile (<1024px): sticky top bar with brand + hamburger toggle. The toggle
 * reveals a full-width nav drawer beneath the bar via <details><summary> — no JS.
 *
 * Desktop (≥1024px): sticky top bar (same brand) + sticky left sidebar (14rem)
 * containing the nav + a single-column main + a multi-section footer.
 *
 * All visible styling lives in src/global.css (NOT in CSS modules) so first paint
 * is never blocked by the `<style hidden>` hydration trick that hides Qwik's
 * useStylesScoped$ output until the client hydrates.
 */
export default component$(() => {
  return (
    <>
      <SkipLink targetId="main-content" />
      <header class="site-header">
        <a href="/" class="site-brand">
          Bandola Llanera
        </a>
        <p class="site-tagline">
          Origen, afinación y contexto orinoquense de un instrumento del joropo.
        </p>
        <details class="mobile-nav">
          <summary class="mobile-nav-toggle" aria-label="Abrir menú de navegación">
            <span class="hamburger-icon" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span class="mobile-nav-toggle-label">Menú</span>
          </summary>
          <div class="mobile-nav-drawer">
            <SideMenu />
          </div>
        </details>
      </header>
      <div class="shell">
        <aside class="desktop-sidebar">
          <h2 class="sidebar-title">Navegación</h2>
          <SideMenu />
        </aside>
        <main id="main-content" tabIndex={-1} class="shell-main">
          <Slot />
        </main>
      </div>
      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <strong class="footer-brand-name">Bandola Llanera</strong>
            <p class="footer-brand-tagline">
              Sitio informativo sobre la bandola llanera ancestral y tradicional.
            </p>
          </div>
          <div class="footer-sources">
            <h3 class="footer-heading">Fuentes</h3>
            <p>
              El contenido se construye desde fuentes enciclopédicas públicas
              (Wikipedia ES) y se cita explícitamente cada afirmación. Las
              afirmaciones no confirmadas se marcan como "por confirmar".
            </p>
          </div>
          <div class="footer-year">
            <small>
              © {new Date().getFullYear()} · Maní, Casanare (Colombia)
            </small>
          </div>
        </div>
      </footer>
    </>
  );
});