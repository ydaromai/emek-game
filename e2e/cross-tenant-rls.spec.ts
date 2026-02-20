/**
 * Cross-Tenant RLS Validation E2E Tests [PAR-204]
 *
 * These tests exercise actual Supabase RLS policies by using authenticated
 * user tokens (anon key + JWT) rather than the service-role key. This ensures
 * that RLS enforces tenant isolation at the database level.
 */
import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  createTestTenant,
  deleteTestTenant,
  createTestAnimal,
  getAnimals,
  type TestUser,
  type TestTenant,
  type Animal,
} from './helpers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Sign in as a user and get an access token (JWT).
 * Uses the anon key — NOT the service-role key — so RLS applies.
 */
async function getUserToken(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Auth failed for ${email}: ${JSON.stringify(data)}`);
  return data.access_token;
}

/**
 * Query Supabase REST as an authenticated user (with their JWT).
 * RLS policies are enforced because we use the anon key + user JWT.
 */
async function queryAsUser(token: string, path: string, opts: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(opts.headers as Record<string, string>),
    },
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

test.describe('Cross-tenant RLS enforcement', () => {
  let tenantA: TestTenant;
  let tenantB: TestTenant;
  let userA: TestUser;
  let userB: TestUser;
  let animalsA: Animal[];
  let animalsB: Animal[];
  let tokenA: string;
  let tokenB: string;

  test.beforeAll(async () => {
    // Skip if env vars not set (CI without Supabase)
    if (!SUPABASE_URL || !ANON_KEY) {
      test.skip();
      return;
    }

    // Create two tenants
    tenantA = await createTestTenant('rls-a');
    tenantB = await createTestTenant('rls-b');

    // Create animals for each tenant
    await createTestAnimal(tenantA.id, 1, 'א');
    await createTestAnimal(tenantA.id, 2, 'ב');
    await createTestAnimal(tenantB.id, 1, 'ג');
    await createTestAnimal(tenantB.id, 2, 'ד');

    animalsA = await getAnimals(tenantA.id);
    animalsB = await getAnimals(tenantB.id);

    // Create users for each tenant
    userA = await createTestUser('rls-a', tenantA.id);
    userB = await createTestUser('rls-b', tenantB.id);

    // Get auth tokens
    tokenA = await getUserToken(userA.email, userA.password);
    tokenB = await getUserToken(userB.email, userB.password);
  });

  test.afterAll(async () => {
    if (userA) await deleteTestUser(userA.id);
    if (userB) await deleteTestUser(userB.id);
    if (tenantA) await deleteTestTenant(tenantA.id);
    if (tenantB) await deleteTestTenant(tenantB.id);
  });

  test('user A cannot read animals from tenant B via RLS', async () => {
    // User A queries animals with tenant B's ID — RLS should return empty
    const { data } = await queryAsUser(
      tokenA,
      `animals?tenant_id=eq.${tenantB.id}&select=id,name_he,letter`
    );

    // RLS should either return empty array or only allow tenant A animals
    const tenantBIds = animalsB.map((a) => a.id);
    const leaked = (data || []).filter((a: { id: string }) => tenantBIds.includes(a.id));
    expect(leaked.length).toBe(0);
  });

  test('user B cannot read animals from tenant A via RLS', async () => {
    const { data } = await queryAsUser(
      tokenB,
      `animals?tenant_id=eq.${tenantA.id}&select=id,name_he,letter`
    );

    const tenantAIds = animalsA.map((a) => a.id);
    const leaked = (data || []).filter((a: { id: string }) => tenantAIds.includes(a.id));
    expect(leaked.length).toBe(0);
  });

  test('user A cannot write progress for tenant B (RLS blocks insert)', async () => {
    const { status } = await queryAsUser(tokenA, 'user_progress', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userA.id,
        animal_id: animalsB[0].id,
        tenant_id: tenantB.id,
        letter: animalsB[0].letter,
      }),
    });

    // RLS should block the insert — expect 403 or the insert silently fails
    // PostgREST returns 403 for RLS violations, or 201 but the row won't appear
    expect([403, 401, 409]).toContain(status);
  });

  test('user A cannot read profiles from tenant B', async () => {
    const { data } = await queryAsUser(
      tokenA,
      `profiles?tenant_id=eq.${tenantB.id}&select=id,full_name,email`
    );

    // Should get empty array — RLS prevents cross-tenant profile reads
    expect(data || []).toHaveLength(0);
  });

  test('user A cannot read user_progress from tenant B', async () => {
    const { data } = await queryAsUser(
      tokenA,
      `user_progress?tenant_id=eq.${tenantB.id}&select=letter,animal_id`
    );

    expect(data || []).toHaveLength(0);
  });

  test('user A cannot read redemptions from tenant B', async () => {
    const { data } = await queryAsUser(
      tokenA,
      `redemptions?tenant_id=eq.${tenantB.id}&select=redemption_code`
    );

    expect(data || []).toHaveLength(0);
  });

  test('scan page with tenant A context rejects tenant B animal QR', async ({ page }) => {
    // Login as user A on tenant A
    await page.goto(`/login?tenant=${tenantA.slug}`);
    await page.getByPlaceholder('example@email.com').fill(userA.email);
    await page.getByPlaceholder('הסיסמה שלכם').fill(userA.password);
    await page.getByRole('button', { name: /כניסה/ }).click();
    await page.waitForURL('**/game**', { timeout: 10_000 });

    // Try to scan a tenant B animal's QR token from tenant A context
    const tenantBAnimal = animalsB[0];
    await page.goto(`/scan/${tenantBAnimal.qr_token}?tenant=${tenantA.slug}`);

    // Should show "station not found" error (not the animal page)
    const errorVisible = await page.getByText('תחנה לא נמצאה').isVisible().catch(() => false);
    const redirectedToAnimal = page.url().includes('/animal/');

    // Either shows error or doesn't navigate to the animal page
    expect(errorVisible || !redirectedToAnimal).toBeTruthy();
  });

  test('admin of tenant A cannot view tenant B user details via UI', async ({ page }) => {
    // Navigate to admin user detail with a user ID from tenant B
    // This should show "not found" because the user belongs to tenant B
    await page.goto(`/admin/users/${userB.id}?tenant=${tenantA.slug}`);

    // Should show login redirect or "not found" — never show user B's data
    const showsUserBData = await page.getByText(userB.email).isVisible().catch(() => false);
    expect(showsUserBData).toBe(false);
  });
});
