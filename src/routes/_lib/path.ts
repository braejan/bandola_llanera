/**
 * Path helpers for the slash-tolerant active state.
 *
 * REQ-M-002: `loc.url.pathname` typically ends with a trailing slash (e.g. `/historia/`)
 * while nav hrefs in NAV_ENTRIES are slashless (e.g. `/historia`). A literal equality
 * check would mark the active entry as inactive. We normalize both sides.
 */

export function normalizePath(p: string): string {
  if (p === '/') return '/';
  return p.endsWith('/') ? p.slice(0, -1) : p;
}

export function isActivePath(current: string, entryHref: string): boolean {
  return normalizePath(current) === normalizePath(entryHref);
}
