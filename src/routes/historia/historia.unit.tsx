import { describe, it, expect } from 'vitest';
import { renderToString } from '@builder.io/qwik/server';
import { JSDOM } from 'jsdom';
import { historiaArticle } from '~/content/historia';

const EXPECTED_TITLES = [
  'Origen histórico',
  'Maní y afinación',
  'Genealogía de bandolistas',
  'Luthería y resinas',
  'Contexto orinoquense',
  'Conclusión',
];

// Render the ArticleView + Toc + Progress stack for the historia article, then
// parse the HTML with JSDOM. Returns the parsed document.
async function renderHistoria(): Promise<Document> {
  const { ArticleView } = await import('~/routes/_lib/article-view');
  const { Toc } = await import('../_components/toc');
  const result = await renderToString(
    <div>
      <Toc sections={historiaArticle.sections} />
      <ArticleView article={historiaArticle} />
    </div>,
    { containerTagName: 'div' },
  );
  const dom = new JSDOM(result.html);
  return dom.window.document;
}

// H1 — exactly one <h1> and the article's 6 <h2> in expected order.
describe('Historia article H1 (DOM)', () => {
  it('renders exactly 1 <h1> with the article title', async () => {
    const doc = await renderHistoria();
    const h1s = doc.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0]?.textContent?.toLowerCase()).toContain('bandola llanera');
  });

  it('renders 6 <h2> in the locked order', async () => {
    const doc = await renderHistoria();
    const h2s = doc.querySelectorAll('h2');
    expect(h2s).toHaveLength(6);
    const titles = Array.from(h2s).map((h) => h.textContent?.trim());
    expect(titles).toEqual(EXPECTED_TITLES);
  });
});

// H2 — TOC has 6 anchors matching the section ids.
describe('Historia article H2 (TOC)', () => {
  it('renders a TOC with 6 anchors matching section ids', async () => {
    const doc = await renderHistoria();
    const tocAnchors = doc.querySelectorAll('a[href^="#"]');
    expect(tocAnchors).toHaveLength(6);
    for (let i = 0; i < tocAnchors.length; i++) {
      const expected = `#${historiaArticle.sections[i]!.id}`;
      expect(tocAnchors[i]?.getAttribute('href')).toBe(expected);
    }
  });

  it('sections have ids matching the TOC anchors', async () => {
    const doc = await renderHistoria();
    const sections = doc.querySelectorAll('section[id]');
    expect(sections).toHaveLength(6);
    const ids = Array.from(sections).map((s) => s.getAttribute('id'));
    expect(ids).toEqual(historiaArticle.sections.map((s) => s.id));
  });
});

// H3-1 — ≥1 .callout containing literal "Por confirmar".
describe('Historia article H3-1 (callouts)', () => {
  it('renders ≥1 <aside class="callout"> with literal text "Por confirmar"', async () => {
    const doc = await renderHistoria();
    const callouts = doc.querySelectorAll('aside.callout');
    expect(callouts.length).toBeGreaterThanOrEqual(1);
    const allText = Array.from(callouts)
      .map((c) => c.textContent ?? '')
      .join(' ');
    expect(allText).toContain('Por confirmar');
  });

  it('callouts cover the four required topics: genealogy, A-D-A-E, Olimpo Díaz, resins', async () => {
    const doc = await renderHistoria();
    const callouts = doc.querySelectorAll('aside.callout');
    const allText = Array.from(callouts)
      .map((c) => c.textContent ?? '')
      .join(' ')
      .toLowerCase();
    expect(allText).toMatch(/flórez|flores/i);
    expect(allText).toMatch(/a-d-a-e/i);
    expect(allText).toMatch(/olimpo/i);
    expect(allText).toMatch(/resin|copal|damar|colofonia|brea/i);
  });
});

// H3-2 — sections with no unconfirmed claims render no callout.
describe('Historia article H3-2 (no callouts on clean sections)', () => {
  it('"Contexto orinoquense" and "Conclusión" sections have no callout', async () => {
    const doc = await renderHistoria();
    const sections = doc.querySelectorAll('section[id]');
    for (const s of sections) {
      const title = s.querySelector('h2')?.textContent?.trim();
      if (title === 'Contexto orinoquense' || title === 'Conclusión') {
        const callouts = s.querySelectorAll('aside.callout');
        expect(callouts).toHaveLength(0);
      }
    }
  });
});

