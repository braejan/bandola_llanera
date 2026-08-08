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
 */
import { defineConfig } from "vitest/config";
import { qwikVite } from "@builder.io/qwik/optimizer";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [qwikVite({ csr: true }), tsconfigPaths({ root: "." })],
  test: {
    environment: "node",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.{unit.ts,unit.tsx}"],
    css: false,
    globals: false,
  },
});
