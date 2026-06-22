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
npm run build      # build producción (client + SSR + static SSG)
npm run preview    # preview del build (vite preview, local)
npm run test       # vitest run (31 unit tests)
npm run test.watch # vitest watch
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

## Running with Docker

The site is shipped as a single-container image built with a multi-stage
`Dockerfile` and orchestrated by `docker-compose.yml`. The container serves
the production build of the Qwik app on port `4173` internally, exposed on
the host at port `1530`. Reachable on the LAN at
`http://<host-lan-ip>:1530/`.

### Bring it up

```bash
docker compose up -d --build
```

First-time build takes 2-5 minutes (downloads the `node:20-alpine` base and
installs npm dependencies). Subsequent runs are instant.

### Verify

```bash
docker compose ps          # 'web' should be 'healthy' within ~30s
docker compose logs -f     # tail the server log
curl -L http://localhost:1530/   # 308 → /historia/, then 200 with the article
```

On the LAN, replace `localhost` with the host's IP (e.g.
`http://192.168.1.115:1530/`) and open the URL from any phone, laptop, or
tablet on the same network.

### Tear it down

```bash
docker compose down        # stop and remove the container
```

### Configuration

| Setting | Value | Where |
|---|---|---|
| Host port | `1530` | `docker-compose.yml` → `ports` |
| Container port | `4173` | `Dockerfile` → `EXPOSE` + `ENV PORT` |
| LAN origin used for SSG | `http://192.168.1.115:1530` | `vite.config.ts` + `ssr.vite.config.ts` → `staticAdapter.origin` |
| Restart policy | `unless-stopped` | `docker-compose.yml` |
| Healthcheck URL | `http://127.0.0.1:4173/historia/` | `docker-compose.yml` |
| Run-as user | `node` (uid 1000, non-root) | `Dockerfile` → `USER node` |
