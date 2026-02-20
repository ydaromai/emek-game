import { test, expect, type Page } from '@playwright/test';
import { DEFAULT_TENANT_SLUG } from './helpers';

// ─────────────────────────────────────────────────────────────────────────────
// Admin CRUD E2E tests
//
// These tests require E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD env vars.
// They validate admin list pages, search functionality, and PostgREST
// injection resilience.
// ─────────────────────────────────────────────────────────────────────────────

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

const TENANT_PARAM = `?tenant=${DEFAULT_TENANT_SLUG}`;

// Skip the entire suite if admin credentials are not configured
test.describe('Admin CRUD', () => {
  test.beforeEach(async () => {
    test.skip(
      !adminEmail || !adminPassword,
      'Skipping admin CRUD tests: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set',
    );
  });

  async function adminLogin(page: Page) {
    await page.goto(`/admin/login${TENANT_PARAM}`);
    await page.getByPlaceholder('admin@example.com').fill(adminEmail!);
    await page.getByPlaceholder('הסיסמה שלכם').fill(adminPassword!);
    await page.getByRole('button', { name: /כניסה/ }).click();
    await page.waitForURL('**/admin/dashboard**', { timeout: 10_000 });
  }

  // ── Animal list page loads ──────────────────────────────────────────────

  test('animal list page loads and shows stations', async ({ page }) => {
    await adminLogin(page);
    await page.goto(`/admin/animals${TENANT_PARAM}`);

    // Page heading should be visible
    await expect(page.getByText('תחנות חיות')).toBeVisible({ timeout: 10_000 });

    // Table should render with at least one row containing an animal name
    const tableRows = page.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10_000 });

    // Each row should have an edit link
    const editLinks = page.getByRole('link', { name: /עריכה/ });
    await expect(editLinks.first()).toBeVisible();
  });

  // ── Search with PostgREST injection attempt ─────────────────────────────

  test('search handles PostgREST injection attempt gracefully', async ({ page }) => {
    await adminLogin(page);
    await page.goto(`/admin/animals${TENANT_PARAM}`);

    // Wait for the page to fully load
    await expect(page.getByText('תחנות חיות')).toBeVisible({ timeout: 10_000 });

    // Look for a search input — if one exists, test injection; otherwise verify
    // that the page loaded safely (the admin animals page may not have search yet)
    const searchInput = page.locator('input[type="search"], input[placeholder*="חיפוש"], input[name="search"]');
    const hasSearch = await searchInput.count();

    if (hasSearch > 0) {
      // Enter a PostgREST injection attempt
      await searchInput.first().fill('test),full_name.eq.admin');
      // Wait for any client-side filtering or API call to complete
      await page.waitForLoadState('networkidle');

      // The page should NOT show an error or crash
      // Verify no server error messages appear
      await expect(page.locator('text=/500|Internal Server Error|error/i')).toHaveCount(0);

      // The page heading should still be visible (page did not crash)
      await expect(page.getByText('תחנות חיות')).toBeVisible();
    } else {
      // No search input — verify the table loaded without injection vector
      // Navigate with injection attempt in URL query param
      await page.goto(`/admin/animals${TENANT_PARAM}&search=test),full_name.eq.admin`);

      // Page should still load without error
      await expect(page.getByText('תחנות חיות')).toBeVisible({ timeout: 10_000 });

      // No server error should be displayed
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('Internal Server Error');
      expect(bodyText).not.toContain('PostgrestError');
    }
  });

  // ── Toggle active status ────────────────────────────────────────────────

  test('toggle active button is present on animal rows', async ({ page }) => {
    await adminLogin(page);
    await page.goto(`/admin/animals${TENANT_PARAM}`);

    await expect(page.getByText('תחנות חיות')).toBeVisible({ timeout: 10_000 });

    // Each animal row should have an active/inactive toggle button
    const toggleButtons = page.locator('button:has-text("פעיל"), button:has-text("לא פעיל")');
    await expect(toggleButtons.first()).toBeVisible();
  });

  // ── QR download button exists ───────────────────────────────────────────

  test('QR download button is present on animal rows', async ({ page }) => {
    await adminLogin(page);
    await page.goto(`/admin/animals${TENANT_PARAM}`);

    await expect(page.getByText('תחנות חיות')).toBeVisible({ timeout: 10_000 });

    // Each animal row should have a QR button
    const qrButtons = page.locator('button:has-text("QR")');
    await expect(qrButtons.first()).toBeVisible();
  });
});
