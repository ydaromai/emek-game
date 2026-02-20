import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/** Production base domain (3 parts: realife.vercel.app) */
const BASE_DOMAIN = 'realife.vercel.app';
const BASE_DOMAIN_PARTS = BASE_DOMAIN.split('.').length; // 3

/**
 * Extract tenant slug from the request host.
 *
 * Production: <slug>.realife.vercel.app  → slug
 *             realife.vercel.app          → null (bare domain)
 *             www.realife.vercel.app      → null (www = bare)
 *
 * Local dev (localhost / 127.0.0.1):
 *   1. x-tenant-slug header (set by dev proxy or tests)
 *   2. ?tenant=slug query param
 *   3. null (bare domain)
 */
function extractTenantSlug(request: NextRequest): string | null {
  const host = request.headers.get('host') ?? '';
  const hostname = host.split(':')[0]; // strip port

  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // 1. Check x-tenant-slug header (dev proxy / tests)
    const headerSlug = request.headers.get('x-tenant-slug');
    if (headerSlug) return headerSlug;

    // 2. Check ?tenant= query param
    const querySlug = request.nextUrl.searchParams.get('tenant');
    if (querySlug) return querySlug;

    return null;
  }

  // Production / preview deployments
  const parts = hostname.split('.');
  if (parts.length > BASE_DOMAIN_PARTS) {
    const subdomain = parts[0];
    // www is not a tenant
    if (subdomain === 'www') return null;
    return subdomain;
  }

  // Bare domain — no tenant
  return null;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // ── 1. Tenant resolution ──────────────────────────────────────────
  const tenantSlug = extractTenantSlug(request);

  // Set pathname header for server components to detect current route
  request.headers.set('x-next-pathname', request.nextUrl.pathname);

  // Set x-tenant-slug header on the response for downstream server components
  if (tenantSlug) {
    response.headers.set('x-tenant-slug', tenantSlug);
    // Also set on request headers so server components can read via headers()
    request.headers.set('x-tenant-slug', tenantSlug);
  }

  // Re-create response so request header changes are forwarded
  response = NextResponse.next({
    request: { headers: request.headers },
  });
  if (tenantSlug) {
    response.headers.set('x-tenant-slug', tenantSlug);
  }

  // ── 2. Supabase auth client (existing logic) ─────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          // Re-apply tenant header after response re-creation
          if (tenantSlug) {
            response.headers.set('x-tenant-slug', tenantSlug);
          }
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ── 3. Get session ────────────────────────────────────────────────
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // ── 4. Route protection ───────────────────────────────────────────

  // Protect visitor game routes
  const protectedVisitorRoutes = ['/game', '/animal', '/redeem'];
  if (protectedVisitorRoutes.some((r) => pathname.startsWith(r)) && !session) {
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
    );
  }

  // Protect admin routes (except admin login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !session) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Protect super-admin routes (except super-admin login)
  if (
    pathname.startsWith('/super-admin') &&
    pathname !== '/super-admin/login' &&
    !session
  ) {
    return NextResponse.redirect(new URL('/super-admin/login', request.url));
  }

  // ── 5. Return response with tenant header ─────────────────────────
  return response;
}

export const config = {
  matcher: [
    '/game/:path*',
    '/animal/:path*',
    '/redeem/:path*',
    '/admin/:path*',
    '/scan/:path*',
    '/super-admin/:path*',
  ],
};
