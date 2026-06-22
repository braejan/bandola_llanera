/**
 * Pure data — no Qwik dependency. Safe to import from unit tests.
 */
export interface NavEntry {
  readonly label: string;
  readonly href: string;
  readonly disabled?: boolean;
}

export const NAV_ENTRIES: ReadonlyArray<NavEntry> = [
  { label: 'Inicio', href: '/' },
  { label: 'Historia', href: '/historia' },
  { label: 'Afinación', href: '/afinacion', disabled: true },
  { label: 'Repertorio', href: '/repertorio', disabled: true },
];
