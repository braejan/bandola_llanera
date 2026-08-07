import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import { staticAdapter } from '@builder.io/qwik-city/adapters/static/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => {
  return {
    plugins: [
      qwikCity(),
      qwikVite(),
      staticAdapter({
        origin: 'http://192.168.1.115:1530',
      }),
      tsconfigPaths(),
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      headers: {
        'Cache-Control': 'public, max-age=600',
      },
    },
    test: {
      include: ['src/**/*.unit.ts', 'src/**/*.unit.tsx', 'scripts/**/*.unit.ts'],
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./src/test-setup.ts'],
    },
  };
});
