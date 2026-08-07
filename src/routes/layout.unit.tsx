import { describe, it, expect } from 'vitest';
import { renderToString } from '@builder.io/qwik/server';
import { QwikCityMockProvider } from '@builder.io/qwik-city';
import { JSDOM } from 'jsdom';

// Helper: render the production Layout inside a QwikCityMockProvider for a given
// URL, then parse the HTML with JSDOM and return the document.
//
// We use SSR + JSDOM (not createDOM) because Qwik 1.20's createDOM ships a
// domino-based DOM that conflicts with the jsdom global document when Qwik City's
// <Link> component creates virtual comment nodes.
async function renderLayoutAt(pathname: string): Promise<Document> {
  const url = `http://localhost${pathname}`;
  const Layout = (await import('./layout')).default;
  const result = await renderToString(
    <QwikCityMockProvider url={url}>
      <Layout>
        <div data-testid="slot-child">SLOT</div>
      </Layout>
    </QwikCityMockProvider>,
    { containerTagName: 'div' },
  );
  const dom = new JSDOM(result.html);
  return dom.window.document;
}

// H1 — header structure: prominent site-header with brand block.
describe('Layout header (H1)', () => {
  it('renders a <header class="site-header"> landmark', async () => {
    const doc = await renderLayoutAt('/');
    const header = doc.querySelector('header.site-header');
    expect(header).not.toBeNull();
  });

  it('header contains a brand block with the site name "Bandola Llanera"', async () => {
    const doc = await renderLayoutAt('/');
    const brand = doc.querySelector('header.site-header .site-brand');
    expect(brand).not.toBeNull();
    expect(brand?.tagName).toBe('A');
    expect(brand?.getAttribute('href')).toBe('/');
    expect(brand?.textContent?.trim()).toContain('Bandola Llanera');
  });

  it('header exposes a tagline element with descriptive text', async () => {
    const doc = await renderLayoutAt('/');
    const tagline = doc.querySelector('header.site-header .site-tagline');
    expect(tagline).not.toBeNull();
    expect(tagline?.textContent?.trim().length).toBeGreaterThan(0);
  });
});

