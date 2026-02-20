import { test, expect, type Page } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  getAnimals,
  getUserProgress,
  getRedemption,
  getTenantBySlug,
  DEFAULT_TENANT_SLUG,
  type TestUser,
  type Animal,
} from './helpers';

// ─────────────────────────────────────────────────────────────────────────────
// State shared across the ordered tests in this file
// ─────────────────────────────────────────────────────────────────────────────

let visitor: TestUser;
let animals: Animal[];
let tenantId: string;
let stationCount: number;

// Append tenant query param for local testing
const TENANT_PARAM = `?tenant=${DEFAULT_TENANT_SLUG}`;

// ─────────────────────────────────────────────────────────────────────────────
// Setup & teardown
// ─────────────────────────────────────────────────────────────────────────────

test.beforeAll(async () => {
  const tenant = await getTenantBySlug(DEFAULT_TENANT_SLUG);
  tenantId = tenant.id;
  animals = await getAnimals(tenantId);
  stationCount = animals.length;
  expect(stationCount).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Landing page', () => {
  test('shows Hebrew welcome with register + login buttons', async ({ page }) => {
    await page.goto(`/${TENANT_PARAM}`);
    await expect(page.getByRole('link', { name: /הרשמה/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /כניסה/ })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Registration', () => {
  test('shows validation for short password', async ({ page }) => {
    await page.goto(`/register${TENANT_PARAM}`);
    await page.getByPlaceholder('ישראל ישראלי').fill('Test User');
    await page.getByPlaceholder('050-1234567').fill('0501234567');
    await page.getByPlaceholder('example@email.com').fill('test@test.com');
    await page.getByPlaceholder('לפחות 8 תווים').fill('short');
    // Error text should appear inline
    await expect(page.getByText('הסיסמה חייבת להכיל לפחות 8 תווים')).toBeVisible();
  });

  test('registers a new user and redirects to /game', async ({ page }) => {
    const email = `e2e-reg-${Date.now()}@parktest.co.il`;
    await page.goto(`/register${TENANT_PARAM}`);

    await page.getByPlaceholder('ישראל ישראלי').fill('Playwright Tester');
    await page.getByPlaceholder('050-1234567').fill('0509999999');
    await page.getByPlaceholder('example@email.com').fill(email);
    await page.getByPlaceholder('לפחות 8 תווים').fill('TestPass1234');

    await page.getByRole('button', { name: /הרשמה/ }).click();

    // Use Promise.race instead of waitForTimeout + triple-OR assertion
    const result = await Promise.race([
      page.waitForURL('**/game**', { timeout: 15_000 }).then(() => 'game' as const),
      page.waitForSelector('[data-testid="email-confirm"]', { timeout: 15_000 }).then(() => 'confirm' as const),
    ]);

    if (result === 'game') {
      // Registration succeeded and redirected to game page
      expect(page.url()).toContain('/game');
    } else {
      // Email confirmation required — verify the confirmation message is visible
      await expect(page.locator('[data-testid="email-confirm"]')).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. LOGIN (with a pre-created user)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test.beforeAll(async () => {
    visitor = await createTestUser('login', tenantId);
  });

  test.afterAll(async () => {
    if (visitor) await deleteTestUser(visitor.id);
  });

  test('rejects wrong password', async ({ page }) => {
    await page.goto(`/login${TENANT_PARAM}`);
    await page.getByPlaceholder('example@email.com').fill(visitor.email);
    await page.getByPlaceholder('הסיסמה שלכם').fill('wrongpassword');
    await page.getByRole('button', { name: /כניסה/ }).click();
    await expect(page.getByText('אימייל או סיסמה שגויים')).toBeVisible();
  });

  test('logs in and redirects to /game', async ({ page }) => {
    await page.goto(`/login${TENANT_PARAM}`);
    await page.getByPlaceholder('example@email.com').fill(visitor.email);
    await page.getByPlaceholder('הסיסמה שלכם').fill(visitor.password);
    await page.getByRole('button', { name: /כניסה/ }).click();
    await page.waitForURL('**/game**', { timeout: 10_000 });
    expect(page.url()).toContain('/game');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3.5. FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Forgot password', () => {
  test('navigates from login to forgot-password and submits email', async ({ page }) => {
    await page.goto(`/login${TENANT_PARAM}`);

    // Click the "forgot password" link
    await page.getByRole('link', { name: /שכחתם סיסמה/ }).click();
    await page.waitForURL('**/forgot-password**', { timeout: 10_000 });

    // Verify the page loaded
    await expect(page.getByRole('heading', { name: 'שחזור סיסמה' })).toBeVisible();

    // Fill in email and submit
    await page.getByLabel('אימייל').fill('test-forgot@parktest.co.il');
    await page.getByRole('button', { name: /שלחו קישור/ }).click();

    // Verify confirmation message appears
    await expect(page.getByText('נשלח אליכם אימייל עם קישור לאיפוס הסיסמה')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('בדקו גם בתיקיית הספאם')).toBeVisible();
  });

  test('shows back-to-login link on forgot-password page', async ({ page }) => {
    await page.goto(`/forgot-password${TENANT_PARAM}`);

    await expect(page.getByRole('link', { name: /חזרה לכניסה/ })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. PROTECTED ROUTES redirect to login
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Auth protection', () => {
  test('redirects /game to /login when unauthenticated', async ({ page }) => {
    await page.goto(`/game${TENANT_PARAM}`);
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('redirects /admin/dashboard to /admin/login', async ({ page }) => {
    await page.goto(`/admin/dashboard${TENANT_PARAM}`);
    await page.waitForURL('**/admin/login**');
    expect(page.url()).toContain('/admin/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. FULL GAME FLOW: Login → QR Scan → Animal page → Game → Puzzle → Redeem
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Full game flow', () => {
  let gameVisitor: TestUser;

  test.beforeAll(async () => {
    gameVisitor = await createTestUser('game', tenantId);
  });

  test.afterAll(async () => {
    if (gameVisitor) await deleteTestUser(gameVisitor.id);
  });

  async function login(page: Page) {
    await page.goto(`/login${TENANT_PARAM}`);
    await page.getByPlaceholder('example@email.com').fill(gameVisitor.email);
    await page.getByPlaceholder('הסיסמה שלכם').fill(gameVisitor.password);
    await page.getByRole('button', { name: /כניסה/ }).click();
    await page.waitForURL('**/game**', { timeout: 10_000 });
  }

  test(`game page shows ${stationCount || 'N'} empty letter slots`, async ({ page }) => {
    await login(page);
    // All slots should show "?" (no letters collected yet)
    const slots = page.locator('text=?');
    await expect(slots.first()).toBeVisible();
  });

  test('QR scan records progress and shows animal page', async ({ page }) => {
    await login(page);

    // Visit the scan URL for station 1
    const station1 = animals[0];
    await page.goto(`/scan/${station1.qr_token}${TENANT_PARAM}`);

    // Should redirect to /animal/<id>
    await page.waitForURL(`**/animal/${station1.id}**`, { timeout: 10_000 });

    // Animal name should be visible
    await expect(page.getByRole('heading', { name: station1.name_he })).toBeVisible();

    // Letter should be displayed
    await expect(page.getByText(station1.letter, { exact: true }).first()).toBeVisible();

    // "Continue to puzzle" button
    await expect(page.getByRole('link', { name: /המשיכו לחידה/ })).toBeVisible();
  });

  test('scanning all stations records progress in DB', async ({ page }) => {
    await login(page);

    // Scan all stations
    for (const animal of animals) {
      await page.goto(`/scan/${animal.qr_token}${TENANT_PARAM}`);
      await page.waitForURL(`**/animal/${animal.id}**`, { timeout: 10_000 });
    }

    // Verify via API
    const progress = await getUserProgress(gameVisitor.id, tenantId);
    expect(progress.length).toBe(stationCount);
  });

  test('game page shows all collected letters after scanning', async ({ page }) => {
    await login(page);

    // Letters should be visible (not "?")
    for (const animal of animals) {
      await expect(page.getByText(animal.letter).first()).toBeVisible();
    }

    // Progress should show N מתוך N
    await expect(page.getByText(`${stationCount} מתוך ${stationCount}`)).toBeVisible();
  });

  test('submitting correct answer shows confetti and redirects to /redeem', async ({ page }) => {
    await login(page);

    const expectedWord = animals.map((a) => a.letter).join('');

    const answerInput = page.getByPlaceholder('הקלידו את המילה שגיליתם');
    await answerInput.clear();
    await answerInput.fill(expectedWord);

    await page.getByRole('button', { name: /בדיקה/ }).click();

    await expect(page.getByText('כל הכבוד!')).toBeVisible({ timeout: 5000 });

    await page.waitForURL('**/redeem**', { timeout: 10_000 });
  });

  test('redeem page shows a redemption code', async ({ page }) => {
    await login(page);
    await page.goto(`/redeem${TENANT_PARAM}`);

    await page.waitForSelector('[dir="ltr"]', { timeout: 10_000 });

    await expect(page.getByText('מזל טוב')).toBeVisible();

    const codeEl = page.locator('[data-testid="redemption-code"]');
    await expect(codeEl).toBeVisible();
    const code = await codeEl.textContent();
    expect(code?.trim().length).toBe(8);

    const redemptions = await getRedemption(gameVisitor.id, tenantId);
    expect(redemptions.length).toBe(1);
    expect(redemptions[0].redeemed).toBe(false);
  });

  test('submitting wrong answer shows error', async ({ page }) => {
    const wrongUser = await createTestUser('wrong', tenantId);
    try {
      await page.goto(`/login${TENANT_PARAM}`);
      await page.getByPlaceholder('example@email.com').fill(wrongUser.email);
      await page.getByPlaceholder('הסיסמה שלכם').fill(wrongUser.password);
      await page.getByRole('button', { name: /כניסה/ }).click();
      await page.waitForURL('**/game**', { timeout: 10_000 });

      // Scan all stations
      for (const animal of animals) {
        await page.goto(`/scan/${animal.qr_token}${TENANT_PARAM}`);
        await page.waitForURL(`**/animal/**`, { timeout: 10_000 });
      }

      await page.goto(`/game${TENANT_PARAM}`);
      const answerInput = page.getByPlaceholder('הקלידו את המילה שגיליתם');
      await answerInput.clear();
      await answerInput.fill('wronganswer');
      await page.getByRole('button', { name: /בדיקה/ }).click();

      await expect(page.getByText('לא מדויק')).toBeVisible({ timeout: 5000 });
    } finally {
      await deleteTestUser(wrongUser.id);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. ADMIN FLOW
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Admin flow', () => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;

  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, 'Admin E2E credentials not configured — set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');

  async function adminLogin(page: Page) {
    await page.goto(`/admin/login${TENANT_PARAM}`);
    await page.getByPlaceholder('admin@example.com').fill(adminEmail);
    await page.getByPlaceholder('הסיסמה שלכם').fill(adminPassword);
    await page.getByRole('button', { name: /כניסה/ }).click();
    await page.waitForURL('**/admin/dashboard**', { timeout: 10_000 });
  }

  test('admin login works and shows dashboard', async ({ page }) => {
    await adminLogin(page);
    await expect(page.getByRole('heading', { name: 'לוח בקרה' })).toBeVisible();
  });

  test('admin rejects non-admin login', async ({ page }) => {
    const nonAdmin = await createTestUser('noadmin', tenantId);
    try {
      await page.goto(`/admin/login${TENANT_PARAM}`);
      await page.getByPlaceholder('admin@example.com').fill(nonAdmin.email);
      await page.getByPlaceholder('הסיסמה שלכם').fill(nonAdmin.password);
      await page.getByRole('button', { name: /כניסה/ }).click();
      await expect(page.getByText('אין לך הרשאות')).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteTestUser(nonAdmin.id);
    }
  });

  test('admin animals page shows stations', async ({ page }) => {
    await adminLogin(page);
    await page.goto(`/admin/animals${TENANT_PARAM}`);

    await expect(page.getByText('תחנות חיות')).toBeVisible();

    // Should show animals for this tenant
    for (const animal of animals) {
      await expect(page.getByText(animal.name_he).first()).toBeVisible();
    }
  });

  test('admin verify-prize page works', async ({ page }) => {
    await adminLogin(page);
    await page.goto(`/admin/verify-prize${TENANT_PARAM}`);

    await expect(page.getByRole('heading', { name: 'אימות פרס' })).toBeVisible();

    await page.getByPlaceholder('הכניסו את הקוד').fill('INVALID1');
    await page.getByRole('button', { name: /אימות/ }).click();
    await expect(page.getByText('קוד לא נמצא')).toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. REDUCED MOTION
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Reduced motion', () => {
  test('floating particles are not rendered when prefers-reduced-motion is reduce', async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`/${TENANT_PARAM}`);

    const particles = page.locator('[data-testid="floating-particles"]');
    await expect(particles).toHaveCount(0);

    await context.close();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. SECURITY
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Security', () => {
  test('has required security headers', async ({ request }) => {
    const res = await request.get(`/${TENANT_PARAM}`);
    expect(res.headers()['x-frame-options']).toBe('DENY');
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
    expect(res.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers()['strict-transport-security']).toContain('max-age=');
  });

  test('invalid QR token shows error page (not 500)', async ({ page }) => {
    await page.goto(`/scan/not-a-uuid${TENANT_PARAM}`);
    await expect(page.getByText('קוד QR לא תקין')).toBeVisible();
  });

  test('API routes reject unauthenticated requests', async ({ request }) => {
    const analytics = await request.get('/api/admin/analytics');
    expect(analytics.status()).toBe(401);

    const exportCsv = await request.get('/api/admin/export/users');
    expect(exportCsv.status()).toBe(401);

    const puzzle = await request.post('/api/puzzle/validate', {
      data: { answer: 'test' },
    });
    expect(puzzle.status()).toBe(401);
  });
});
