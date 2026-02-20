import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { extractTenantSlug } from '@/lib/tenant-slug';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // ── 1. Tenant resolution ──────────────────────────────────────────
  const tenantSlug = extractTenantSlug(
    request.headers.get('host') ?? '',
    request.headers.get('x-tenant-slug'),
    request.nextUrl.searchParams.get('tenant'),
  );

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

  // Helper: build redirect URL preserving ?tenant= for local dev
  function buildRedirect(targetPath: string): URL {
    const url = new URL(targetPath, request.url);
    const tenantParam = request.nextUrl.searchParams.get('tenant');
    if (tenantParam) {
      url.searchParams.set('tenant', tenantParam);
    }
    return url;
  }

  // Protect visitor game routes
  const protectedVisitorRoutes = ['/game', '/animal', '/redeem'];
  if (protectedVisitorRoutes.some((r) => pathname.startsWith(r)) && !session) {
    const loginUrl = buildRedirect('/login');
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin routes (except admin login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !session) {
    return NextResponse.redirect(buildRedirect('/admin/login'));
  }

  // Protect super-admin routes (except super-admin login)
  if (
    pathname.startsWith('/super-admin') &&
    pathname !== '/super-admin/login' &&
    !session
  ) {
    return NextResponse.redirect(buildRedirect('/super-admin/login'));
  }

  // ── 5. Return response with tenant header ─────────────────────────
  return response;
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/complete-profile',
    '/forgot-password',
    '/game/:path*',
    '/animal/:path*',
    '/redeem/:path*',
    '/admin/:path*',
    '/scan/:path*',
    '/super-admin/:path*',
    '/api/:path*',
  ],
};
