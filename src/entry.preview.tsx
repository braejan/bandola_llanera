/**
 * Qwik City production preview server.
 *
 * Built by `vite build --ssr src/entry.preview.tsx` (see package.json
 * "build.preview"). Boots a plain Node HTTP server with the Qwik City
 * router + static file handler on the port/host from $PORT/$HOST
 * (defaults: 4173 / 0.0.0.0).
 *
 * Used by the Docker image's CMD to serve the production build. The
 * "vite preview" command in package.json is kept for local dev only.
 */
import { createServer } from 'node:http';
import { createQwikCity } from '@builder.io/qwik-city/middleware/node';
import qwikCityPlan from '@qwik-city-plan';
import { manifest } from '@qwik-client-manifest';
import render from './entry.ssr';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface QwikCityPlatform {}
}

const { router, notFound, staticFile } = createQwikCity({
  render,
  qwikCityPlan,
  manifest,
});

const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? '0.0.0.0';

const server = createServer((req, res) => {
  staticFile(req, res, () => {
    router(req, res, () => {
      notFound(req, res, () => undefined);
    });
  });
});

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`bandola-llanera listening on http://${host}:${port}`);
});
