/**
 * Shared helpers for E2E tests.
 * Uses the Supabase service-role key so we can set up / tear down test data
 * without going through the browser.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
}

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

// ── Auth ────────────────────────────────────────────────────────────────────

export async function createTestUser(suffix: string): Promise<TestUser> {
  const email = `e2e-${suffix}-${Date.now()}@parktest.co.il`;
  const password = 'Test1234pass';

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
      id: user.id,
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
  await sbFetch(`profiles?id=eq.${userId}`, { method: 'DELETE' });
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
}

// ── Data ────────────────────────────────────────────────────────────────────

export async function getAnimals(): Promise<Animal[]> {
  return sbFetch('animals?select=id,name_he,letter,order_index,qr_token&order=order_index');
}

export async function getUserProgress(userId: string) {
  return sbFetch(`user_progress?user_id=eq.${userId}&select=letter,animal_id`);
}

export async function getRedemption(userId: string) {
  return sbFetch(`redemptions?user_id=eq.${userId}&select=redemption_code,redeemed`);
}

export function getExpectedWord(animals: Animal[]): string {
  return animals.map((a) => a.letter).join('');
}
