/**
 * Vitest configuration for the bandola llanera strict-TDD suite.
 *
 * - `environment: "happy-dom"` matches the DOM the audio module patches
 *   while leaving Qwik's own internal DOM (domino) untouched.
 * - The `qwikVite` plugin runs in CSR mode so the optimizer rewrites
 *   `component$()`, `useStylesScoped$()`, `$()`, and every other Qwik
 *   macro into the runtime QRL syntax that `@builder.io/qwik/testing`
 *   expects when `createDOM()` is invoked.
 * - `setupFiles` installs `web-audio-test-api` so the audio module's
 *   AudioContext, `createOscillator`, `createGain`, and
 *   `createBiquadFilter` all return observable stubs in the test DOM.
 * - `include` is restricted to `*.unit.{ts,tsx}` so test files never ship
 *   in the Qwik build and never collide with the existing `*.spec.tsx`
 *   ignore globs in `eslint.config.js`.
 *
 * `@builder.io/qwik/testing` ships its own DOM shim (domino); the test
 * environment is reserved for the audio module and the global `window`
 * reference. The Qwik test render path bypasses the test environment.
 *
 * - `qwikCity()` is required so route files (`src/routes/**`) can be
 *   imported directly in tests (`src/routes/index.unit.tsx`, T-11).
 *   Without it, importing anything from `@builder.io/qwik-city`
 *   (e.g. `Link`, `type DocumentHead`) fails to resolve the
 *   `@qwik-city-sw-register` virtual module that `qwik-city`'s main
 *   entry references internally — that virtual module only exists
 *   when the qwikCity vite plugin is active. No new dependency is
 *   added; `@builder.io/qwik-city` is already a devDependency used by
 *   the app's own `vite.config.ts`.
 */
import { defineConfig } from "vitest/config";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    qwikCity(),
    qwikVite({ csr: true }),
    tsconfigPaths({ root: "." }),
  ],
  test: {
    environment: "node",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.{unit.ts,unit.tsx}"],
    css: false,
    globals: false,
  },
});
