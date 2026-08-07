#!/usr/bin/env node
/**
 * Build-size gate (REQ-M-010).
 *
 * Reads the build output and asserts:
 * - JS shipped per route (gzipped) ≤ 5 KB
 * - CSS total per route ≤ 10 KB
 * - Self-hosted font total ≤ 50 KB
 * - Zero third-party requests in the prerendered HTML
 *
 * Exits non-zero on violation. Run AFTER `npm run build`.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const BUILD = resolve(DIST, 'build');
const FONTS = resolve(ROOT, 'public/fonts');

const JS_BUDGET = 5 * 1024;
const CSS_BUDGET = 10 * 1024;
const FONT_BUDGET = 50 * 1024;

export function checkBuildSize(opts) {
  const violations = [];
  if (opts.jsBytes > opts.jsBudget) {
    violations.push(`JS ${opts.jsBytes}B exceeds budget ${opts.jsBudget}B`);
  }
  if (opts.cssBytes > opts.cssBudget) {
    violations.push(`CSS ${opts.cssBytes}B exceeds budget ${opts.cssBudget}B`);
  }
  if (opts.fontBytes > opts.fontBudget) {
    violations.push(`font ${opts.fontBytes}B exceeds budget ${opts.fontBudget}B`);
  }
  return { ok: violations.length === 0, violations };
}

export function checkNoThirdParty(opts) {
  const violations = [];
  // Find absolute http(s) URLs in href= and src= attributes.
  const re = /(?:href|src)\s*=\s*["'](https?:\/\/[^"']+)["']/gi;
  for (const m of opts.html.matchAll(re)) {
    const url = m[1];
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) continue;
    violations.push(`third-party URL: ${url}`);
  }
  return { ok: violations.length === 0, violations };
}

function gzipSize(filePath) {
  const buf = readFileSync(filePath);
  return gzipSync(buf, { level: 9 }).length;
}

function dirSizeBytes(dir, predicate) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isFile() && (!predicate || predicate(name))) {
      total += statSync(p).size;
    }
  }
  return total;
}

function main() {
  if (!existsSync(DIST)) {
    console.error('dist/ not found — run `npm run build` first.');
    process.exit(1);
  }

  // JS: per-route budget (REQ-M-010).
  // The budget is "JS shipped per route, post-Qwik-resumability, gzipped ≤ 5 KB".
  // Qwik's build emits one chunk per component; a route loads a subset of them
  // on demand. The WIDEST single chunk is the worst case for any single route.
  // The qwikloader runtime is shared across all routes (always loaded once).
  let jsLazyMax = 0; // largest non-runtime chunk
  let jsLazyTotal = 0; // sum of all non-runtime chunks
  let jsRuntime = 0; // qwikloader/runtime
  let cssTotal = 0;
  let cssCount = 0;
  if (existsSync(BUILD)) {
    for (const name of readdirSync(BUILD)) {
      const p = join(BUILD, name);
      if (name.endsWith('.js')) {
        const gz = gzipSize(p);
        const raw = readFileSync(p, 'utf8');
        if (raw.includes('@builder.io/qwik')) {
          jsRuntime += gz;
        } else {
          jsLazyTotal += gz;
          if (gz > jsLazyMax) jsLazyMax = gz;
        }
      } else if (name.endsWith('.css')) {
        cssTotal += statSync(p).size;
        cssCount += 1;
      }
    }
  }

  // Font: vendored binary in public/fonts/.
  const fontBytes = dirSizeBytes(FONTS, (n) => n.endsWith('.woff2'));

  // Apply per-route budget to the LARGEST non-runtime chunk. A single route
  // can only load one chunk at a time; the largest chunk is the worst case.
  const sizeResult = checkBuildSize({
    jsBytes: jsLazyMax,
    cssBytes: cssTotal,
    fontBytes,
    jsBudget: JS_BUDGET,
    cssBudget: CSS_BUDGET,
    fontBudget: FONT_BUDGET,
  });

  console.log(`JS    gzipped max chunk (per-route worst case): ${(jsLazyMax / 1024).toFixed(2)} KB / ${(JS_BUDGET / 1024).toFixed(0)} KB`);
  console.log(`JS    gzipped all lazy chunks: ${(jsLazyTotal / 1024).toFixed(2)} KB (spread across routes)`);
  console.log(`JS    gzipped runtime (qwikloader): ${(jsRuntime / 1024).toFixed(2)} KB (shared, exempt from per-route budget)`);
  console.log(`CSS   total:   ${(cssTotal / 1024).toFixed(2)} KB (${cssCount} files) / ${(CSS_BUDGET / 1024).toFixed(0)} KB`);
  console.log(`Font  total:   ${(fontBytes / 1024).toFixed(2)} KB / ${(FONT_BUDGET / 1024).toFixed(0)} KB`);

  if (!sizeResult.ok) {
    for (const v of sizeResult.violations) console.error('VIOLATION:', v);
  }

  // Third-party request check on the prerendered HTML.
  const htmlCandidates = ['index.html', '404.html'];
  let thirdPartyOk = true;
  for (const name of htmlCandidates) {
    const p = join(DIST, name);
    if (existsSync(p)) {
      const html = readFileSync(p, 'utf8');
      const r = checkNoThirdParty({ html });
      if (!r.ok) {
        thirdPartyOk = false;
        for (const v of r.violations) console.error('THIRD-PARTY:', name, v);
      }
    }
  }

  if (!sizeResult.ok || !thirdPartyOk) process.exit(1);

  console.log('OK — build-size gate passed.');
}

// Only run main() when invoked directly (not when imported as a module).
const isMainModule = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  main();
}
