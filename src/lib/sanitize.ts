/**
 * Sanitization utilities for PostgREST search, CSV export, and branding validation.
 * Task 2.2 — Security Hardening [PAR-191]
 */

/**
 * Strip characters that can manipulate PostgREST `.or()` filters.
 * Removes parentheses, commas, backslashes, and dots adjacent to operators.
 * Returns a trimmed, safe string for interpolation into PostgREST filter expressions.
 */
export function sanitizeSearchInput(input: string): string {
  if (!input) return '';

  let sanitized = input;

  // Strip backslashes (escape manipulation)
  sanitized = sanitized.replace(/\\/g, '');

  // Strip parentheses (filter grouping manipulation)
  sanitized = sanitized.replace(/[()]/g, '');

  // Strip commas (filter separator manipulation)
  sanitized = sanitized.replace(/,/g, '');

  // Strip dots that appear adjacent to PostgREST operators like .eq., .ilike., .or., etc.
  // This prevents injection of operators like "value.eq.injected"
  sanitized = sanitized.replace(/\.(eq|neq|gt|gte|lt|lte|like|ilike|is|in|cs|cd|sl|sr|nxl|nxr|adj|ov|fts|plfts|phfts|wfts|not|and|or)\./gi, '');

  // Strip percent signs (wildcard manipulation in ilike)
  sanitized = sanitized.replace(/%/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Escape a field value for safe inclusion in a CSV file per RFC 4180.
 * Also neutralizes spreadsheet formula injection by prefixing dangerous
 * leading characters with a single quote.
 */
export function escapeCSVField(field: string | null | undefined): string {
  if (field == null) return '';

  let value = String(field);

  // Formula prefix protection: neutralize leading characters that spreadsheet
  // applications interpret as formula starters.
  if (/^[=+\-@\t\r]/.test(value)) {
    value = "'" + value;
  }

  // RFC 4180: if the field contains a comma, double-quote, or newline, wrap in quotes.
  // Internal double-quotes are escaped by doubling them.
  if (/[",\n\r]/.test(value)) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }

  return value;
}

// --- Branding validation ---

const REQUIRED_COLOR_FIELDS = [
  'primary',
  'accent',
  'background',
  'text',
  'error',
  'success',
] as const;

const OPTIONAL_URL_FIELDS = ['logo_url', 'bg_image_url'] as const;

const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

const ALLOWED_FIELDS = new Set<string>([
  ...REQUIRED_COLOR_FIELDS,
  ...OPTIONAL_URL_FIELDS,
]);

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate a branding configuration object against a strict schema.
 * Returns `{ valid, errors }` where `errors` contains human-readable messages.
 */
export function validateBranding(branding: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!branding || typeof branding !== 'object' || Array.isArray(branding)) {
    return { valid: false, errors: ['Branding must be a non-null object'] };
  }

  const obj = branding as Record<string, unknown>;

  // Check for unknown fields
  for (const key of Object.keys(obj)) {
    if (!ALLOWED_FIELDS.has(key)) {
      errors.push(`Unknown field: "${key}"`);
    }
  }

  // Validate required color fields
  for (const field of REQUIRED_COLOR_FIELDS) {
    const value = obj[field];
    if (value === undefined || value === null || value === '') {
      errors.push(`Missing required field: "${field}"`);
    } else if (typeof value !== 'string') {
      errors.push(`Field "${field}" must be a string`);
    } else if (!HEX_COLOR_RE.test(value)) {
      errors.push(
        `Field "${field}" must be a valid hex color (e.g. #1a8a6e), got: "${value}"`
      );
    }
  }

  // Validate optional URL fields
  for (const field of OPTIONAL_URL_FIELDS) {
    const value = obj[field];
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value !== 'string') {
        errors.push(`Field "${field}" must be a string`);
      } else if (!isValidUrl(value)) {
        errors.push(`Field "${field}" must be a valid HTTP(S) URL, got: "${value}"`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