// H4 — Maní y afinación mentions E-A-D-A + A-D-A-E footnote + Wikipedia citation.
describe('Historia article H4 (Maní y afinación)', () => {
  it('contains "E-A-D-A" in the Maní y afinación section body', async () => {
    const doc = await renderHistoria();
    const section = Array.from(doc.querySelectorAll('section[id]')).find(
      (s) => s.querySelector('h2')?.textContent?.trim() === 'Maní y afinación',
    );
    expect(section).toBeDefined();
    expect(section?.textContent).toContain('E-A-D-A');
  });

  it('the Maní y afinación section footnotes reference A-D-A-E marked "por confirmar"', async () => {
    const doc = await renderHistoria();
    const section = Array.from(doc.querySelectorAll('section[id]')).find(
      (s) => s.querySelector('h2')?.textContent?.trim() === 'Maní y afinación',
    );
    const footnotes = doc.querySelectorAll('div[data-testid="footnotes"]');
    expect(footnotes.length).toBeGreaterThanOrEqual(1);
    const fnText = Array.from(footnotes)
      .map((f) => f.textContent ?? '')
      .join(' ')
      .toLowerCase();
    expect(fnText).toContain('a-d-a-e');
    expect(fnText).toContain('por confirmar');
  });

  it('the Maní y afinación section cites the Bandola Wikipedia URL', async () => {
    const doc = await renderHistoria();
    const sources = doc.querySelectorAll('[data-testid="source"]');
    const urls = Array.from(sources).map((s) => s.querySelector('a')?.getAttribute('href') ?? '');
    expect(urls).toContain('https://es.wikipedia.org/wiki/Bandola_llanera');
  });
});

// H5 — Genealogía renders "Flórez" with accent and "Flores" footnote.
describe('Historia article H5 (Genealogía)', () => {
  it('the Genealogía section body contains "Flórez" (with accent)', async () => {
    const doc = await renderHistoria();
    const section = Array.from(doc.querySelectorAll('section[id]')).find(
      (s) => s.querySelector('h2')?.textContent?.trim() === 'Genealogía de bandolistas',
    );
    expect(section?.textContent).toContain('Flórez');
  });
});

// H6 — body is ReadonlyArray<Paragraph>, no string literal > 200 chars in source.
describe('Historia article H6 (data shape)', () => {
  it('every section.body is a ReadonlyArray<Paragraph> with kind "p" or "em"', () => {
    for (const section of historiaArticle.sections) {
      expect(Array.isArray(section.body)).toBe(true);
      for (const para of section.body) {
        expect(['p', 'em']).toContain(para.kind);
        expect(typeof para.text).toBe('string');
      }
    }
  });

  it('contains no string literal longer than 200 characters in historia.ts', async () => {
    const { readFile } = await import('node:fs/promises');
    const { resolve } = await import('node:path');
    const src = await readFile(resolve(__dirname, '../../content/historia.ts'), 'utf8');
    const literalRegex = /'([^'\\]*(?:\\.[^'\\]*)*)'/g;
    for (const m of src.matchAll(literalRegex)) {
      const lit = m[1] ?? '';
      if (lit.startsWith('http')) continue;
      if (lit.startsWith('/')) continue;
      if (lit.length === 0) continue;
      expect(lit.length).toBeLessThanOrEqual(200);
    }
  });
});

// H7-1 — each section surfaces a typed Source link.
describe('Historia article H7-1 (Source links)', () => {
  it('every section has a source link with an https URL', async () => {
    const doc = await renderHistoria();
    const sources = doc.querySelectorAll('[data-testid="source"]');
    expect(sources).toHaveLength(6);
    for (const s of sources) {
      const a = s.querySelector('a');
      const href = a?.getAttribute('href') ?? '';
      expect(href).toMatch(/^https?:\/\//);
    }
  });
});

// H7-2 — only Wikipedia ES Bandola + Joropo as primary.
describe('Historia article H7-2 (source allowlist)', () => {
  it('every section source is one of the two allowed Wikipedia URLs', async () => {
    const doc = await renderHistoria();
    const sources = doc.querySelectorAll('[data-testid="source"]');
    const allowed = new Set([
      'https://es.wikipedia.org/wiki/Bandola_llanera',
      'https://es.wikipedia.org/wiki/Joropo_llanero',
    ]);
    for (const s of sources) {
      const a = s.querySelector('a');
      const href = a?.getAttribute('href') ?? '';
      expect(allowed.has(href)).toBe(true);
    }
  });
});
