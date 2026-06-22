# Bandola Llanera

Web sobre la bandola llanera ancestral y tradicional, con foco en Maní, Casanare (Colombia).

## Stack

- Qwik 1.x + Qwik City
- TypeScript (strict)
- Vite 5
- Vitest

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # dev server en http://0.0.0.0:5173 (LAN)
npm run build      # build producción
npm run preview    # preview del build
npm run test       # vitest run (12 unit tests, 1:1 con spec)
npm run test.watch # vitest watch
npm run lint       # eslint
npm run fmt        # prettier --write
```

## Estructura

```
src/
├── components/
│   └── side-menu/       # nav persistente (4 entradas)
├── content/
│   └── historia.ts      # Article tipado (fuente de verdad del artículo)
├── routes/
│   ├── index.tsx        # redirect → /historia
│   ├── layout.tsx       # shell con <SideMenu />
│   └── historia/        # artículo largo
├── entry.ssr.tsx
├── entry.dev.tsx
├── global.css           # design tokens
└── root.tsx
```

## Contenido

El artículo en `/historia` se renderiza desde `src/content/historia.ts`. Cada
sección cita su fuente y declara explícitamente lo que está "por confirmar" —
sin inventar datos sobre la tradición.
