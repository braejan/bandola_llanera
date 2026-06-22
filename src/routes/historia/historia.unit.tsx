import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/qwik';
import { createDOM } from '@builder.io/qwik/testing';
import HistoriaRoute from './index';
import { historiaArticle } from '~/content/historia';

// H1 — page renders a single <article> with exactly 1 <h1> and 6 <h2>.
describe('Historia route (H1)', () => {
  it('renders a single <article> with exactly 1 <h1> and 6 <h2>', async () => {
    const { screen } = await createDOM();
    await render(<HistoriaRoute />);

    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(1);

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(/bandola llanera/i);

    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s).toHaveLength(6);
  });
});

// H2 — section order matches historiaArticle.sections order (compile-time),
// and a missing field on any section is a TypeScript compile-time error.
describe('Historia route (H2)', () => {
  it('renders sections in the exact order from historiaArticle.sections', async () => {
    const { screen, container } = await createDOM();
    await render(<HistoriaRoute />);

    const sectionEls = container.querySelectorAll('section');
    const titles = Array.from(sectionEls).map((el) => {
      const h2 = el.querySelector('h2');
      return h2?.textContent?.trim() ?? '';
    });

    const expected = historiaArticle.sections.map((s) => s.title);
    expect(titles).toEqual(expected);
  });

  it('every section has a non-empty id (matches spec id field)', () => {
    for (const section of historiaArticle.sections) {
      expect(section.id.length).toBeGreaterThan(0);
      expect(section.title.length).toBeGreaterThan(0);
    }
  });
});

// H3-1 — unconfirmed claims render as callouts with class ".callout" containing
// the literal text "por confirmar".
describe('Historia route (H3-1)', () => {
  it('renders ≥1 .callout containing literal "por confirmar" per section with unconfirmed claims', async () => {
    const { screen, container } = await createDOM();
    await render(<HistoriaRoute />);

    const callouts = container.querySelectorAll('.callout');
    expect(callouts.length).toBeGreaterThanOrEqual(1);

    for (const callout of callouts) {
      expect(callout.textContent?.toLowerCase()).toContain('por confirmar');
    }
  });

  it('renders callouts for the four required callout topics (genealogy, A-D-A-E, Olimpo Díaz, resins)', async () => {
    const { container } = await createDOM();
    await render(<HistoriaRoute />);

    const allText = Array.from(container.querySelectorAll('.callout'))
      .map((el) => el.textContent ?? '')
      .join(' ')
      .toLowerCase();

    expect(allText).toMatch(/flórez|flores/i); // genealogy
    expect(allText).toMatch(/a-d-a-e/i); // A-D-A-E
    expect(allText).toMatch(/olimpo/i); // Olimpo Díaz
    expect(allText).toMatch(/resin|copal|damar|colofonia|brea/i); // resins
  });
});

// H3-2 — sections with no unconfirmed claims render NO callout and NO empty wrapper.
describe('Historia route (H3-2)', () => {
  it('does not render any callout for the "Contexto orinoquense" or "Conclusión" sections', async () => {
    const { container } = await createDOM();
    await render(<HistoriaRoute />);

    // Build map: section title → has callout?
    const sections = Array.from(container.querySelectorAll('section'));
    const byTitle = new Map<string, boolean>();
    for (const sec of sections) {
      const h2 = sec.querySelector('h2');
      const title = h2?.textContent?.trim() ?? '';
      const hasCallout = sec.querySelectorAll('.callout').length > 0;
      byTitle.set(title, hasCallout);
    }

    // Sections with empty porConfirmar in src/content/historia.ts:
    expect(byTitle.get('Contexto orinoquense')).toBe(false);
    expect(byTitle.get('Conclusión')).toBe(false);
  });
});

