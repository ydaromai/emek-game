import { describe, it, expect } from 'vitest';
import { extractTenantSlug, sanitizeHexColor } from './tenant-slug';

describe('extractTenantSlug', () => {
  // --- Production / preview deployments ---

  it('extracts subdomain from production host', () => {
    expect(extractTenantSlug('park-hamaayanot.realife.vercel.app', null, null))
      .toBe('park-hamaayanot');
  });

  it('returns null for bare production domain', () => {
    expect(extractTenantSlug('realife.vercel.app', null, null)).toBeNull();
  });

  it('returns null for www subdomain', () => {
    expect(extractTenantSlug('www.realife.vercel.app', null, null)).toBeNull();
  });

  it('handles host with port', () => {
    expect(extractTenantSlug('park-hamaayanot.realife.vercel.app:443', null, null))
      .toBe('park-hamaayanot');
  });

  // --- Local development ---

  it('returns header slug on localhost', () => {
    expect(extractTenantSlug('localhost:3000', 'my-park', null))
      .toBe('my-park');
  });

  it('returns query slug on localhost when no header', () => {
    expect(extractTenantSlug('localhost:3000', null, 'my-park'))
      .toBe('my-park');
  });

  it('header slug takes priority over query slug on localhost', () => {
    expect(extractTenantSlug('localhost:3000', 'header-park', 'query-park'))
      .toBe('header-park');
  });

  it('returns null on localhost with no slug source', () => {
    expect(extractTenantSlug('localhost:3000', null, null)).toBeNull();
  });

  it('works with 127.0.0.1', () => {
    expect(extractTenantSlug('127.0.0.1:3001', 'test-tenant', null))
      .toBe('test-tenant');
  });

  it('returns null for 127.0.0.1 with no slug', () => {
    expect(extractTenantSlug('127.0.0.1', null, null)).toBeNull();
  });

  // --- Edge cases ---

  it('handles empty host', () => {
    expect(extractTenantSlug('', null, null)).toBeNull();
  });
});

describe('sanitizeHexColor', () => {
  it('accepts valid 6-digit hex color', () => {
    expect(sanitizeHexColor('#1a8a6e')).toBe('#1a8a6e');
  });

  it('accepts valid 3-digit hex color', () => {
    expect(sanitizeHexColor('#fff')).toBe('#fff');
  });

  it('accepts valid 8-digit hex color (with alpha)', () => {
    expect(sanitizeHexColor('#1a8a6eff')).toBe('#1a8a6eff');
  });

  it('accepts uppercase hex', () => {
    expect(sanitizeHexColor('#FF0000')).toBe('#FF0000');
  });

  it('rejects XSS payload', () => {
    expect(sanitizeHexColor('</style><script>alert(1)</script>')).toBe('');
  });

  it('rejects CSS injection', () => {
    expect(sanitizeHexColor('#fff; background: url(evil)')).toBe('');
  });

  it('rejects non-hex value', () => {
    expect(sanitizeHexColor('red')).toBe('');
  });

  it('rejects empty string', () => {
    expect(sanitizeHexColor('')).toBe('');
  });

  it('rejects hex without #', () => {
    expect(sanitizeHexColor('1a8a6e')).toBe('');
  });
});
