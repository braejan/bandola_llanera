import { describe, it, expect } from 'vitest';
import { renderToString } from '@builder.io/qwik/server';
import { QwikCityMockProvider } from '@builder.io/qwik-city';
import { JSDOM } from 'jsdom';

// Helper: render the provided JSX inside a minimal layout shell with a
// QwikCityMockProvider for a given URL, then return the parsed JSDOM document.
//
// We use SSR + JSDOM (not createDOM) because Qwik 1.20's createDOM ships a
// domino-based DOM that conflicts with the jsdom global document when Qwik City's
// <Link> component creates virtual comment nodes.
async function renderAt(pathname: string, jsx: Parameters<typeof renderToString>[0]): Promise<Document> {
  const url = `http://localhost${pathname}`;
  const result = await renderToString(
    <QwikCityMockProvider url={url}>
      <div>
        {jsx}
      </div>
    </QwikCityMockProvider>,
    { containerTagName: 'div' },
  );
  const dom = new JSDOM(result.html);
  return dom.window.document;
}

describe('shell: skip-link + landing + active state (REQ-M-001/002/003)', () => {
  it('renders a skip-link as the first <a class="skip-link"> pointing to #main-content', async () => {
    const { SkipLink } = await import('./skip-link');
    const doc = await renderAt(
      '/',
      <>
        <SkipLink />
        <main id="main-content" tabIndex={-1} />
      </>,
    );
    const skipLink = doc.querySelector('a.skip-link');
    expect(skipLink).not.toBeNull();
    expect(skipLink?.getAttribute('href')).toBe('#main-content');
    expect(skipLink?.textContent?.trim()).toBe('Saltar al contenido');
  });

  it('renders a <main id="main-content"> landmark', async () => {
    const doc = await renderAt(
      '/',
      <main id="main-content" tabIndex={-1} />,
    );
    const main = doc.querySelector('main#main-content');
    expect(main).not.toBeNull();
  });

  it('Landing renders an <h1> with "Bandola Llanera" and a single CTA to /historia/', async () => {
    const { Landing } = await import('./landing');
    const doc = await renderAt('/', <Landing />);
    const h1 = doc.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toContain('Bandola Llanera');
    const cta = doc.querySelector('a[href="/historia/"]');
    expect(cta).not.toBeNull();
    expect(cta?.textContent?.trim()).toContain('Comenzar');
  });

  it('Inicio nav entry has aria-current="page" when pathname is "/"', async () => {
    const { SideMenu } = await import('~/components/side-menu/side-menu');
    const doc = await renderAt('/', <SideMenu />);
    const active = doc.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    const inicio = doc.querySelector('a[data-testid="nav-inicio"]');
    expect(inicio?.getAttribute('aria-current')).toBe('page');
  });
});
