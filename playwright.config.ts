import { defineConfig } from '@playwright/test';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env.local') });

const DEFAULT_TENANT = 'park-hamaayanot';
const baseURL = process.env.SITE_URL || 'https://emek-kappa.vercel.app';

// Append ?tenant= for local/vercel testing (middleware supports this)
const tenantBaseURL = baseURL.includes('localhost')
  ? baseURL
  : baseURL;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,        // tests depend on each other (register → login → scan → …)
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: tenantBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'he-IL',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        // Pass default tenant slug as custom header for all requests
        extraHTTPHeaders: {
          'x-e2e-tenant': DEFAULT_TENANT,
        },
      },
    },
  ],
});
