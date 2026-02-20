import { test, expect, type Page } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  createTestTenant,
  deleteTestTenant,
  createTestAnimal,
  getAnimals,
  getUserProgress,
  getRedemption,
  getTenantBySlug,
  DEFAULT_TENANT_SLUG,
  type TestUser,
  type TestTenant,
  type Animal,
} from './helpers';

// ─────────────────────────────────────────────────────────────────────────────
// CROSS-TENANT ISOLATION TESTS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Cross-tenant isolation', () => {
  let tenantA: TestTenant;
  let tenantB: TestTenant;
  let userA: TestUser;
  let animalsA: Animal[];

  test.beforeAll(async () => {
    // Create two test tenants
    tenantA = await createTestTenant('iso-a');
    tenantB = await createTestTenant('iso-b');

    // Create animals for tenant A (3 stations)
    await createTestAnimal(tenantA.id, 1, 'א');
    await createTestAnimal(tenantA.id, 2, 'ב');
    await createTestAnimal(tenantA.id, 3, 'ג');

    // Create animals for tenant B (2 stations)
    await createTestAnimal(tenantB.id, 1, 'ד');
    await createTestAnimal(tenantB.id, 2, 'ה');

    animalsA = await getAnimals(tenantA.id);
    userA = await createTestUser('iso', tenantA.id);
  });

  test.afterAll(async () => {
    if (userA) await deleteTestUser(userA.id);
    if (tenantA) await deleteTestTenant(tenantA.id);
    if (tenantB) await deleteTestTenant(tenantB.id);
  });

  test('tenant A animals are not visible via tenant B query', async () => {
    const animalsB = await getAnimals(tenantB.id);
    const animalsAIds = animalsA.map((a) => a.id);
    const overlap = animalsB.filter((a) => animalsAIds.includes(a.id));
    expect(overlap.length).toBe(0);
  });

  test('user progress is isolated per tenant', async ({ page }) => {
    // Login on tenant A and scan a station
    await page.goto(`/login?tenant=${tenantA.slug}`);
    await page.getByPlaceholder('example@email.com').fill(userA.email);
    await page.getByPlaceholder('הסיסמה שלכם').fill(userA.password);
    await page.getByRole('button', { name: /כניסה/ }).click();
    await page.waitForURL('**/game**', { timeout: 10_000 });

    // Scan first animal on tenant A
    const station = animalsA[0];
    await page.goto(`/scan/${station.qr_token}?tenant=${tenantA.slug}`);
    await page.waitForURL(`**/animal/**`, { timeout: 10_000 });

    // Verify progress exists on tenant A
    const progressA = await getUserProgress(userA.id, tenantA.id);
    expect(progressA.length).toBe(1);

    // Verify no progress on tenant B
    const progressB = await getUserProgress(userA.id, tenantB.id);
    expect(progressB.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUPER ADMIN FLOW TESTS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Super admin access', () => {
  test('non-super-admin cannot access /super-admin routes', async ({ page }) => {
    await page.goto('/super-admin/dashboard');
    // Should redirect to login
    await page.waitForURL('**/super-admin/login**', { timeout: 10_000 });
    expect(page.url()).toContain('/super-admin/login');
  });

  test('super admin API rejects non-super-admin', async ({ request }) => {
    const res = await request.get('/api/super-admin/tenants');
    expect(res.status()).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VARIABLE STATION COUNT TEST
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Variable station count', () => {
  let tenant: TestTenant;
  let user: TestUser;
  let threeAnimals: Animal[];

  test.beforeAll(async () => {
    // Create a tenant with exactly 3 stations
    tenant = await createTestTenant('var-stations');

    await createTestAnimal(tenant.id, 1, 'מ');
    await createTestAnimal(tenant.id, 2, 'י');
    await createTestAnimal(tenant.id, 3, 'ם');

    threeAnimals = await getAnimals(tenant.id);
    expect(threeAnimals.length).toBe(3);

    user = await createTestUser('var', tenant.id);
  });

  test.afterAll(async () => {
    if (user) await deleteTestUser(user.id);
    if (tenant) await deleteTestTenant(tenant.id);
  });

  async function login(page: Page) {
    await page.goto(`/login?tenant=${tenant.slug}`);
    await page.getByPlaceholder('example@email.com').fill(user.email);
    await page.getByPlaceholder('הסיסמה שלכם').fill(user.password);
    await page.getByRole('button', { name: /כניסה/ }).click();
    await page.waitForURL('**/game**', { timeout: 10_000 });
  }

  test('game page shows 3 stations (not 10)', async ({ page }) => {
    await login(page);

    // Should show "0 מתוך 3" in progress
    await expect(page.getByText('0 מתוך 3')).toBeVisible();

    // Should show prompt with "3 התחנות"
    await expect(page.getByText(/3 התחנות/)).toBeVisible();
  });

  test('full game with 3 stations: scan → puzzle → redeem', async ({ page }) => {
    await login(page);

    // Scan all 3 stations
    for (const animal of threeAnimals) {
      await page.goto(`/scan/${animal.qr_token}?tenant=${tenant.slug}`);
      await page.waitForURL(`**/animal/**`, { timeout: 10_000 });
    }

    // Go to game page
    await page.goto(`/game?tenant=${tenant.slug}`);

    // Progress should show 3 מתוך 3
    await expect(page.getByText('3 מתוך 3')).toBeVisible();

    // Submit the 3-letter word
    const expectedWord = threeAnimals.map((a) => a.letter).join('');
    const answerInput = page.getByPlaceholder('הקלידו את המילה שגיליתם');
    await answerInput.clear();
    await answerInput.fill(expectedWord);
    await page.getByRole('button', { name: /בדיקה/ }).click();

    // Should show success
    await expect(page.getByText('כל הכבוד!')).toBeVisible({ timeout: 5000 });

    // Redirect to redeem
    await page.waitForURL('**/redeem**', { timeout: 10_000 });

    // Verify redemption code
    const codeEl = page.locator('[data-testid="redemption-code"]');
    await expect(codeEl).toBeVisible();
    const code = await codeEl.textContent();
    expect(code?.trim().length).toBe(8);

    // Verify in DB
    const redemptions = await getRedemption(user.id, tenant.id);
    expect(redemptions.length).toBe(1);
  });
});
