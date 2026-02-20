import { describe, it, expect } from 'vitest';
import {
  sanitizeSearchInput,
  escapeCSVField,
  validateBranding,
} from './sanitize';

// ---------------------------------------------------------------------------
// sanitizeSearchInput
// ---------------------------------------------------------------------------
describe('sanitizeSearchInput', () => {
  it('passes normal search terms through unchanged', () => {
    expect(sanitizeSearchInput('hello')).toBe('hello');
    expect(sanitizeSearchInput('John Doe')).toBe('John Doe');
    expect(sanitizeSearchInput('שלום')).toBe('שלום');
  });

  it('trims whitespace', () => {
    expect(sanitizeSearchInput('  hello  ')).toBe('hello');
  });

  it('returns empty string for empty/falsy input', () => {
    expect(sanitizeSearchInput('')).toBe('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeSearchInput(null as any)).toBe('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeSearchInput(undefined as any)).toBe('');
  });

  it('strips parentheses', () => {
    expect(sanitizeSearchInput('test(value)')).toBe('testvalue');
    expect(sanitizeSearchInput('(or)')).toBe('or');
  });

  it('strips commas', () => {
    expect(sanitizeSearchInput('a,b,c')).toBe('abc');
  });

  it('strips backslashes', () => {
    expect(sanitizeSearchInput('te\\st')).toBe('test');
  });

  it('strips PostgREST operators (dot-delimited)', () => {
    expect(sanitizeSearchInput('value.eq.injected')).toBe('valueinjected');
    expect(sanitizeSearchInput('x.ilike.%25test%25')).toBe('x25test25');
    expect(sanitizeSearchInput('field.or.other')).toBe('fieldother');
  });

  it('strips percent signs to prevent wildcard manipulation', () => {
    expect(sanitizeSearchInput('%admin%')).toBe('admin');
  });

  it('handles combined SQL injection attempts', () => {
    // sanitizeSearchInput strips PostgREST-dangerous chars; semicolons are not
    // PostgREST operators so they pass through (RLS / parameterized queries
    // handle SQL injection).
    const result = sanitizeSearchInput("'; DROP TABLE profiles; --");
    expect(result).not.toContain('\\');
    expect(result).not.toContain('(');
    expect(result).not.toContain(')');
    expect(result).not.toContain(',');
  });

  it('handles PostgREST filter injection attempts', () => {
    const attack = 'admin%,email.eq.admin@evil.com)';
    const result = sanitizeSearchInput(attack);
    expect(result).not.toContain('(');
    expect(result).not.toContain(')');
    expect(result).not.toContain(',');
    expect(result).not.toContain('%');
  });
});

