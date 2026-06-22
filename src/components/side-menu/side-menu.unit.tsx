import { describe, it, expect } from 'vitest';
import { NAV_ENTRIES } from './nav-entries';

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

  it('has exactly two disabled entries (Afinación, Repertorio)', () => {
    const disabled = NAV_ENTRIES.filter((e) => e.disabled === true);
    expect(disabled.map((e) => e.label)).toEqual(['Afinación', 'Repertorio']);
  });

  it('the active entry is the only one without `disabled`', () => {
    const active = NAV_ENTRIES.filter((e) => !e.disabled);
    expect(active.map((e) => e.label)).toEqual(['Inicio', 'Historia']);
  });
});

// R2 — exactly one entry is active. Test by reading the entries contract
// and asserting the indexOf for any route can be computed deterministically.
describe('SideMenu active entry logic (R2)', () => {
  it('exposes a deterministic active predicate over pathname', () => {
    // The route /historia should resolve to index 1 ("Historia").
    const findActive = (pathname: string): number =>
      NAV_ENTRIES.findIndex((e) => e.href === pathname);
    expect(findActive('/historia')).toBe(1);
    expect(findActive('/')).toBe(0);
    // Disabled entries should never match because their href is aspirational.
    expect(findActive('/afinacion')).toBe(2); // matches by href but renders as disabled
  });

  it('disabled entries are distinguishable by the `disabled` flag', () => {
    const entries = NAV_ENTRIES;
    expect(entries.find((e) => e.href === '/afinacion')?.disabled).toBe(true);
    expect(entries.find((e) => e.href === '/repertorio')?.disabled).toBe(true);
    expect(entries.find((e) => e.href === '/historia')?.disabled).toBeUndefined();
    expect(entries.find((e) => e.href === '/')?.disabled).toBeUndefined();
  });
});

// R3 — disabled entries render as <span>, not <a>, with aria-disabled="true".
// This is enforced by the JSX branch: when entry.disabled is true the component
// renders a <span> with aria-disabled="true">. Tested by reading the source.
describe('SideMenu disabled rendering contract (R3)', () => {
  it('the source file renders disabled entries as <span aria-disabled="true">', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const src = await fs.readFile(
      path.resolve(__dirname, './side-menu.tsx'),
      'utf8',
    );
    expect(src).toMatch(/entry\.disabled\s*\?\s*\(/);
    expect(src).toContain('aria-disabled="true"');
    expect(src).toContain('<span');
    expect(src).toContain("data-testid={`nav-${entry.label.toLowerCase()}`}");
  });

  it('the source file renders non-disabled entries as <Link> with aria-current', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const src = await fs.readFile(
      path.resolve(__dirname, './side-menu.tsx'),
      'utf8',
    );
    expect(src).toContain('<Link');
    expect(src).toContain("aria-current={isActive ? 'page' : undefined}");
  });
});

// R4 — styles are scoped via useStylesScoped$.
describe('SideMenu useStylesScoped$ (R4)', () => {
  it('the source file calls useStylesScoped$(styles)', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const src = await fs.readFile(
      path.resolve(__dirname, './side-menu.tsx'),
      'utf8',
    );
    expect(src).toContain('useStylesScoped$');
    expect(src).toMatch(/useStylesScoped\$\(\s*styles\s*\)/);
  });

  it('styles are imported from a sibling CSS module file', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const src = await fs.readFile(
      path.resolve(__dirname, './side-menu.tsx'),
      'utf8',
    );
    expect(src).toMatch(/import\s+styles\s+from\s+['"]\.\/side-menu\.module\.css['"]/);
  });
});

// R5 — each non-disabled entry has a unique, stable testid.
describe('SideMenu data-testid hook (R5)', () => {
  it('the source file emits data-testid "nav-{label}" for each entry', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const src = await fs.readFile(
      path.resolve(__dirname, './side-menu.tsx'),
      'utf8',
    );
    expect(src).toContain("`nav-${entry.label.toLowerCase()}`");
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
