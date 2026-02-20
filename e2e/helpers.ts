/**
 * Shared helpers for E2E tests.
 * Uses the Supabase service-role key so we can set up / tear down test data
 * without going through the browser.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

export interface Animal {
  id: string;
  name_he: string;
  letter: string;
  order_index: number;
  qr_token: string;
  tenant_id: string;
}

export interface TestTenant {
  id: string;
  name: string;
  slug: string;
}

// Default tenant slug for Park HaMaayanot
export const DEFAULT_TENANT_SLUG = 'park-hamaayanot';

// ── Supabase REST helpers ───────────────────────────────────────────────────

async function sbFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(opts.headers as Record<string, string>),
    },
  });
  if (!res.ok && res.status !== 409) {
    const body = await res.text();
    throw new Error(`sbFetch ${path}: ${res.status} — ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Tenant helpers ─────────────────────────────────────────────────────────

export async function getTenantBySlug(slug: string): Promise<TestTenant> {
  const result = await sbFetch(`tenants?slug=eq.${slug}&select=id,name,slug`);
  if (!result || result.length === 0) throw new Error(`Tenant not found: ${slug}`);
  return result[0];
}

export async function createTestTenant(suffix: string): Promise<TestTenant> {
  const slug = `e2e-tenant-${suffix}-${Date.now()}`;
  const result = await sbFetch('tenants', {
    method: 'POST',
    body: JSON.stringify({
      name: `E2E Tenant ${suffix}`,
      slug,
      contact_email: null,
      is_active: true,
      branding: {
        primary: '#1a8a6e',
        accent: '#4ecdc4',
        background: '#f0f7f0',
        text: '#1a2e1a',
        error: '#d4183d',
        success: '#2E7D32',
        logo_url: null,
        bg_image_url: null,
        font_family: null,
      },
    }),
  });
  return { id: result[0].id, name: result[0].name, slug: result[0].slug };
}

export async function deleteTestTenant(tenantId: string) {
  // Delete in FK order
  await sbFetch(`redemptions?tenant_id=eq.${tenantId}`, { method: 'DELETE' });
  await sbFetch(`user_progress?tenant_id=eq.${tenantId}`, { method: 'DELETE' });
  await sbFetch(`profiles?tenant_id=eq.${tenantId}`, { method: 'DELETE' });
  await sbFetch(`animals?tenant_id=eq.${tenantId}`, { method: 'DELETE' });
  await sbFetch(`tenant_memberships?tenant_id=eq.${tenantId}`, { method: 'DELETE' });
  await sbFetch(`site_content?tenant_id=eq.${tenantId}`, { method: 'DELETE' });
  await sbFetch(`tenants?id=eq.${tenantId}`, { method: 'DELETE' });
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function createTestUser(suffix: string, tenantId?: string): Promise<TestUser> {
  const email = `e2e-${suffix}-${Date.now()}@parktest.co.il`;
  const password = process.env.E2E_VISITOR_PASSWORD;
  if (!password) throw new Error('E2E_VISITOR_PASSWORD env var not set — cannot create test users');

  // Resolve tenant ID if not provided
  if (!tenantId) {
    const tenant = await getTenantBySlug(DEFAULT_TENANT_SLUG);
    tenantId = tenant.id;
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const user = await res.json();
  if (!user.id) throw new Error(`createTestUser failed: ${JSON.stringify(user)}`);

  await sbFetch('profiles', {
    method: 'POST',
    body: JSON.stringify({
      user_id: user.id,
      tenant_id: tenantId,
      full_name: `E2E ${suffix}`,
      phone: '0501234567',
      email,
      role: 'visitor',
    }),
  });

  return { id: user.id, email, password };
}

export async function deleteTestUser(userId: string) {
  // Delete in FK order
  await sbFetch(`redemptions?user_id=eq.${userId}`, { method: 'DELETE' });
  await sbFetch(`user_progress?user_id=eq.${userId}`, { method: 'DELETE' });
  await sbFetch(`profiles?user_id=eq.${userId}`, { method: 'DELETE' });
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
}

// ── Data ────────────────────────────────────────────────────────────────────

export async function getAnimals(tenantId?: string): Promise<Animal[]> {
  let path = 'animals?select=id,name_he,letter,order_index,qr_token,tenant_id&is_active=eq.true&order=order_index';
  if (tenantId) {
    path += `&tenant_id=eq.${tenantId}`;
  }
  return sbFetch(path);
}

export async function createTestAnimal(tenantId: string, index: number, letter: string): Promise<Animal> {
  const result = await sbFetch('animals', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id: tenantId,
      name: `E2E Animal ${index}`,
      name_he: `חיה ${index}`,
      letter,
      order_index: index,
      is_active: true,
      fun_facts: 'Test fun fact',
      habitat: 'Test habitat',
      conservation_tip: 'Test tip',
      illustration_key: 'default',
    }),
  });
  return result[0];
}

export async function getUserProgress(userId: string, tenantId?: string) {
  let path = `user_progress?user_id=eq.${userId}&select=letter,animal_id`;
  if (tenantId) {
    path += `&tenant_id=eq.${tenantId}`;
  }
  return sbFetch(path);
}

export async function getRedemption(userId: string, tenantId?: string) {
  let path = `redemptions?user_id=eq.${userId}&select=redemption_code,redeemed`;
  if (tenantId) {
    path += `&tenant_id=eq.${tenantId}`;
  }
  return sbFetch(path);
}

export function getExpectedWord(animals: Animal[]): string {
  return animals.map((a) => a.letter).join('');
}
