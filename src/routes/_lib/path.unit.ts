import { describe, it, expect } from 'vitest';
import { normalizePath, isActivePath } from './path';

// Pure data tests for the path helpers. REQ-M-002 slash-tolerance contract.
describe('normalizePath', () => {
  it('preserves root "/" as "/"', () => {
    expect(normalizePath('/')).toBe('/');
  });

  it('strips a trailing slash from "/historia/"', () => {
    expect(normalizePath('/historia/')).toBe('/historia');
  });

  it('passes "/historia" through unchanged', () => {
    expect(normalizePath('/historia')).toBe('/historia');
  });

  it('strips a trailing slash from "/foo/"', () => {
    expect(normalizePath('/foo/')).toBe('/foo');
  });

  it('passes a deep path "/historia/origen" through unchanged', () => {
    expect(normalizePath('/historia/origen')).toBe('/historia/origen');
  });

  it('strips a trailing slash from a deep path "/historia/origen/"', () => {
    expect(normalizePath('/historia/origen/')).toBe('/historia/origen');
  });
});

describe('isActivePath', () => {
  it('matches "/" to "/"', () => {
    expect(isActivePath('/', '/')).toBe(true);
  });

  it('matches "/historia/" (slash form) to "/historia" (no-slash nav href)', () => {
    expect(isActivePath('/historia/', '/historia')).toBe(true);
  });

  it('matches "/historia" (no-slash) to "/historia" (no-slash nav href)', () => {
    expect(isActivePath('/historia', '/historia')).toBe(true);
  });

  it('does NOT match "/historia/" to "/"', () => {
    expect(isActivePath('/historia/', '/')).toBe(false);
  });

  it('does NOT match "/foo" to "/bar"', () => {
    expect(isActivePath('/foo', '/bar')).toBe(false);
  });

  it('does NOT match "/historia" to "/historia-draft"', () => {
    expect(isActivePath('/historia', '/historia-draft')).toBe(false);
  });
});