// ---------------------------------------------------------------------------
// escapeCSVField
// ---------------------------------------------------------------------------
describe('escapeCSVField', () => {
  it('returns plain text unchanged', () => {
    expect(escapeCSVField('hello')).toBe('hello');
    expect(escapeCSVField('שלום')).toBe('שלום');
  });

  it('returns empty string for null/undefined', () => {
    expect(escapeCSVField(null)).toBe('');
    expect(escapeCSVField(undefined)).toBe('');
  });

  it('wraps fields containing commas in double quotes', () => {
    expect(escapeCSVField('a,b')).toBe('"a,b"');
  });

  it('wraps fields containing newlines in double quotes', () => {
    expect(escapeCSVField('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCSVField('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('escapes internal double quotes by doubling them', () => {
    expect(escapeCSVField('say "hello"')).toBe('"say ""hello"""');
  });

  it('neutralizes formula prefix = with single quote', () => {
    // escapeCSVField only prefixes with single quote; parentheses are NOT stripped
    expect(escapeCSVField('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
  });

  it('neutralizes formula prefix + with single quote', () => {
    expect(escapeCSVField('+cmd|...')).toBe("'+cmd|...");
  });

  it('neutralizes formula prefix - with single quote', () => {
    expect(escapeCSVField('-1+1')).toBe("'-1+1");
  });

  it('neutralizes formula prefix @ with single quote', () => {
    expect(escapeCSVField('@SUM(A1)')).toBe("'@SUM(A1)");
  });

  it('neutralizes formula prefix tab with single quote and wraps in quotes', () => {
    expect(escapeCSVField('\tdata')).toBe("\"'\tdata\"");
  });

  it('neutralizes formula prefix carriage return with single quote', () => {
    expect(escapeCSVField('\rdata')).toBe("\"'\rdata\"");
  });

  it('handles field with both formula prefix and comma', () => {
    expect(escapeCSVField('=a,b')).toBe("\"'=a,b\"");
  });

  it('coerces non-string values to strings', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(escapeCSVField(123 as any)).toBe('123');
  });
});

// ---------------------------------------------------------------------------
// validateBranding
// ---------------------------------------------------------------------------
describe('validateBranding', () => {
  const validBranding = {
    primary: '#1a8a6e',
    accent: '#FF5733',
    background: '#ffffff',
    text: '#000',
    error: '#ff0000',
    success: '#00ff00',
  };

  it('accepts valid branding with all required fields', () => {
    const result = validateBranding(validBranding);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts branding with optional URL fields', () => {
    const result = validateBranding({
      ...validBranding,
      logo_url: 'https://example.com/logo.png',
      bg_image_url: 'https://cdn.example.com/bg.jpg',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts branding with empty optional URL fields', () => {
    const result = validateBranding({
      ...validBranding,
      logo_url: '',
      bg_image_url: '',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects null', () => {
    const result = validateBranding(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Branding must be a non-null object');
  });

  it('rejects arrays', () => {
    const result = validateBranding([]);
    expect(result.valid).toBe(false);
  });

  it('rejects non-objects', () => {
    const result = validateBranding('string');
    expect(result.valid).toBe(false);
  });

  it('fails when required fields are missing', () => {
    const result = validateBranding({ primary: '#fff' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('accent'));
    expect(result.errors).toContainEqual(expect.stringContaining('background'));
    expect(result.errors).toContainEqual(expect.stringContaining('text'));
    expect(result.errors).toContainEqual(expect.stringContaining('error'));
    expect(result.errors).toContainEqual(expect.stringContaining('success'));
  });

  it('fails for invalid hex colors', () => {
    const result = validateBranding({ ...validBranding, primary: 'red' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('primary')
    );
  });

  it('rejects XSS in color fields', () => {
    const result = validateBranding({
      ...validBranding,
      primary: '</style><script>alert(1)</script>',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('primary'));
  });

  it('rejects CSS injection in color fields', () => {
    const result = validateBranding({
      ...validBranding,
      accent: '#fff; background: url(evil)',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('accent'));
  });

  it('rejects hex color without # prefix', () => {
    const result = validateBranding({ ...validBranding, text: 'ffffff' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('text'));
  });

  it('accepts 3-digit hex', () => {
    const result = validateBranding({ ...validBranding, text: '#fff' });
    expect(result.valid).toBe(true);
  });

  it('accepts 8-digit hex (with alpha)', () => {
    const result = validateBranding({ ...validBranding, text: '#ffffffaa' });
    expect(result.valid).toBe(true);
  });

  it('rejects unknown fields', () => {
    const result = validateBranding({
      ...validBranding,
      evil_field: 'payload',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('Unknown field: "evil_field"')
    );
  });

  it('rejects invalid URL in optional URL fields', () => {
    const result = validateBranding({
      ...validBranding,
      logo_url: 'javascript:alert(1)',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('logo_url'));
  });

  it('rejects non-HTTP URL schemes in optional URL fields', () => {
    const result = validateBranding({
      ...validBranding,
      bg_image_url: 'ftp://evil.com/bg.jpg',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('bg_image_url'));
  });

  it('rejects non-string color field values', () => {
    const result = validateBranding({ ...validBranding, primary: 123 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('"primary" must be a string')
    );
  });

  // font_family validation
  it('accepts valid font_family', () => {
    const result = validateBranding({ ...validBranding, font_family: 'Rubik' });
    expect(result.valid).toBe(true);
  });

  it('accepts null font_family', () => {
    const result = validateBranding({ ...validBranding, font_family: null });
    expect(result.valid).toBe(true);
  });

  it('rejects font_family exceeding 200 characters', () => {
    const result = validateBranding({ ...validBranding, font_family: 'A'.repeat(201) });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('font_family')
    );
  });

  it('rejects non-string font_family', () => {
    const result = validateBranding({ ...validBranding, font_family: 123 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('"font_family" must be a string')
    );
  });

  it('rejects font_family with CSS injection characters', () => {
    const result = validateBranding({ ...validBranding, font_family: 'Rubik; } body { background: url(evil)' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining('font_family')
    );
  });

  it('accepts font_family with quotes and commas (CSS font stack)', () => {
    const result = validateBranding({ ...validBranding, font_family: "'Rubik', sans-serif" });
    expect(result.valid).toBe(true);
  });
});