// H2 — footer structure: substantive footer with multiple content sections.
describe('Layout footer (H2)', () => {
  it('renders a <footer class="site-footer"> landmark', async () => {
    const doc = await renderLayoutAt('/');
    const footer = doc.querySelector('footer.site-footer');
    expect(footer).not.toBeNull();
  });

  it('footer contains a brand/identity section', async () => {
    const doc = await renderLayoutAt('/');
    const brandSection = doc.querySelector('footer.site-footer .footer-brand');
    expect(brandSection).not.toBeNull();
    expect(brandSection?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('footer contains a sources/attribution section that names the Wikipedia-ES budget', async () => {
    const doc = await renderLayoutAt('/');
    const sources = doc.querySelector('footer.site-footer .footer-sources');
    expect(sources).not.toBeNull();
    expect(sources?.textContent?.toLowerCase()).toContain('wikipedia');
  });

  it('footer contains a year/credits element', async () => {
    const doc = await renderLayoutAt('/');
    const year = doc.querySelector('footer.site-footer .footer-year');
    expect(year).not.toBeNull();
    // Must contain a 4-digit year.
    expect(year?.textContent).toMatch(/\d{4}/);
  });
});

// N1 — mobile navigation: hamburger button inside <details><summary>, drawer
// contains the same nav rendered for desktop. This is the no-JS pattern.
describe('Layout mobile navigation (N1)', () => {
  it('renders a <details class="mobile-nav"> with a <summary class="mobile-nav-toggle">', async () => {
    const doc = await renderLayoutAt('/');
    const details = doc.querySelector('details.mobile-nav');
    expect(details).not.toBeNull();
    const summary = doc.querySelector('details.mobile-nav > summary.mobile-nav-toggle');
    expect(summary).not.toBeNull();
  });

  it('mobile-nav-toggle contains a hamburger icon span (CSS-only hamburger)', async () => {
    const doc = await renderLayoutAt('/');
    const icon = doc.querySelector('summary.mobile-nav-toggle .hamburger-icon');
    expect(icon).not.toBeNull();
    // The hamburger icon contains three <span> lines rendered via CSS.
    const lines = doc.querySelectorAll('summary.mobile-nav-toggle .hamburger-icon span');
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });

  it('mobile-nav-toggle has an accessible label (aria-label or visible text)', async () => {
    const doc = await renderLayoutAt('/');
    const toggle = doc.querySelector('summary.mobile-nav-toggle');
    const ariaLabel = toggle?.getAttribute('aria-label');
    const text = toggle?.textContent?.trim();
    // Either an aria-label OR visible "Menú" text makes it accessible.
    expect((ariaLabel && ariaLabel.length > 0) || (text && text.length > 0)).toBe(true);
  });

  it('mobile-nav wraps the same SideMenu as the desktop sidebar', async () => {
    const doc = await renderLayoutAt('/');
    const mobileNavItems = doc.querySelectorAll('details.mobile-nav nav a, details.mobile-nav nav span[aria-disabled]');
    const desktopNavItems = doc.querySelectorAll('aside.desktop-sidebar nav a, aside.desktop-sidebar nav span[aria-disabled]');
    expect(mobileNavItems.length).toBeGreaterThan(0);
    expect(mobileNavItems.length).toBe(desktopNavItems.length);
  });
});

// N2 — desktop sidebar: present on the page, contains the nav, hidden on mobile.
describe('Layout desktop sidebar (N2)', () => {
  it('renders an <aside class="desktop-sidebar"> landmark', async () => {
    const doc = await renderLayoutAt('/');
    const aside = doc.querySelector('aside.desktop-sidebar');
    expect(aside).not.toBeNull();
    expect(aside?.tagName).toBe('ASIDE');
  });

  it('desktop sidebar contains a section title element', async () => {
    const doc = await renderLayoutAt('/');
    const title = doc.querySelector('aside.desktop-sidebar .sidebar-title');
    expect(title).not.toBeNull();
    expect(title?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('desktop sidebar contains the nav with the locked 4 entries', async () => {
    const doc = await renderLayoutAt('/');
    const navItems = doc.querySelectorAll('aside.desktop-sidebar nav [data-testid^="nav-"]');
    expect(navItems).toHaveLength(4);
  });
});

// M1 — main content container: centered with bounded width, content slot.
describe('Layout main content (M1)', () => {
  it('renders a <main id="main-content" tabIndex="-1"> landmark', async () => {
    const doc = await renderLayoutAt('/');
    const main = doc.querySelector('main#main-content');
    expect(main).not.toBeNull();
    expect(main?.getAttribute('tabindex')).toBe('-1');
  });

  it('main renders the slotted child content', async () => {
    const doc = await renderLayoutAt('/');
    const child = doc.querySelector('main#main-content [data-testid="slot-child"]');
    expect(child).not.toBeNull();
    expect(child?.textContent).toBe('SLOT');
  });

  it('skip-link is present and targets #main-content', async () => {
    const doc = await renderLayoutAt('/');
    const skip = doc.querySelector('a.skip-link');
    expect(skip).not.toBeNull();
    expect(skip?.getAttribute('href')).toBe('#main-content');
  });
});

// O1 — overall structure: landmark ordering header → shell → footer.
describe('Layout overall structure (O1)', () => {
  it('landmark order is skip-link → header → shell(main) → footer', async () => {
    const doc = await renderLayoutAt('/');
    const landmarks = doc.querySelectorAll('a.skip-link, header.site-header, main#main-content, footer.site-footer');
    expect(landmarks.length).toBe(4);
    expect(landmarks[0]!.tagName).toBe('A'); // skip-link
    expect(landmarks[1]!.tagName).toBe('HEADER');
    expect(landmarks[2]!.tagName).toBe('MAIN');
    expect(landmarks[3]!.tagName).toBe('FOOTER');
  });
});