import { describe, it, expect } from 'vitest';
import { historiaArticle } from '~/content/historia';

const EXPECTED_TITLES = [
  'Origen histórico',
  'Maní y afinación',
  'Genealogía de bandolistas',
  'Luthería y resinas',
  'Contexto orinoquense',
  'Conclusión',
];

// H1 — single <article> with exactly 1 <h1> and 6 <h2>.
// We test the data shape that produces those headings, not the live DOM
// (live DOM requires the full Qwik City SSR pipeline; data shape is the source
// of truth per spec H6 — "body MUST be ReadonlyArray<Paragraph>, NOT string").
describe('Historia article H1', () => {
  it('the article has exactly one title that becomes the h1', () => {
    expect(historiaArticle.title.length).toBeGreaterThan(0);
    expect(historiaArticle.title.toLowerCase()).toContain('bandola llanera');
  });

  it('the article has exactly 6 sections that become the h2 elements', () => {
    expect(historiaArticle.sections).toHaveLength(6);
  });
});

// H2 — sections in fixed order.
describe('Historia article H2', () => {
  it('sections are in the locked order from the spec', () => {
    const titles = historiaArticle.sections.map((s) => s.title);
    expect(titles).toEqual(EXPECTED_TITLES);
  });

  it('every section has a non-empty id and title', () => {
    for (const section of historiaArticle.sections) {
      expect(section.id.length).toBeGreaterThan(0);
      expect(section.title.length).toBeGreaterThan(0);
    }
  });

  it('every section id is unique', () => {
    const ids = historiaArticle.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// H3-1 — ≥1 .callout containing literal "por confirmar".
describe('Historia article H3-1', () => {
  it('≥1 section has porConfirmar callouts', () => {
    const withCallouts = historiaArticle.sections.filter(
      (s) => s.porConfirmar.length > 0,
    );
    expect(withCallouts.length).toBeGreaterThanOrEqual(1);
  });

  it('callouts cover the four required topics: genealogy, A-D-A-E, Olimpo Díaz, resins', () => {
    const allText = historiaArticle.sections
      .flatMap((s) => s.porConfirmar.map((c) => c.text))
      .join(' ')
      .toLowerCase();
    expect(allText).toMatch(/flórez|flores/i); // genealogy
    expect(allText).toMatch(/a-d-a-e/i); // A-D-A-E
    expect(allText).toMatch(/olimpo/i); // Olimpo Díaz
    expect(allText).toMatch(/resin|copal|damar|colofonia|brea/i); // resins
  });

  it('the render layer uses class "callout" and literal text "por confirmar"', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const src = await fs.readFile(
      path.resolve(__dirname, './index.tsx'),
      'utf8',
    );
    expect(src).toMatch(/class\s*=\s*['"]callout['"]/);
    expect(src).toMatch(/Por confirmar/i);
    const css = await fs.readFile(
      path.resolve(__dirname, './historia.module.css'),
      'utf8',
    );
    expect(css).toMatch(/\.callout\s*\{/);
  });
});

// H3-2 — sections with no unconfirmed claims render NO callout.
describe('Historia article H3-2', () => {
  it('"Contexto orinoquense" and "Conclusión" have no callouts', () => {
    const contexto = historiaArticle.sections.find(
      (s) => s.title === 'Contexto orinoquense',
    );
    const conclusion = historiaArticle.sections.find(
      (s) => s.title === 'Conclusión',
    );
    expect(contexto?.porConfirmar).toHaveLength(0);
    expect(conclusion?.porConfirmar).toHaveLength(0);
  });
});

// H4 — Maní y afinación contains "E-A-D-A" + A-D-A-E footnote + Wikipedia citation.
describe('Historia article H4', () => {
  it('the Maní y afinación section mentions E-A-D-A', () => {
    const tuning = historiaArticle.sections.find(
      (s) => s.title === 'Maní y afinación',
    );
    expect(tuning).toBeDefined();
    const allText = tuning!.body.map((b) => b.text).join(' ');
    expect(allText).toContain('E-A-D-A');
  });

  it('the Maní y afinación section has a footnote referencing A-D-A-E marked "por confirmar"', () => {
    const tuning = historiaArticle.sections.find(
      (s) => s.title === 'Maní y afinación',
    );
    expect(tuning?.footnotes).toBeDefined();
    expect(tuning!.footnotes!.length).toBeGreaterThan(0);
    expect(tuning!.footnotes!.join(' ').toLowerCase()).toContain('a-d-a-e');
    expect(tuning!.footnotes!.join(' ').toLowerCase()).toContain('por confirmar');
  });

  it('the Maní y afinación section cites es.wikipedia.org/wiki/Bandola_llanera', () => {
    const tuning = historiaArticle.sections.find(
      (s) => s.title === 'Maní y afinación',
    );
    expect(tuning?.source.url).toBe(
      'https://es.wikipedia.org/wiki/Bandola_llanera',
    );
  });

  it('the render layer renders [data-testid="footnotes"] in each section that has footnotes', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const src = await fs.readFile(
      path.resolve(__dirname, './index.tsx'),
      'utf8',
    );
    expect(src).toContain('data-testid="footnotes"');
  });
});

// H5 — Genealogía renders "Flórez" (with accent) and includes "Flores" footnote.
describe('Historia article H5', () => {
  it('the Genealogía section body contains "Flórez" (with accent)', () => {
    const gene = historiaArticle.sections.find(
      (s) => s.title === 'Genealogía de bandolistas',
    );
    expect(gene).toBeDefined();
    const allText = gene!.body.map((b) => b.text).join(' ');
    expect(allText).toContain('Flórez');
  });

  it('the Genealogía section has a footnote referencing "Flores" variant marked "por confirmar"', () => {
    const gene = historiaArticle.sections.find(
      (s) => s.title === 'Genealogía de bandolistas',
    );
    expect(gene?.footnotes).toBeDefined();
    expect(gene!.footnotes!.join(' ')).toContain('Flores');
    expect(gene!.footnotes!.join(' ').toLowerCase()).toContain('por confirmar');
  });
});

// H6 — body is ReadonlyArray<Paragraph>, no string literal > 200 chars.
describe('Historia article H6', () => {
  it('every section.body is ReadonlyArray<Paragraph> (NOT string)', () => {
    for (const section of historiaArticle.sections) {
      expect(Array.isArray(section.body)).toBe(true);
      for (const para of section.body) {
        expect(typeof para).toBe('object');
        expect(['p', 'em']).toContain((para as { kind: string }).kind);
        expect(typeof (para as { text: string }).text).toBe('string');
      }
    }
  });

  it('contains no string literal longer than 200 characters in historia.ts', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const src = await fs.readFile(
      path.resolve(__dirname, '../../content/historia.ts'),
      'utf8',
    );
    const literalRegex = /'([^'\\]*(?:\\.[^'\\]*)*)'/g;
    const matches = src.matchAll(literalRegex);
    for (const m of matches) {
      const lit = m[1] ?? '';
      if (lit.startsWith('http')) continue;
      if (lit.startsWith('/')) continue;
      if (lit.length === 0) continue;
      expect(lit.length).toBeLessThanOrEqual(200);
    }
  });
});

// H7-1 — each section surfaces a typed Source link.
describe('Historia article H7-1', () => {
  it('every section has a typed Source with a valid URL', () => {
    for (const section of historiaArticle.sections) {
      expect(section.source).toBeDefined();
      expect(typeof section.source.url).toBe('string');
      expect(typeof section.source.label).toBe('string');
      expect(section.source.url).toMatch(/^https?:\/\//);
    }
  });

  it('the render layer emits [data-testid="source"] with an <a> per section', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const src = await fs.readFile(
      path.resolve(__dirname, './index.tsx'),
      'utf8',
    );
    expect(src).toContain('data-testid="source"');
    expect(src).toContain('<a href={section.source.url}');
  });
});

// H7-2 — only Wikipedia ES Bandola + Joropo as primary.
describe('Historia article H7-2', () => {
  it('every section.source is one of the two allowed Wikipedia URLs', () => {
    const allowed = new Set([
      'https://es.wikipedia.org/wiki/Bandola_llanera',
      'https://es.wikipedia.org/wiki/Joropo_llanero',
    ]);
    for (const section of historiaArticle.sections) {
      expect(allowed.has(section.source.url)).toBe(true);
    }
  });
});
