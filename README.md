# Bandola Llanera

Web sobre la bandola llanera ancestral y tradicional, con foco en Maní, Casanare (Colombia).

## Stack

- Qwik 1.x + Qwik City
- TypeScript (strict)
- Vite 5
- Vitest (jsdom env)

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # dev server en http://0.0.0.0:5173 (LAN)
npm run build      # build producción
npm run preview    # preview del build
npm run test       # vitest run (70 unit tests, 1:1 con spec)
npm run test.watch # vitest watch
npm run build.types    # tsc --noEmit (type-check)
npm run check:size     # build-size gate (después de build)
npm run lint       # eslint
npm run fmt        # prettier --write
```

## Estructura

```
src/
├── components/
│   └── side-menu/       # nav persistente (4 entradas)
├── content/
│   ├── _sources.ts      # allowlist tipado Wikipedia-ES
│   ├── historia.ts      # Article tipado (fuente de verdad del artículo)
│   └── afinacion.ts     # Article tipado (5 secciones, scaffold)
├── routes/
│   ├── _components/     # skip-link, toc, progress, landing
│   ├── _lib/            # path, article-view
│   ├── index.tsx        # landing purposeful (sin 308)
│   ├── layout.tsx       # shell responsive (skip-link + side-menu + main + footer)
│   ├── afinacion/       # ruta afinación
│   └── historia/        # artículo largo
├── entry.ssr.tsx
├── entry.dev.tsx
├── global.css           # design tokens + @font-face + a11y
└── root.tsx             # <html lang="es-CO"> + preload
public/
└── fonts/
    └── eb-garamond-subset.woff2   # self-hosted subset (~44 KB)
scripts/
├── check-build-size.mjs           # build-size gate
└── check-build-size.unit.ts       # cobertura del gate
```

## Diseño y tokens

Los design tokens viven en `src/global.css` (`:root`):

- Color: `--color-bg`, `--color-fg`, `--color-accent`, `--color-muted`, `--color-rule`,
  `--color-por-confirmar`, `--color-link`, `--color-link-hover`, `--color-callout-bg`,
  `--color-progress-track`, `--color-progress-fill`.
- Tipografía: `--font-serif` (EB Garamond self-hosted), `--font-sans`, escala 100–600.
- Espaciado: `--space-1` … `--space-6`.
- Motion: `--motion-fast/base/slow`, `--easing-standard`. Honra `prefers-reduced-motion`.
- Breakpoints: `--bp-sm` (600px), `--bp-md` (1024px).
- Focus ring: `--focus-ring` aplicado vía `:focus-visible` en cualquier elemento interactivo.

## Tipografía

EB Garamond se sirve self-hosted en `public/fonts/eb-garamond-subset.woff2` (subconjunto
Latin-1 + caracteres comunes de español, ~44 KB). Declarado vía `@font-face` en
`global.css` con `font-display: swap`. Pre-cargado en `<head>` con `fetchPriority="high"`.

## Performance budget

`npm run check:size` aplica el gate de REQ-M-010:

- JS por ruta gzipped ≤ 5 KB
- CSS total ≤ 10 KB
- Font self-hosted ≤ 50 KB
- Cero peticiones a terceros en el HTML pre-renderizado

Ejecutar después de `npm run build`.

## Contenido

Los artículos en `/historia` y `/afinacion` se renderizan desde `src/content/historia.ts`
y `src/content/afinacion.ts`. Cada sección cita su fuente y declara explícitamente lo
que está "por confirmar" — sin inventar datos sobre la tradición. La fuente debe estar
en el allowlist `WIKI_BANDOLA | WIKI_JOROPO` (research budget Wikipedia-ES only).
