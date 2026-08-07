import { describe, it, expect } from 'vitest';
import { renderToString } from '@builder.io/qwik/server';
import { QwikCityMockProvider } from '@builder.io/qwik-city';
import { JSDOM } from 'jsdom';
import { SideMenu } from './side-menu';
import { NAV_ENTRIES } from './nav-entries';

// Helper: render the SideMenu via Qwik SSR inside a QwikCityMockProvider for a given URL,
// then parse the HTML with JSDOM and return the document.
//
// NOTE: We use renderToString + JSDOM instead of @builder.io/qwik/testing#createDOM
// because Qwik 1.20's createDOM ships a domino-based DOM that conflicts with the
// jsdom global document when Qwik City's <Link> component creates virtual comment nodes
// (insertBefore fails on jsdom nodes missing isAncestor). SSR + JSDOM is functionally
// equivalent for our assertions: it renders the same DOM the browser sees.
async function renderSideMenuAt(pathname: string): Promise<Document> {
  const url = `http://localhost${pathname}`;
  const result = await renderToString(
    <QwikCityMockProvider url={url}>
      <SideMenu />
    </QwikCityMockProvider>,
    { containerTagName: 'div' },
  );
  const dom = new JSDOM(result.html);
  return dom.window.document;
}

// Locate the rendered <a> for a nav entry by its data-testid hook.
function navAnchor(doc: Document, label: string): HTMLAnchorElement | null {
  return doc.querySelector(`a[data-testid="nav-${label.toLowerCase()}"]`);
}

function navSpan(doc: Document, label: string): HTMLSpanElement | null {
  return doc.querySelector(`span[data-testid="nav-${label.toLowerCase()}"]`);
}

// R1 — exactly 4 entries, locked order, locked labels and hrefs.
describe('SideMenu NAV_ENTRIES (R1)', () => {
  it('has exactly 4 entries in locked order with locked labels and hrefs', () => {
    expect(NAV_ENTRIES).toHaveLength(4);
    expect(NAV_ENTRIES.map((e) => e.label)).toEqual([
      'Inicio',
      'Historia',
      'Afinación',
      'Repertorio',
    ]);
    expect(NAV_ENTRIES.map((e) => e.href)).toEqual([
      '/',
      '/historia',
      '/afinacion',
      '/repertorio',
    ]);
  });

  it('Inicio, Historia, and Afinación are enabled; Repertorio is the only disabled', () => {
    const enabled = NAV_ENTRIES.filter((e) => !e.disabled);
    expect(enabled.map((e) => e.label)).toEqual(['Inicio', 'Historia', 'Afinación']);
  });

  it('produces the expected testid values from NAV_ENTRIES', () => {
    const testIds = NAV_ENTRIES.map((e) => `nav-${e.label.toLowerCase()}`);
    expect(testIds).toEqual([
      'nav-inicio',
      'nav-historia',
      'nav-afinación',
      'nav-repertorio',
    ]);
  });
});

// C1 — jsdom env proof: Vitest MUST run in a DOM environment.
describe('SideMenu jsdom env proof (C1)', () => {
  it('runs in a DOM environment (HTMLDivElement available)', () => {
    const el = document.createElement('div');
    expect(el).toBeInstanceOf(HTMLDivElement);
  });

  it('renders a <nav> with aria-label="Navegación principal"', async () => {
    const doc = await renderSideMenuAt('/');
    const nav = doc.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav?.getAttribute('aria-label')).toBe('Navegación principal');
  });

  it('renders exactly 4 <li> items (one per NAV_ENTRIES entry)', async () => {
    const doc = await renderSideMenuAt('/');
    const items = doc.querySelectorAll('li');
    expect(items).toHaveLength(4);
  });
});

