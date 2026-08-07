import { describe, it, expect } from 'vitest';
import { afinacionArticle } from './afinacion';
import { WIKI_BANDOLA, WIKI_JOROPO, isAllowedSourceUrl } from './_sources';

const EXPECTED_SECTION_IDS = [
  'afinacion-comun',
  'variantes-documentadas',
  'temple-basico-anselmo',
  'forma-del-instrumento',
  'conclusion-pedagogica',
];

describe('afinacionArticle (REQ-M-007 / INV-1)', () => {
  it('has exactly 5 sections in the locked order', () => {
    expect(afinacionArticle.sections).toHaveLength(5);
    const ids = afinacionArticle.sections.map((s) => s.id);
    expect(ids).toEqual(EXPECTED_SECTION_IDS);
  });

  it('every section has a non-empty title and id', () => {
    for (const s of afinacionArticle.sections) {
      expect(s.id.length).toBeGreaterThan(0);
      expect(s.title.length).toBeGreaterThan(0);
    }
  });

  it('every section id is unique', () => {
    const ids = afinacionArticle.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('temple-basico-anselmo has ≥1 porConfirmar (A-D-A-E attribution)', () => {
    const section = afinacionArticle.sections.find(
      (s) => s.id === 'temple-basico-anselmo',
    );
    expect(section).toBeDefined();
    expect(section!.porConfirmar.length).toBeGreaterThanOrEqual(1);
    const text = section!.porConfirmar.map((c) => c.text).join(' ').toLowerCase();
    expect(text).toContain('a-d-a-e');
  });

  it('every paragraph body is kind "p" or "em"', () => {
    for (const section of afinacionArticle.sections) {
      for (const para of section.body) {
        expect(['p', 'em']).toContain(para.kind);
        expect(typeof para.text).toBe('string');
      }
    }
  });

  it('every section source.url is in the WIKI_BANDOLA | WIKI_JOROPO allowlist', () => {
    for (const section of afinacionArticle.sections) {
      expect(isAllowedSourceUrl(section.source.url)).toBe(true);
    }
  });

  it('the common-tuning section ("afinacion-comun") cites WIKI_BANDOLA', () => {
    const section = afinacionArticle.sections.find(
      (s) => s.id === 'afinacion-comun',
    );
    expect(section?.source.url).toBe(WIKI_BANDOLA.url);
  });

  it('the article title or body mentions E-A-D-A', () => {
    const all = afinacionArticle.sections
      .flatMap((s) => s.body.map((b) => b.text))
      .join(' ');
    expect(all).toContain('E-A-D-A');
  });

  it('the article documents Aretz variants (Mi-Si-Mi-La or Sol-Do-Re-La or Mi-La-Mi-La)', () => {
    const section = afinacionArticle.sections.find(
      (s) => s.id === 'variantes-documentadas',
    );
    expect(section).toBeDefined();
    const text = section!.body.map((b) => b.text).join(' ');
    const hasVariant =
      text.includes('Mi-Si-Mi-La') ||
      text.includes('Sol-Do-Re-La') ||
      text.includes('Mi-La-Mi-La');
    expect(hasVariant).toBe(true);
  });

  it('the article is rejected if any source URL is outside the allowlist', () => {
    // Snapshot: the allowlist has exactly two URLs.
    expect(WIKI_BANDOLA.url).toBe('https://es.wikipedia.org/wiki/Bandola_llanera');
    expect(WIKI_JOROPO.url).toBe('https://es.wikipedia.org/wiki/Joropo_llanero');
    expect(isAllowedSourceUrl('https://example.com')).toBe(false);
  });
});
