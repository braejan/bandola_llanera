import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkBuildSize, checkNoThirdParty } from './check-build-size';

const DIST_DIR = resolve(__dirname, '../dist');
const HAS_BUILD = existsSync(DIST_DIR);

describe('checkBuildSize (REQ-M-010 budget gate)', () => {
  it('returns ok=true when all sizes are within budget', () => {
    const result = checkBuildSize({
      jsBytes: 1000, // 1 KB - well under 5 KB
      cssBytes: 5000, // 5 KB - well under 10 KB
      fontBytes: 30_000, // 30 KB - well under 50 KB
      jsBudget: 5 * 1024,
      cssBudget: 10 * 1024,
      fontBudget: 50 * 1024,
    });
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('returns ok=false when JS exceeds 5 KB', () => {
    const result = checkBuildSize({
      jsBytes: 6 * 1024,
      cssBytes: 0,
      fontBytes: 0,
      jsBudget: 5 * 1024,
      cssBudget: 10 * 1024,
      fontBudget: 50 * 1024,
    });
    expect(result.ok).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]).toMatch(/JS/);
  });

  it('returns ok=false when CSS exceeds 10 KB', () => {
    const result = checkBuildSize({
      jsBytes: 0,
      cssBytes: 12 * 1024,
      fontBytes: 0,
      jsBudget: 5 * 1024,
      cssBudget: 10 * 1024,
      fontBudget: 50 * 1024,
    });
    expect(result.ok).toBe(false);
    expect(result.violations[0]).toMatch(/CSS/);
  });

  it('returns ok=false when font exceeds 50 KB', () => {
    const result = checkBuildSize({
      jsBytes: 0,
      cssBytes: 0,
      fontBytes: 60 * 1024,
      jsBudget: 5 * 1024,
      cssBudget: 10 * 1024,
      fontBudget: 50 * 1024,
    });
    expect(result.ok).toBe(false);
    expect(result.violations[0]).toMatch(/font/);
  });
});

describe('checkNoThirdParty (REQ-M-010 zero third-party requests)', () => {
  it('returns ok=true when no URLs are external', () => {
    const result = checkNoThirdParty({
      html: '<html><head><link href="/build/foo.css"><script src="/build/foo.js"></script></head><body></body></html>',
    });
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('returns ok=false when a third-party URL is found', () => {
    const result = checkNoThirdParty({
      html: '<html><head><link href="https://fonts.googleapis.com/css" rel="stylesheet"></head><body></body></html>',
    });
    expect(result.ok).toBe(false);
    expect(result.violations[0]).toContain('fonts.googleapis.com');
  });

  it('returns ok=false when a mixed-content src=http URL is found', () => {
    const result = checkNoThirdParty({
      html: '<html><body><script src="http://example.com/foo.js"></script></body></html>',
    });
    expect(result.ok).toBe(false);
  });

  it('integration: dist/ exists — assert zero third-party requests (skipped if no build)', () => {
    if (!HAS_BUILD) return;
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const indexHtml = path.resolve(DIST_DIR, 'index.html');
    if (!existsSync(indexHtml)) return;
    const html = fs.readFileSync(indexHtml, 'utf8');
    const result = checkNoThirdParty({ html });
    expect(result.ok).toBe(true);
  });
});