// R2 — active state: exactly one entry with aria-current="page" matches the URL.
// Disabled entries never receive aria-current.
describe('SideMenu active state (R2)', () => {
  it('pathname "/" activates Inicio only', async () => {
    const doc = await renderSideMenuAt('/');
    const active = doc.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    const inicio = navAnchor(doc, 'Inicio');
    expect(inicio?.getAttribute('aria-current')).toBe('page');
  });

  it('pathname "/historia/" activates Historia only (slash form)', async () => {
    const doc = await renderSideMenuAt('/historia/');
    const active = doc.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    const historia = navAnchor(doc, 'Historia');
    expect(historia?.getAttribute('aria-current')).toBe('page');
    const inicio = navAnchor(doc, 'Inicio');
    expect(inicio?.getAttribute('aria-current')).toBeNull();
  });

  it('pathname "/historia" (no slash) ALSO activates Historia (slash bug regression)', async () => {
    const doc = await renderSideMenuAt('/historia');
    const active = doc.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    const historia = navAnchor(doc, 'Historia');
    expect(historia?.getAttribute('aria-current')).toBe('page');
  });

  it('pathname "/afinacion/" activates Afinación only (enabled per REQ-M-007)', async () => {
    const doc = await renderSideMenuAt('/afinacion/');
    const active = doc.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    const afinacion = navAnchor(doc, 'Afinación');
    expect(afinacion?.getAttribute('aria-current')).toBe('page');
  });

  it('pathname "/afinacion" (no slash) ALSO activates Afinación (slash form)', async () => {
    const doc = await renderSideMenuAt('/afinacion');
    const active = doc.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(1);
    const afinacion = navAnchor(doc, 'Afinación');
    expect(afinacion?.getAttribute('aria-current')).toBe('page');
  });

  it('pathname "/repertorio/" yields ZERO active entries (disabled)', async () => {
    const doc = await renderSideMenuAt('/repertorio/');
    const active = doc.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(0);
    const repertorioSpan = navSpan(doc, 'Repertorio');
    expect(repertorioSpan).not.toBeNull();
    expect(repertorioSpan?.getAttribute('aria-disabled')).toBe('true');
  });

  it('unknown pathname (404) yields ZERO active entries', async () => {
    const doc = await renderSideMenuAt('/no-existe/');
    const active = doc.querySelectorAll('[aria-current="page"]');
    expect(active).toHaveLength(0);
  });
});

// R3 — disabled entries render as <span aria-disabled="true">, not as <a>.
describe('SideMenu disabled rendering contract (R3)', () => {
  it('disabled entries render as <span aria-disabled="true">', async () => {
    const doc = await renderSideMenuAt('/');
    // Repertorio is the only disabled entry (per REQ-M-007 + INV-4 rewrite).
    const repertorioSpan = navSpan(doc, 'Repertorio');
    expect(repertorioSpan).not.toBeNull();
    expect(repertorioSpan?.tagName).toBe('SPAN');
    expect(repertorioSpan?.getAttribute('aria-disabled')).toBe('true');
    expect(navAnchor(doc, 'Repertorio')).toBeNull();
  });

  it('non-disabled entries (Inicio, Historia, Afinación) render as <a> with the right href', async () => {
    const doc = await renderSideMenuAt('/');
    const inicio = navAnchor(doc, 'Inicio');
    expect(inicio).not.toBeNull();
    expect(inicio?.tagName).toBe('A');
    expect(inicio?.getAttribute('href')).toBe('/');
    const historia = navAnchor(doc, 'Historia');
    expect(historia?.getAttribute('href')).toBe('/historia');
    const afinacion = navAnchor(doc, 'Afinación');
    expect(afinacion?.getAttribute('href')).toBe('/afinacion');
    expect(navSpan(doc, 'Afinación')).toBeNull();
  });
});

// R4 — data-testid hook is present for every entry.
describe('SideMenu data-testid hook (R4)', () => {
  it('emits data-testid "nav-{label}" for every entry', async () => {
    const doc = await renderSideMenuAt('/');
    for (const label of ['Inicio', 'Historia', 'Afinación', 'Repertorio']) {
      const el = doc.querySelector(`[data-testid="nav-${label.toLowerCase()}"]`);
      expect(el).not.toBeNull();
    }
  });
});
