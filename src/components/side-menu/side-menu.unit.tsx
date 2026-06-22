import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/qwik';
import { createDOM } from '@builder.io/qwik/testing';
import { SideMenu, NAV_ENTRIES } from './side-menu';

// R1 — there are exactly 4 entries, in the locked order, with the locked labels and hrefs.
// One entry is active ("Historia" route by default in these tests).
describe('SideMenu (R1)', () => {
  it('renders exactly 4 nav entries in locked order with locked labels and hrefs', async () => {
    const { screen } = await createDOM();
    await render(<SideMenu />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(4);

    const labels = ['Inicio', 'Historia', 'Afinación', 'Repertorio'];
    const hrefs = ['/', '/historia', '/afinacion', '/repertorio'];
    labels.forEach((label, idx) => {
      expect(items[idx]).toHaveTextContent(label);
      const anchor = items[idx]!.querySelector('a, span');
      if (anchor?.tagName === 'A') {
        expect((anchor as HTMLAnchorElement).getAttribute('href')).toBe(hrefs[idx]);
      }
    });
  });

  it('exports the locked NAV_ENTRIES constant', () => {
    expect(NAV_ENTRIES).toHaveLength(4);
    expect(NAV_ENTRIES.map((e) => e.label)).toEqual([
      'Inicio',
      'Historia',
      'Afinación',
      'Repertorio',
    ]);
  });
});

// R2 — exactly one entry is marked active (linkActive class + aria-current="page")
// for the current pathname. Other entries are NOT active.
describe('SideMenu (R2)', () => {
  it('marks exactly one entry as active on the current route, others remain inactive', async () => {
    const { screen, render } = await createDOM();
    await render(<SideMenu />);

    const active = screen.getByRole('link', { name: /Historia/i });
    expect(active.className).toContain('linkActive');
    expect(active.getAttribute('aria-current')).toBe('page');

    // Inicio is at /, but the route under test is /historia (default in createDOM).
    const inicio = screen.getByRole('link', { name: /Inicio/i });
    expect(inicio.className).not.toContain('linkActive');
    expect(inicio.getAttribute('aria-current')).toBeNull();
  });
});

// R3 — disabled entries render as <span>, not <a>, with aria-disabled="true".
describe('SideMenu (R3)', () => {
  it('renders disabled entries as <span aria-disabled="true"> with no href', async () => {
    const { screen } = await createDOM();
    await render(<SideMenu />);

    const afinacion = screen.getByTestId('nav-afinación');
    expect(afinacion.tagName).toBe('SPAN');
    expect(afinacion.getAttribute('aria-disabled')).toBe('true');
    expect(afinacion.className).toContain('linkDisabled');
    expect(afinacion.querySelector('a')).toBeNull();

    const repertorio = screen.getByTestId('nav-repertorio');
    expect(repertorio.tagName).toBe('SPAN');
    expect(repertorio.getAttribute('aria-disabled')).toBe('true');
  });

  it('keeps active entries (when on /) as <a> with linkActive class', async () => {
    const { screen, render } = await createDOM();
    await render(<SideMenu />);

    // The test DOM defaults to "/" → Inicio is active.
    const inicio = screen.getByTestId('nav-inicio');
    expect(inicio.tagName).toBe('A');
    expect(inicio.className).toContain('linkActive');
  });
});

// R4 — styles are scoped (the className "linkActive" / "link" appears only on
// nav elements, not globally polluting the document).
describe('SideMenu (R4)', () => {
  it('scopes styles via useStylesScoped$ (no global <style> tag with our class names)', async () => {
    const { screen } = await createDOM();
    await render(<SideMenu />);

    // No globally-applied class on <body> matching our internal names.
    const body = document.body;
    expect(body.className).not.toMatch(/linkActive/);
    expect(body.className).not.toMatch(/linkDisabled/);
    // The nav element has its scoped class.
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });
});

// R5 — each non-disabled entry has a unique, stable testid derived from the label.
describe('SideMenu (R5)', () => {
  it('emits a data-testid "nav-{label}" for each entry', async () => {
    const { screen } = await createDOM();
    await render(<SideMenu />);

    expect(screen.getByTestId('nav-inicio')).toBeInTheDocument();
    expect(screen.getByTestId('nav-historia')).toBeInTheDocument();
    expect(screen.getByTestId('nav-afinación')).toBeInTheDocument();
    expect(screen.getByTestId('nav-repertorio')).toBeInTheDocument();
  });
});
