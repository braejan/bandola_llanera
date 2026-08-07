import type { Source } from './historia';

/**
 * Source allowlist for the typed Wikipedia-ES research budget.
 * INV-1: this controls the source urls outside of `historia.ts` so that
 * `afinacion.ts` and any future article can reuse the same allowlist.
 *
 * The values are typed as `const` so a downstream literal union can pin them.
 */
export const WIKI_BANDOLA: Source = {
  url: 'https://es.wikipedia.org/wiki/Bandola_llanera',
  label: 'Wikipedia ES — Bandola llanera',
};

export const WIKI_JOROPO: Source = {
  url: 'https://es.wikipedia.org/wiki/Joropo_llanero',
  label: 'Wikipedia ES — Joropo llanero',
};

/** The two allowed source URLs. Use to type-check content references. */
export type SourceUrl = typeof WIKI_BANDOLA.url | typeof WIKI_JOROPO.url;

const ALLOWED_URLS: ReadonlySet<string> = new Set([
  WIKI_BANDOLA.url,
  WIKI_JOROPO.url,
]);

export function isAllowedSourceUrl(url: string): boolean {
  return ALLOWED_URLS.has(url);
}
