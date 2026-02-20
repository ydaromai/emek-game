/** Production base domain (3 parts: realife.vercel.app) */
const BASE_DOMAIN = 'realife.vercel.app';
const BASE_DOMAIN_PARTS = BASE_DOMAIN.split('.').length; // 3

/**
 * Extract tenant slug from hostname, headers, and query params.
 *
 * Production: <slug>.realife.vercel.app  -> slug
 *             realife.vercel.app          -> null (bare domain)
 *             www.realife.vercel.app      -> null (www = bare)
 *
 * Local dev (localhost / 127.0.0.1):
 *   1. x-tenant-slug header (set by dev proxy or tests)
 *   2. ?tenant=slug query param
 *   3. null (bare domain)
 */
export function extractTenantSlug(
  host: string,
  headerSlug: string | null,
  querySlug: string | null,
): string | null {
  const hostname = host.split(':')[0]; // strip port

  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (headerSlug) return headerSlug;
    if (querySlug) return querySlug;
    return null;
  }

  // Production / preview deployments
  const parts = hostname.split('.');
  if (parts.length > BASE_DOMAIN_PARTS) {
    const subdomain = parts[0];
    if (subdomain === 'www') return null;
    return subdomain;
  }

  // Bare domain
  return null;
}

/** Validate a CSS color value is a safe hex color */
export function sanitizeHexColor(value: string): string {
  return /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : '';
}
