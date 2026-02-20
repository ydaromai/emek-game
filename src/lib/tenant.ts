import { cache } from 'react';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { Tenant } from '@/types/database';

/**
 * Get tenant slug from middleware-set header.
 * Returns null if on bare domain (no tenant).
 */
export async function getTenantSlug(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('x-tenant-slug');
}

/**
 * Fetch full tenant config from DB, deduped per-request via React cache().
 * No cross-request caching (Edge runtime is stateless).
 */
export const getTenant = cache(async (slug: string): Promise<Tenant | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  return data;
});

/**
 * Get tenant or redirect to error page.
 */
export async function getTenantOrNotFound(slug: string): Promise<Tenant> {
  const tenant = await getTenant(slug);
  if (!tenant) {
    // Use Next.js redirect
    const { redirect } = await import('next/navigation');
    redirect('/tenant-not-found');
  }
  return tenant;
}

/**
 * Convenience: get tenant from headers in one call.
 * Returns null if on bare domain.
 */
export async function resolveTenant(): Promise<Tenant | null> {
  const slug = await getTenantSlug();
  if (!slug) return null;
  return getTenant(slug);
}