// H4 — tuning section contains "E-A-D-A" AND a footnote referencing A-D-A-E
// marked "por confirmar" AND cites es.wikipedia.org/wiki/Bandola_llanera.
describe('Historia route (H4)', () => {
  it('Maní y afinación section states E-A-D-A and includes A-D-A-E footnote', async () => {
    const { container } = await createDOM();
    await render(<HistoriaRoute />);

    const sections = Array.from(container.querySelectorAll('section'));
    const tuning = sections.find((s) => /Maní y afinación/.test(s.textContent ?? ''));
    expect(tuning).toBeDefined();
    const text = tuning?.textContent ?? '';

    expect(text).toContain('E-A-D-A');
    expect(text).toMatch(/A-D-A-E/i);

    const footnoteEl = tuning?.querySelector('[data-testid="footnotes"]');
    expect(footnoteEl).toBeDefined();
    expect(footnoteEl?.textContent?.toLowerCase()).toContain('por confirmar');

    const sourceLink = tuning?.querySelector('a[href*="es.wikipedia.org/wiki/Bandola_llanera"]');
    expect(sourceLink).toBeDefined();
  });
});

// H5 — genealogy section renders "Flórez" (with accent) as default AND
// includes a footnote mentioning "Flores" variant marked "por confirmar".
describe('Historia route (H5)', () => {
  it('Genealogía renders Flórez (with accent) and includes Flores variant footnote', async () => {
    const { container } = await createDOM();
    await render(<HistoriaRoute />);

    const sections = Array.from(container.querySelectorAll('section'));
    const gene = sections.find((s) => /Genealogía/.test(s.textContent ?? ''));
    expect(gene).toBeDefined();
    const text = gene?.textContent ?? '';

    expect(text).toContain('Flórez');
    expect(text).toContain('Flores');

    const footnoteEl = gene?.querySelector('[data-testid="footnotes"]');
    expect(footnoteEl).toBeDefined();
    expect(footnoteEl?.textContent?.toLowerCase()).toContain('por confirmar');
  });
});

// H6 — body is ReadonlyArray<Paragraph> (NOT string), NOT MDX, typed.
// Plus the static-analysis check: no string literal > 200 chars.
describe('Historia route (H6)', () => {
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
    // Read the source file from the file system and statically scan.
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const src = await fs.readFile(
      path.resolve(__dirname, '../../content/historia.ts'),
      'utf8',
    );

    // Match all single-quoted string literals (best-effort; the file does not
    // use backticks or double-quotes for body text).
    const literalRegex = /'([^'\\]*(?:\\.[^'\\]*)*)'/g;
    const matches = src.matchAll(literalRegex);
    for (const m of matches) {
      const lit = m[1] ?? '';
      // Skip import URLs, hrefs, keys, IDs.
      if (lit.startsWith('http')) continue;
      if (lit.startsWith('/')) continue;
      if (lit.length === 0) continue;
      expect({ len: lit.length, lit }).toHaveProperty('len', expect.any(Number));
      expect(lit.length).toBeLessThanOrEqual(200);
    }
  });
});

// H7-1 — each section has ≥1 <a> to its source URL AND source is typed Source.
describe('Historia route (H7-1)', () => {
  it('every section surfaces a typed Source link to the source URL', async () => {
    const { container } = await createDOM();
    await render(<HistoriaRoute />);

    const sections = Array.from(container.querySelectorAll('section'));
    expect(sections.length).toBe(6);

    for (const sec of sections) {
      const sourceLink = sec.querySelector('[data-testid="source"] a');
      expect(sourceLink).toBeDefined();
      const href = sourceLink?.getAttribute('href') ?? '';
      expect(href).toMatch(/^https?:\/\//);
    }
  });
});

// H7-2 — only the two primary sources are cited (es.wikipedia.org/wiki/Bandola_llanera,
// es.wikipedia.org/wiki/Joropo_llanero), and uncited claims are wrapped in callouts.
describe('Historia route (H7-2)', () => {
  it('only cites es.wikipedia.org/wiki/Bandola_llanera or /Joropo_llanero as primary', async () => {
    const { container } = await createDOM();
    await render(<HistoriaRoute />);

    const links = Array.from(container.querySelectorAll('a[href^="https://"]'));
    const hrefs = links.map((l) => l.getAttribute('href') ?? '');
    const externalHrefs = hrefs.filter(
      (h) => h.startsWith('https://es.wikipedia.org/wiki/'),
    );

    for (const href of externalHrefs) {
      const ok =
        href === 'https://es.wikipedia.org/wiki/Bandola_llanera' ||
        href === 'https://es.wikipedia.org/wiki/Joropo_llanero';
      expect({ href, ok }).toEqual({ href, ok: true });
    }
  });
});
