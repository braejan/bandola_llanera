/**
 * SSR build config — produces the server bundle with both `entry.ssr` and
 * `@qwik-city-plan` as entry points. The static adapter reads both from
 * the output of this build to wire up the production server.
 *
 * Used by `npm run build.static` and the Docker build stage.
 */
import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import { staticAdapter } from '@builder.io/qwik-city/adapters/static/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    qwikCity(),
    qwikVite(),
    staticAdapter({
      origin: 'http://192.168.1.115:1530',
    }),
    tsconfigPaths(),
  ],
  build: {
    ssr: true,
    rollupOptions: {
      input: ['src/entry.preview.tsx', '@qwik-city-plan'],
    },
  },
});
