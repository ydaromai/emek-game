# Dev Plan: Security & Quality Hardening

## Pipeline Status
- **Stage:** COMPLETE
- **Started:** 2026-02-20
- **Completed:** 2026-02-20
- **PRD:** docs/prd/security-quality-hardening.md
- **Dev Plan:** docs/dev_plans/security-quality-hardening.md
- **JIRA:** PAR-184 (Epic) ✅
- **Progress:** 15/15 tasks complete ✅

---

## EPIC: Security & Quality Hardening
**JIRA:** [PAR-184](https://wiseguys.atlassian.net/browse/PAR-184)

**Epic Summary:** Fix all 15 critical findings and 20+ high/warning findings from the 5-critic review (Product, Dev, DevOps, QA, Security) covering auth spoofing, IDOR, injection, tenant isolation gaps, cryptographic weakness, unbounded memory, missing test coverage, stale storage policies, and code duplication. Establishes a hardened, well-tested baseline before production tenant onboarding.

**Business Value:**
- Eliminate all known security attack vectors (IDOR, injection, session spoofing, CSV formula injection, weak crypto)
- Achieve >80% unit test coverage for lib files
- Ensure proper tenant isolation across all pages and API routes
- Remove hardcoded secrets from repository
- Establish CI/CD pipeline with automated quality gates
- Fix unbounded memory usage in listUsers API

**Timeline:** 1 sprint

---

## STORY 1: Auth Hardening & Code Cleanup
**JIRA:** [PAR-185](https://wiseguys.atlassian.net/browse/PAR-185)

**PRD:** US-1 (Secure API Authentication), US-7 (Code Deduplication), US-9 (Cryptographic Security)
**Priority:** P0
**Acceptance Criteria:**
- All server-side auth calls use `getUser()` instead of `getSession()`
- Auth helpers (`requireAuth`, `requireAdmin`, `requireSuperAdmin`) use `getUser()` internally, returning `User` type
- All callers updated for new `User`-based return type
- Only one `createAdminClient` function exists (in `src/lib/supabase/admin.ts`)
- All super-admin routes import from canonical `@/lib/supabase/admin`
- `ReturnType<typeof createAdminClient>` references updated to new import
- `Math.random()` replaced with `crypto.getRandomValues()` / `crypto.randomUUID()` in all security-sensitive code
- Middleware `getSession()` preserved (intentional per Supabase guidance)
- Client-side `getSession()` in game/page.tsx and redeem/page.tsx preserved (browser-side, acceptable)
- Existing E2E tests pass after migration

**Test Plan:** Unit tests for auth.ts, E2E regression
**Definition of Done:** All tests pass, PR merged, no `getSession()` in server-side code (except middleware), no `Math.random()` in security code

---

### TASK 1.1: Migrate getSession to getUser in auth helpers and API routes
**JIRA:** [PAR-186](https://wiseguys.atlassian.net/browse/PAR-186)

**Complexity:** Medium
**Depends On:** None
**Parallel Group:** A
**Files to Create/Modify:**
- `src/lib/auth.ts` — change internal implementation to use `supabase.auth.getUser()`, return `User` type
- `src/app/api/admin/analytics/route.ts` — replace direct `getSession()` call (line 8)
- `src/app/api/admin/export/users/route.ts` — replace direct `getSession()` call (line 8)
- `src/app/api/admin/animals/[id]/media/route.ts` — replace `getSession()` in POST (line 23) and DELETE (line 113)
- `src/app/api/puzzle/validate/route.ts` — replace `getSession()` (line 18) with `supabase.auth.getUser()`
- `src/app/scan/[token]/page.tsx` — replace `getSession()` (line 29) with `getUser()`

**Implementation Steps:**
1. Update `src/lib/auth.ts`:
   - Rename `getSession()` to `getAuthUser()` to signal the API change
   - Change internal implementation: call `supabase.auth.getUser()` instead of `supabase.auth.getSession()`
   - Return `User | null` type (from `@supabase/supabase-js`)
   - Update `requireAuth()` to use `getAuthUser()`, return `User` (not `Session`)
   - Update `requireAdmin()` to use `getAuthUser()`, get `user.id` for profile/membership lookups. Update its return type from `{ session, profile, role }` to `{ user, profile, role }`. Update ALL callers that access `.session.user.id` to use `.user.id` instead.
   - Update `requireSuperAdmin()` to use `getAuthUser()` the same way
   - Note: `getProfile()` already accepts `userId: string` parameter — no change needed
2. Update each API route that directly calls `supabase.auth.getSession()`:
   - **IMPORTANT**: API routes must NOT use `requireAuth()` because it calls `redirect()` instead of returning JSON 401. API routes need `supabase.auth.getUser()` directly with JSON error responses.
   - `admin/analytics/route.ts:8` — replace with `supabase.auth.getUser()`, destructure `user`, return JSON 401 if `!user`
   - `admin/export/users/route.ts:8` — same pattern
   - `admin/animals/[id]/media/route.ts:23,113` — both POST and DELETE handlers, same pattern
   - `puzzle/validate/route.ts:18` — replace with `supabase.auth.getUser()`, destructure `user`, return JSON 401 if `!user`. Update `session.user.id` references to `user.id`.
3. Update `src/app/scan/[token]/page.tsx:29` — replace `getSession()` with `getAuthUser()` from auth.ts (page component, not API route, so redirect-based auth is fine). Update `session.user.id` references to `user.id`.
4. Note: Do NOT change `src/middleware.ts:64` — middleware `getSession()` is intentional per Supabase guidance
5. Note: Do NOT change client-side calls in `game/page.tsx` (line 1: `'use client'`) and `redeem/page.tsx` (line 1: `'use client'`) — browser-side `getSession()` is appropriate
6. Run `npm test` and `npx playwright test` to verify nothing breaks

**Acceptance Criteria:**
 - `src/lib/auth.ts` internally calls `supabase.auth.getUser()` and no longer calls `supabase.auth.getSession()`
 - `getAuthUser()` returns `User | null` type
 - `requireAuth()` returns `User` type
 - No API route file under `src/app/api/` calls `supabase.auth.getSession()` directly
 - `src/app/scan/[token]/page.tsx` uses `getAuthUser()` not `getSession()`
 - `src/middleware.ts` still uses `getSession()` (unchanged — intentional)
 - All 28 E2E tests pass

**Required Tests:** E2E regression (existing suite)

---

### TASK 1.2: Consolidate createAdminClient and update imports
**JIRA:** [PAR-187](https://wiseguys.atlassian.net/browse/PAR-187)

**Complexity:** Simple
**Depends On:** None
**Parallel Group:** A
**Security Note:** The duplicate `createAdminClient` in `server.ts` creates a service-role client WITHOUT `autoRefreshToken: false` and `persistSession: false` (unlike the canonical `admin.ts` version). All 5 super-admin routes currently use this insecure version. This task is a security fix, not just deduplication — the canonical version in `admin.ts` has proper auth options that prevent session persistence for service-role clients.
**Files to Create/Modify:**
- `src/lib/supabase/server.ts` — remove duplicate `createAdminClient` (line 34-39), remove unused `createSupabaseClient` import (line 2)
- `src/app/api/super-admin/analytics/route.ts` — change import to `@/lib/supabase/admin` (line 2)
- `src/app/api/super-admin/members/route.ts` — change import to `@/lib/supabase/admin` (line 2)
- `src/app/api/super-admin/members/[userId]/route.ts` — change import to `@/lib/supabase/admin` (line 2)
- `src/app/api/super-admin/tenants/route.ts` — change import to `@/lib/supabase/admin` (line 2)
- `src/app/api/super-admin/tenants/[id]/route.ts` — change import to `@/lib/supabase/admin` (line 2)

**Implementation Steps:**
1. Remove `createAdminClient` function (lines 34-39) and `createSupabaseClient` import (line 2) from `src/lib/supabase/server.ts`
2. Update all 5 super-admin route files:
   - Change `import { createClient, createAdminClient } from '@/lib/supabase/server'` to separate imports:
     - `import { createClient } from '@/lib/supabase/server'`
     - `import { createAdminClient } from '@/lib/supabase/admin'`
3. Search for any `ReturnType<typeof createAdminClient>` references and update their import source
4. Run `npm run build` to verify no import errors
5. Run `npm test` to verify tests pass

**Acceptance Criteria:**
 - `src/lib/supabase/server.ts` exports only `createClient` (no `createAdminClient`, no `createSupabaseClient` import)
 - All files that use `createAdminClient` import from `@/lib/supabase/admin`
 - No `ReturnType<typeof createAdminClient>` references point to `server.ts`
 - Build succeeds with no import errors

**Required Tests:** Build verification

---

### TASK 1.3: Replace Math.random with crypto-secure alternatives
**JIRA:** [PAR-188](https://wiseguys.atlassian.net/browse/PAR-188)

**Complexity:** Simple
**Depends On:** None
**Parallel Group:** A
**Files to Create/Modify:**
- `src/app/api/puzzle/validate/route.ts` — replace `Math.random()` (line 11) with `crypto.getRandomValues()`
- `src/app/api/super-admin/members/route.ts` — replace `Math.random().toString(36)` (line 128) with `crypto.randomUUID()`

**Implementation Steps:**
1. In `src/app/api/puzzle/validate/route.ts`:
   - Replace the `generateRedemptionCode()` function (lines 8-13):
     ```typescript
     function generateRedemptionCode(length = 8): string {
       const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
       const randomBytes = crypto.getRandomValues(new Uint8Array(length));
       return Array.from(randomBytes, (byte) => chars[byte % chars.length]).join('');
     }
     ```
   - Note: `crypto` is available globally in Node.js 19+ and Edge runtime
2. In `src/app/api/super-admin/members/route.ts`:
   - Replace line 128: `const tempPassword = \`Temp${Math.random().toString(36).slice(2, 10)}!${Date.now()}\``
   - With: `const tempPassword = \`Temp${crypto.randomUUID().slice(0, 8)}!${Date.now()}\``
3. Run `npm test` and `npm run build`

**Acceptance Criteria:**
 - No `Math.random()` calls exist in `puzzle/validate/route.ts`
 - No `Math.random()` calls exist in `super-admin/members/route.ts`
 - Redemption codes use `crypto.getRandomValues()`
 - Temporary passwords use `crypto.randomUUID()`
 - Both routes still function correctly

**Required Tests:** Build verification, E2E regression

---

## STORY 2: Tenant Isolation & Injection Prevention
**JIRA:** [PAR-189](https://wiseguys.atlassian.net/browse/PAR-189)

**PRD:** US-2 (Tenant-Scoped Admin Pages), US-3 (Input Sanitization & Injection Prevention), US-5 (QR Scan & Animal Page Tenant Isolation)
**Priority:** P0
**Acceptance Criteria:**
 - Admin user detail page validates user belongs to admin's tenant with `requireAdmin(tenantId)`
 - Admin animal edit page scopes load and update queries by `tenant_id` using `useTenant()` hook
 - Admin users search page sanitizes search input before `.or()` filter
 - Admin export users API sanitizes search input before `.or()` filter
 - CSV export escapes fields per RFC 4180 with formula prefix protection
 - Admin branding API validates branding against strict schema
 - Scan page requires tenant context, no fallback to `animal.tenant_id`
 - Animal page enforces tenant context, no fallback

**Test Plan:** Unit tests for sanitizer + CSV escaper, E2E regression
**Definition of Done:** All tests pass, PR merged, no unsanitized user input in `.or()` calls, no tenant fallback patterns

---

### TASK 2.1: Fix IDOR on admin user detail and animal edit pages
**JIRA:** [PAR-190](https://wiseguys.atlassian.net/browse/PAR-190)

**Complexity:** Medium
**Depends On:** None
**Parallel Group:** A
**Files to Create/Modify:**
- `src/app/(admin)/admin/users/[id]/page.tsx` — add tenant_id scoping to all 4 queries (lines 15-40)
- `src/app/(admin)/admin/animals/[id]/edit/page.tsx` — add tenant_id scoping to load (line 56) and update (line 77) queries

**Implementation Steps:**
1. Fix `admin/users/[id]/page.tsx`:
   - Import `resolveTenant` from `@/lib/tenant`
   - Call `const tenant = await resolveTenant()` at the top of the component
   - If `!tenant`, show "Tenant context required" error
   - Change `await requireAdmin()` to `await requireAdmin(tenant.id)` to validate admin membership for specific tenant
   - Line 15-19: Add `.eq('tenant_id', tenant.id)` to the profiles query
     - Note: `profiles.id` is the primary key, but we still need tenant scoping to prevent cross-tenant access
   - Line 25-29: Add `.eq('tenant_id', tenant.id)` to the `user_progress` query
   - Line 31-34: Add `.eq('tenant_id', tenant.id)` to the animals count query
   - Line 36-40: Add `.eq('tenant_id', tenant.id)` to the redemptions query
   - If user not found after tenant scoping, show "User not found" (404 equivalent)
2. Fix `admin/animals/[id]/edit/page.tsx`:
   - This is a `'use client'` component — MUST use client-side hooks
   - Import `useTenant()` hook from `@/components/TenantProvider`
   - In `loadAnimal()` (line 56): add `.eq('tenant_id', tenant.id)` to the query
   - In `handleSubmit()` (line 77): add `.eq('tenant_id', tenant.id)` to the update query
   - If animal not found (wrong tenant), redirect to `/admin/animals`
3. Run E2E tests to verify admin flows still work

**Acceptance Criteria:**
 - Admin user detail page filters by `tenant_id` in all 4 queries (profiles, user_progress, animals, redemptions)
 - Admin animal edit page filters by `tenant_id` on load and update
 - `requireAdmin()` called with specific `tenant.id`
 - Cross-tenant access returns "not found" message (not the actual data)
 - Existing admin E2E tests pass

**Required Tests:** E2E regression

---

### TASK 2.2: Sanitize search input, CSV export, and branding validation
**JIRA:** [PAR-191](https://wiseguys.atlassian.net/browse/PAR-191)

**Complexity:** Medium
**Depends On:** None
**Parallel Group:** A
**Files to Create/Modify:**
- `src/lib/sanitize.ts` — NEW: PostgREST search sanitizer + CSV escaper + branding schema validator
- `src/lib/sanitize.test.ts` — NEW: comprehensive unit tests
- `src/app/(admin)/admin/users/page.tsx` — use sanitizer on search input (line 36)
- `src/app/api/admin/export/users/route.ts` — use sanitizer on search (line 53) + CSV escape (lines 59-69)
- `src/app/api/admin/branding/route.ts` — add strict branding schema validation (line 57-62)

**Implementation Steps:**
1. Create `src/lib/sanitize.ts` with three functions:
   a. `sanitizeSearchInput(input: string): string`:
      - Strip characters that manipulate PostgREST filters: parentheses `()`, commas `,`, dots `.` (when adjacent to operators), backslashes `\`
      - Trim whitespace
      - Return sanitized string safe for `.or()` interpolation
   b. `escapeCSVField(field: string): string`:
      - Per RFC 4180: wrap in double quotes if contains comma, quote, newline
      - Escape internal double quotes by doubling them (`"` → `""`)
      - Formula prefix protection: if field starts with `=`, `+`, `-`, `@`, `\t`, `\r`, prefix with single quote `'`
   c. `validateBranding(branding: unknown): { valid: boolean; errors: string[] }`:
      - Validate required fields: `primary`, `accent`, `background`, `text`, `error`, `success`
      - Each color field must match hex pattern `#[0-9a-fA-F]{3,8}`
      - Optional URL fields (`logo_url`, `bg_image_url`) must be valid URLs or empty
      - Reject unknown fields
      - Return validation result with specific error messages
2. Create `src/lib/sanitize.test.ts` with comprehensive tests:
   - **sanitizeSearchInput:** normal terms pass through, parentheses stripped, commas stripped, PostgREST operators stripped, SQL injection attempts handled
   - **escapeCSVField:** plain text unchanged, fields with commas wrapped in quotes, fields with quotes escaped, formula prefixes neutralized (`=SUM(...)` → `'=SUM(...)`), newlines handled
   - **validateBranding:** valid branding passes, missing required fields fail, invalid hex colors fail, XSS in color fields rejected, unknown fields rejected
3. Update `admin/users/page.tsx:36`: wrap search in `sanitizeSearchInput()` before `.or()`
4. Update `admin/export/users/route.ts:53`: wrap search in `sanitizeSearchInput()` before `.or()`
5. Update `admin/export/users/route.ts:59-69`: wrap each CSV field in `escapeCSVField()` (note: BOM already exists at line 71 — no need to add again)
6. Update `admin/branding/route.ts:57-62`: validate branding with `validateBranding()` before writing to database, return 400 with specific errors if invalid
7. Run `npm test`

**Acceptance Criteria:**
 - `sanitizeSearchInput()` strips PostgREST-dangerous characters
 - `escapeCSVField()` handles RFC 4180 escaping + formula prefix protection
 - `validateBranding()` validates against strict schema with hex color format
 - Search input sanitized in both admin users page and export API
 - CSV export uses proper escaping for all fields
 - Branding API returns 400 with errors for invalid input
 - Unit tests cover all edge cases (injection attempts, formula prefixes, invalid colors)
 - All tests pass

**Required Tests:** Unit tests for sanitize.ts

---

### TASK 2.3: Fix scan page and animal page tenant isolation
**JIRA:** [PAR-192](https://wiseguys.atlassian.net/browse/PAR-192)

**Complexity:** Simple
**Depends On:** TASK 3.2 (resolveTenant behavior change must land first)
**Parallel Group:** A2
**Files to Create/Modify:**
- `src/app/scan/[token]/page.tsx` — enforce tenant match, remove fallback (lines 36-42, 69)
- `src/app/(visitor)/animal/[id]/page.tsx` — enforce tenant match, remove fallback (lines 27-34, 40)

**Implementation Steps:**
1. Fix `src/app/scan/[token]/page.tsx`:
   - After `const tenant = await resolveTenant()` (line 28), if `!tenant`, show error: "אנא גש דרך כתובת הפארק" (Please access via park URL)
   - Lines 36-42: Remove the conditional `if (tenant)` — ALWAYS scope by `tenant_id`:
     ```typescript
     const { data: animal } = await supabase
       .from('animals').select('*').eq('qr_token', token).eq('tenant_id', tenant.id).single();
     ```
   - Line 69: Replace `const tenantId = tenant?.id ?? animal.tenant_id;` with `const tenantId = tenant.id;`
   - If animal not found (wrong tenant), show "תחנה לא נמצאה בפארק זה" (Station not found in this park)
2. Fix `src/app/(visitor)/animal/[id]/page.tsx`:
   - After resolving tenant, if `!tenant`, show error page
   - Lines 27-34: Remove the conditional `if (tenant)` — ALWAYS scope by `tenant_id`:
     ```typescript
     const { data: animal } = await supabase
       .from('animals').select('*').eq('id', id).eq('tenant_id', tenant.id).single();
     ```
   - Line 40: Replace `const tenantId = tenant?.id ?? animal.tenant_id;` with `const tenantId = tenant.id;`
3. Run E2E tests

**Acceptance Criteria:**
 - Scan page requires tenant context — shows Hebrew error if missing
 - Scan page always scopes animal query by `tenant_id`
 - Animal page requires tenant context — shows Hebrew error if missing
 - Animal page always scopes animal query by `tenant_id`
 - No `tenant?.id ?? animal.tenant_id` pattern exists in either file
 - E2E tests pass

**Required Tests:** E2E regression

---

## STORY 3: Suspended Tenant & Test Credentials
**JIRA:** [PAR-193](https://wiseguys.atlassian.net/browse/PAR-193)

**PRD:** US-4 (Suspended Tenant Handling), US-6 (Test Credentials Security)
**Priority:** P0 (credentials), P1 (suspended)
**Acceptance Criteria:**
 - E2E test reads admin credentials from `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` env vars
 - `.env.example` documents all required E2E environment variables
 - No hardcoded passwords remain in any test file
 - Admin E2E tests skip gracefully with clear message if env vars not set
 - `resolveTenant()` distinguishes between "not found" and "suspended" tenants
 - Suspended tenant shows `/tenant-suspended` page updated with park name
 - `getTenant()` no longer filters by `is_active=true`

**Test Plan:** E2E regression, unit tests for tenant.ts
**Definition of Done:** All tests pass, PR merged, no hardcoded credentials

---

### TASK 3.1: Remove hardcoded credentials from E2E tests
**JIRA:** [PAR-194](https://wiseguys.atlassian.net/browse/PAR-194)

**Complexity:** Simple
**Depends On:** None
**Parallel Group:** A
**Files to Create/Modify:**
- `e2e/full-flow.spec.ts` — remove hardcoded fallback credentials (lines 280-281)
- `.env.example` — document required E2E environment variables

**Implementation Steps:**
1. In `e2e/full-flow.spec.ts`:
   - Line 280: Change `const adminEmail = process.env.ADMIN_EMAIL || 'ydarom@gmail.com'` to `const adminEmail = process.env.E2E_ADMIN_EMAIL`
   - Line 281: Change `const adminPassword = process.env.ADMIN_PASSWORD || 'Kokol000!'` to `const adminPassword = process.env.E2E_ADMIN_PASSWORD`
   - Add a guard before admin test block: `test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, 'Admin E2E credentials not configured — set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD')`
2. **MANDATORY:** Fix `e2e/helpers.ts` line 103 — hardcoded visitor password `Test1234pass` is confirmed present. Replace with `E2E_VISITOR_PASSWORD` env var:
   - Change `const password = 'Test1234pass'` to `const password = process.env.E2E_VISITOR_PASSWORD`
   - Add skip guard if env var not set
   - Search all remaining files under `e2e/` for any other hardcoded passwords
3. Create or update `.env.example` to document:
   ```
   # E2E test credentials
   E2E_ADMIN_EMAIL=your-admin@example.com
   E2E_ADMIN_PASSWORD=your-admin-password
   E2E_VISITOR_PASSWORD=your-visitor-password
   ```
4. **BLOCKING — Credential Rotation:** The hardcoded credentials (`ydarom@gmail.com` / `Kokol000!` and `Test1234pass`) are already in git history. This is a **pre-merge requirement**:
   - **Before merging the PR:** rotate all exposed passwords in Supabase Auth dashboard
   - Update the E2E env vars (`.env.local`) with the new passwords
   - Document in the PR description that these credentials were compromised via git history and have been rotated
   - If the repo is or will become public/shared, run `git filter-repo` or BFG Repo-Cleaner to scrub history
5. **Verify credential rotation:** After rotating passwords:
   - Run E2E tests with the NEW credentials in env vars — tests must pass
   - Attempt login with OLD credentials (manually or via a quick curl/script) — must fail with 401/invalid
   - Document the rotation verification result in the PR description
6. Run full E2E test suite to confirm everything works end-to-end

**Acceptance Criteria:**
 - No hardcoded email or password in any file under `e2e/`
 - `.env.example` documents all required E2E env vars (appended to existing, not replacing)
 - E2E tests skip gracefully with descriptive message if credentials not configured
 - E2E tests pass when credentials are set
-**BLOCKING:** Exposed passwords rotated in Supabase Auth before PR merge

**Required Tests:** E2E regression

---

### TASK 3.2: Add suspended tenant handling with park name
**JIRA:** [PAR-195](https://wiseguys.atlassian.net/browse/PAR-195)

**Complexity:** Medium
**Depends On:** None
**Parallel Group:** A
**Priority Note:** Although US-4 is P1, this task is elevated to P0 execution priority because TASK 2.3 (P0 scan/animal isolation) depends on it.
**Files to Create/Modify:**
- `src/lib/tenant.ts` — modify `getTenant()` to not filter by `is_active`, add suspended detection in `resolveTenant()`
- `src/app/tenant-suspended/page.tsx` — MODIFY existing page to show park name (this file already exists)
- `supabase/migrations/20260220100005_allow_suspended_tenant_read.sql` — NEW: update `tenants_select_active` RLS policy to allow reading suspended tenants

**Implementation Steps:**
1. **CRITICAL: Update RLS policy first** — Create migration `20260220100005_allow_suspended_tenant_read.sql`:
   - The current `tenants_select_active` RLS policy (from migration `20260220100002`) uses `USING (is_active = true)`, which blocks reading suspended tenants at the database level
   - Drop and recreate the policy to allow reading all tenants (the application layer will handle the active/suspended distinction):
     ```sql
     BEGIN;
     DROP POLICY IF EXISTS "tenants_select_active" ON public.tenants;
     -- Active tenants: readable by everyone (needed for unauthenticated page loads)
     -- Suspended tenants: readable only by authenticated users (prevents anonymous enumeration)
     CREATE POLICY "tenants_select_active_or_authed" ON public.tenants
       FOR SELECT USING (is_active = true OR auth.uid() IS NOT NULL);
     COMMIT;
     ```
   - Note: Write policies still restrict tenant modification to super-admins only
   - Security rationale: Active tenants must be publicly readable (middleware resolves tenant by slug for every request including unauthenticated page loads). Suspended tenants are restricted to authenticated users only — this prevents anonymous enumeration of suspended parks while still allowing authenticated visitors to see the suspended page with park name.
   - **Rollback SQL** (include as comment at top of migration file):
     ```sql
     -- ROLLBACK: DROP POLICY IF EXISTS "tenants_select_active_or_authed" ON public.tenants;
     -- ROLLBACK: CREATE POLICY "tenants_select_active" ON public.tenants FOR SELECT USING (is_active = true);
     ```
2. Update `src/lib/tenant.ts`:
   - Modify `getTenant()` (lines 20-29): Remove `.eq('is_active', true)` from the query — fetch tenant regardless of status
   - Update `resolveTenant()` to check tenant status after fetching:
     - **IMPORTANT:** Only redirect when a slug IS present but resolves to no/suspended tenant. When no slug exists (bare domain), return `null` as before — `layout.tsx` callers rely on null returns for bare-domain access (`tenant?.branding` null-safety pattern).
     - If no slug (bare domain) → return `null` (unchanged behavior)
     - If slug present but `!tenant` (slug not found) → `redirect('/tenant-not-found')`
     - If `tenant && !tenant.is_active` → `redirect('/tenant-suspended?name=' + encodeURIComponent(tenant.name))`
     - If `tenant && tenant.is_active` → return tenant as before
2. MODIFY `src/app/tenant-suspended/page.tsx` (already exists — DO NOT create new):
   - Read the `name` query parameter from searchParams
   - Display: "הפארק {name} אינו זמין כרגע" (The park {name} is currently unavailable)
   - Keep existing styling, update the heading and message
   - Show a generic message if no name provided (fallback for direct URL access)
3. Verify `src/app/tenant-not-found/page.tsx` still works correctly (no changes needed)
4. Run E2E tests

**Acceptance Criteria:**
 - `tenants_select_active` RLS policy updated to allow reading suspended tenants
 - `getTenant()` fetches tenant without `is_active` filter
 - `resolveTenant()` distinguishes "not found" from "suspended"
 - Suspended tenant redirects to `/tenant-suspended` with park name as query param
 - Suspended page displays park name in Hebrew message
 - Non-existent tenants still redirect to `/tenant-not-found`
 - Active tenants work as before (no behavior change)

**Required Tests:** Unit tests for tenant.ts logic, migration verification

---

## STORY 4: API Optimization & Storage RLS
**JIRA:** [PAR-196](https://wiseguys.atlassian.net/browse/PAR-196)

**PRD:** US-10 (Storage RLS & Rate Limiting), US-11 (listUsers Optimization)
**Priority:** P0 (listUsers), P1 (storage/rate)
**Acceptance Criteria:**
 - `super-admin/members/route.ts` POST handler uses targeted user lookup instead of `listUsers()`
 - Storage RLS policies use `tenant_memberships` lookup for write access
 - Rate limiter file has clear serverless limitation documentation
 - New migration updates stale storage policies

**Test Plan:** Unit tests, migration verification
**Definition of Done:** All tests pass, PR merged, no unbounded user fetch

---

### TASK 4.1: Fix listUsers unbounded memory usage
**JIRA:** [PAR-197](https://wiseguys.atlassian.net/browse/PAR-197)

**Complexity:** Simple
**Depends On:** None
**Parallel Group:** A
**Files to Create/Modify:**
- `src/app/api/super-admin/members/route.ts` — replace `listUsers()` (line 117) with targeted lookup

**Implementation Steps:**
1. In `src/app/api/super-admin/members/route.ts` POST handler:
   - Lines 117-120: Remove `listUsers()` + `.find()` pattern that loads ALL auth users into memory
   - The current code fetches all users to check if one exists by email. Replace with a try-create approach:
     ```typescript
     // Try to create user first — if they already exist, createUser returns an error
     const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
       email,
       password: tempPassword,
       email_confirm: true,
     });

     let userId: string;
     if (createError?.message?.includes('already been registered')) {
       // User exists — look up by email via profiles table (avoids unbounded listUsers)
       const { data: existingProfile } = await adminClient
         .from('profiles').select('user_id').eq('email', email).single();
       if (!existingProfile) {
         return NextResponse.json({ error: 'User not found' }, { status: 404 });
       }
       userId = existingProfile.user_id;
     } else if (createError || !newUser?.user) {
       return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 });
     } else {
       userId = newUser.user.id;
     }
     ```
   - This eliminates the unbounded `listUsers()` call entirely
   - Handle the case where the user does not exist in auth AND profiles (return 404)
2. Run `npm run build` and `npm test`

**Acceptance Criteria:**
 - No `listUsers()` call without filtering exists in the codebase
 - Member creation uses targeted user lookup by email
 - Handles case where user does not exist in auth
 - Route still functions correctly for creating/inviting members

**Required Tests:** Build verification

---

### TASK 4.2: Update storage RLS policies and document rate limiter
**JIRA:** [PAR-198](https://wiseguys.atlassian.net/browse/PAR-198)

**Complexity:** Simple
**Depends On:** None
**Parallel Group:** A
**Files to Create/Modify:**
- `supabase/migrations/20260220100004_fix_storage_rls.sql` — NEW: update storage policies for multi-tenant
- `src/lib/rate-limit.ts` — add serverless limitation TODO comment

**Implementation Steps:**
1. Create migration `20260220100004_fix_storage_rls.sql`:
   - Wrap entire migration in `BEGIN; ... COMMIT;` for atomicity
   - Use `DROP POLICY IF EXISTS` for all existing policies (prevents failure if names changed):
     - `DROP POLICY IF EXISTS "Admin write access for animal images" ON storage.objects;`
     - `DROP POLICY IF EXISTS "Admin delete access for animal images" ON storage.objects;`
     - `DROP POLICY IF EXISTS "Admin write access for animal videos" ON storage.objects;`
     - `DROP POLICY IF EXISTS "Admin delete access for animal videos" ON storage.objects;`
   - Note: DELETE policies already exist (lines 15-19, 30-34 of original migration) — only UPDATE is missing
   - **DO NOT touch public read (SELECT) policies** — they are per-bucket and remain unchanged
   - Create new write policies for BOTH buckets using `tenant_memberships`. Full SQL for each bucket:
     ```sql
     -- animal-images bucket: INSERT, UPDATE, DELETE
     CREATE POLICY "Tenant admin insert animal-images" ON storage.objects
       FOR INSERT WITH CHECK (
         bucket_id = 'animal-images' AND
         EXISTS (
           SELECT 1 FROM public.tenant_memberships
           WHERE user_id = auth.uid()
           AND role IN ('admin', 'staff')
         )
       );
     CREATE POLICY "Tenant admin update animal-images" ON storage.objects
       FOR UPDATE USING (
         bucket_id = 'animal-images' AND
         EXISTS (
           SELECT 1 FROM public.tenant_memberships
           WHERE user_id = auth.uid()
           AND role IN ('admin', 'staff')
         )
       );
     CREATE POLICY "Tenant admin delete animal-images" ON storage.objects
       FOR DELETE USING (
         bucket_id = 'animal-images' AND
         EXISTS (
           SELECT 1 FROM public.tenant_memberships
           WHERE user_id = auth.uid()
           AND role IN ('admin', 'staff')
         )
       );
     -- Repeat same pattern for animal-videos bucket
     ```
   - Note: DELETE policies already exist in original migration but are being replaced with `tenant_memberships`-based versions
   - Add path-based tenant scoping where feasible (e.g., paths like `{tenant_id}/filename`)
   - **Rollback SQL** (include as comment at top of migration file):
     ```sql
     -- ROLLBACK: Drop new policies and re-create originals from 20260217100002_storage_buckets.sql
     ```
2. Update `src/lib/rate-limit.ts`:
   - Add a documentation block at the top:
     ```typescript
     /**
      * WARNING: Serverless Limitation
      * This in-memory rate limiter does NOT work on Vercel serverless/Edge runtime.
      * Each Lambda invocation has isolated memory — the Map resets on every cold start.
      * For production use, migrate to Upstash Redis (@upstash/ratelimit).
      * TODO: Replace with Upstash Redis rate limiter before production launch.
      */
     ```
3. Run `npm run build`

**Acceptance Criteria:**
 - Storage write policies check `tenant_memberships` instead of `profiles.role`
 - Storage policies include UPDATE and DELETE for file management
 - Rate limiter file has clear serverless limitation and Upstash Redis TODO
 - Migration file is syntactically valid SQL
 - Build succeeds

**Required Tests:** Build verification

---

## STORY 5: Comprehensive Testing & CI/CD
**JIRA:** [PAR-199](https://wiseguys.atlassian.net/browse/PAR-199)

**PRD:** US-8 (Comprehensive Test Coverage), US-12 (CI/CD Pipeline), US-13 (Cross-Tenant E2E)
**Priority:** P1 (tests, CI/CD), P2 (cross-tenant E2E)
**Acceptance Criteria:**
 - Unit tests for all lib files (auth.ts, tenant.ts, site-content.ts, rate-limit.ts, sanitize.ts, supabase/server.ts, supabase/client.ts, supabase/admin.ts, tenant-queries.ts, tenant-slug.ts)
 - Unit tests for critical API routes (puzzle/validate, admin/analytics, admin/export/users, admin/animals/[id]/media)
 - Unit tests for scan page server logic
 - All unit tests pass with `npm test`
 - Test coverage for lib files exceeds 80%
 - Flaky E2E patterns fixed (no `waitForTimeout(3000)`, no triple-OR assertions)
 - E2E tests added for forgot-password and admin CRUD flows
 - GitHub Actions workflow runs lint, test, build on PRs
 - Cross-tenant E2E test exercises actual RLS policies

**Test Plan:** The deliverable IS the tests
**Definition of Done:** All tests pass, coverage >80% for lib/, CI/CD workflow created

---

### TASK 5.1: Unit tests for lib files
**JIRA:** [PAR-200](https://wiseguys.atlassian.net/browse/PAR-200)

**Complexity:** Complex
**Depends On:** TASK 1.1, TASK 1.2, TASK 2.2, TASK 3.2
**Parallel Group:** B
**Files to Create/Modify:**
- `src/lib/auth.test.ts` — NEW: tests for getAuthUser, requireAuth, getProfile, requireAdmin, requireSuperAdmin
- `src/lib/tenant.test.ts` — NEW: tests for getTenant, resolveTenant, suspended handling
- `src/lib/site-content.test.ts` — NEW: tests for getSiteContent, getAllSiteContent
- `src/lib/rate-limit.test.ts` — NEW: tests for rateLimit function
- `src/lib/supabase/server.test.ts` — NEW: tests for createClient
- `src/lib/supabase/client.test.ts` — NEW: tests for browser createClient
- `src/lib/supabase/admin.test.ts` — NEW: tests for createAdminClient
- `src/lib/supabase/tenant-queries.test.ts` — NEW: tests for tenant query helpers (co-located with source)

**Implementation Steps:**
1. Create `src/lib/auth.test.ts`:
   - Mock `@/lib/supabase/server` `createClient()`
   - Mock `next/navigation` `redirect()`
   - Test `getAuthUser()` returns user when authenticated (after TASK 1.1 migration)
   - Test `getAuthUser()` returns null when not authenticated
   - Test `requireAuth()` redirects when not authenticated
   - Test `requireAuth()` returns user when authenticated
   - Test `requireAdmin()` returns `{ user, role: 'admin' }` for valid tenant admin
   - Test `requireAdmin()` allows super admin access to any tenant
   - Test `requireAdmin()` redirects for non-admin
   - Test `requireSuperAdmin()` returns user for super admin
   - Test `requireSuperAdmin()` redirects for non-super-admin
   - Test `getProfile()` returns profile data for valid user
2. Create `src/lib/tenant.test.ts`:
   - Mock `next/headers` `headers()`
   - Mock `@/lib/supabase/server` `createClient()`
   - Mock `next/navigation` `redirect()`
   - Test `getTenant()` returns tenant for valid slug
   - Test `getTenant()` returns null for non-existent slug
   - Test `getTenant()` returns suspended tenant (no `is_active` filter after TASK 3.2)
   - Test `resolveTenant()` returns tenant for valid active tenant
   - Test `resolveTenant()` redirects to `/tenant-suspended?name=...` for suspended tenant (after TASK 3.2)
   - Test `resolveTenant()` suspended redirect correctly URL-encodes Hebrew park name (e.g., `פארק המעיינות` → `%D7%A4%D7%90%D7%A8%D7%A7...`)
   - Test `resolveTenant()` suspended redirect handles park names with spaces and special characters
   - Test `resolveTenant()` redirects to `/tenant-not-found` for non-existent slug (slug present but no matching tenant)
   - Test `resolveTenant()` returns null when no slug (bare domain — preserves existing behavior)
3. Create `src/lib/site-content.test.ts`:
   - Mock Supabase client
   - Test returns DB value when available
   - Test returns default when DB has no entry
   - Test handles tenant-scoped content
4. Create `src/lib/rate-limit.test.ts`:
   - Test allows requests within limit
   - Test blocks requests over limit
   - Test resets after window expires (mock Date.now)
   - Test handles concurrent keys independently
5. Create `src/lib/supabase/server.test.ts`:
   - Test `createClient()` returns a Supabase client instance
   - Mock `next/headers` `cookies()`
6. Create `src/lib/supabase/client.test.ts`:
   - Test `createClient()` returns a browser Supabase client
   - Test uses correct Supabase URL and anon key from env
7. Create `src/lib/supabase/admin.test.ts`:
   - Test `createAdminClient()` creates client with correct auth options (`autoRefreshToken: false`, `persistSession: false`)
   - Mock environment variables
8. Create `src/lib/supabase/tenant-queries.test.ts`:
   - Test tenant query functions return expected results
   - Test proper tenant_id scoping in queries
   - Mock Supabase client
9. Note: `src/lib/tenant-slug.test.ts` already exists with 19 tests (11 for `extractTenantSlug`, 8 for `sanitizeHexColor`). Run `npm run test:coverage -- --include=src/lib/tenant-slug.ts` to check branch coverage. If any branches are uncovered (e.g., edge cases for custom domains, port stripping, or multi-dot hostnames), add targeted tests to reach 80% branch coverage.
10. Note: `src/lib/sanitize.test.ts` created in TASK 2.2 — add more tests if coverage < 80%
11. **Enforce coverage threshold** — update `vitest.config.ts` to add coverage configuration:
    ```typescript
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80 }
    }
    ```
    Add `"test:coverage": "vitest run --coverage"` script to `package.json`
12. Run `npm test` and `npm run test:coverage` to verify all pass and threshold met

**Acceptance Criteria:**
-8+ new test files created for lib modules (including client.ts and tenant-queries.ts)
 - Each lib function has at least 2 test cases (happy + unhappy path)
 - All tests pass with `npm test`
 - Mocks properly isolate from Supabase and Next.js
 - Coverage for lib files exceeds 80% (enforced via `vitest.config.ts` thresholds)
 - `npm run test:coverage` script added to `package.json`

**Required Tests:** Unit tests (this IS the deliverable)

---

### TASK 5.2: Unit + integration tests for API routes and pages
**JIRA:** [PAR-201](https://wiseguys.atlassian.net/browse/PAR-201)

**Complexity:** Complex
**Depends On:** TASK 1.1, TASK 1.3, TASK 2.2, TASK 4.1
**Parallel Group:** B
**Test Type Note:** Per `pipeline.config.yaml`, `src/app/api/**/*.ts` requires `[unit]`. Integration coverage is provided by the E2E suite (TASKs 5.3 and 5.5) which tests real HTTP flows through the full stack. These handler-level tests use real `NextRequest`/`NextResponse` objects with mocked Supabase for fast, deterministic unit testing.
**Files to Create/Modify:**
- `src/app/api/puzzle/validate/route.test.ts` — NEW: tests for puzzle validation endpoint
- `src/app/api/admin/analytics/route.test.ts` — NEW: tests for analytics endpoint
- `src/app/api/admin/export/users/route.test.ts` — NEW: tests for user export endpoint
- `src/app/api/admin/animals/[id]/media/route.test.ts` — NEW: tests for media upload endpoint
- `src/app/scan/[token]/page.test.ts` — NEW: tests for scan page server logic (AC 8.3)
- `src/app/api/admin/branding/route.test.ts` — NEW: tests for branding API route
- `src/app/api/super-admin/members/route.test.ts` — NEW: tests for members POST handler (US-11 listUsers fix)

**Implementation Steps:**
1. Create shared test utilities for API route testing:
   - Mock `NextRequest` and `NextResponse`
   - Mock Supabase client with chainable query builder
   - Mock `headers()` for tenant resolution
   - Mock auth helpers (`requireAuth`, `requireAdmin`)
2. Create `puzzle/validate/route.test.ts`:
   - Test: unauthenticated request returns 401
   - Test: missing tenant context returns 400
   - Test: missing answer in body returns 400
   - Test: wrong answer returns `{ correct: false }`
   - Test: correct answer creates redemption and returns code
   - Test: already completed returns existing redemption code
   - Test: generated redemption code uses crypto (not Math.random) — after TASK 1.3. Verify by: (a) mock `crypto.getRandomValues` and assert it is called during code generation, (b) verify output contains only chars from the expected charset `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`, (c) verify output length matches requested length
3. Create `admin/analytics/route.test.ts`:
   - Test: unauthenticated returns 401
   - Test: non-admin returns 403
   - Test: returns correct analytics shape (total_users, total_scans, completion_rate, etc.)
4. Create `admin/export/users/route.test.ts`:
   - Test: unauthenticated returns 401
   - Test: non-admin returns 403
   - Test: returns CSV with proper UTF-8 BOM and headers
   - Test: search parameter is sanitized before query — after TASK 2.2
   - Test: CSV fields with special characters are properly escaped — after TASK 2.2
   - Test: formula prefix injection neutralized in CSV output
5. Create `admin/animals/[id]/media/route.test.ts`:
   - Test: unauthenticated POST returns 401
   - Test: unauthenticated DELETE returns 401
   - Test: non-admin returns 403
   - Test: successful media upload returns URL
   - Test: successful media deletion
6. Create `scan/[token]/page.test.ts`:
   - Mock `resolveTenant()` and Supabase client
   - Test: no tenant context shows Hebrew error
   - Test: valid tenant + valid QR token scopes by tenant_id and returns animal
   - Test: valid tenant + QR token from other tenant returns "not found"
   - Test: authenticated user's progress is loaded
7. Create `admin/branding/route.test.ts`:
   - Test: unauthenticated returns 401
   - Test: non-admin returns 403
   - Test: valid branding object is saved
   - Test: invalid branding (bad hex, missing fields) returns 400 with errors — after TASK 2.2
   - Test: XSS payload in color field is rejected
8. Create `super-admin/members/route.test.ts`:
   - Test: unauthenticated returns 401
   - Test: non-super-admin returns 403
   - Test: POST with new email creates user via try-create approach (no `listUsers()`)
   - Test: POST with existing email looks up user via profiles table
   - Test: POST with non-existent user returns 404
9. Run `npm test`

**Acceptance Criteria:**
-7 test files created (5 API routes + scan page + branding API)
 - Auth/authz tested for each route (401, 403 cases)
 - Happy path tested for each route
 - Sanitization and CSV escaping verified in export tests
 - All tests pass

**Required Tests:** Unit tests (this IS the deliverable)

---

### TASK 5.3: Fix flaky E2E patterns and add new E2E flows
**JIRA:** [PAR-202](https://wiseguys.atlassian.net/browse/PAR-202)

**Complexity:** Medium
**Depends On:** TASK 2.1, TASK 2.2, TASK 3.1
**Parallel Group:** B
**Files to Create/Modify:**
- `e2e/full-flow.spec.ts` — fix flaky patterns, add forgot-password flow
- `e2e/admin-crud.spec.ts` — NEW: admin CRUD E2E tests

**Implementation Steps:**
1. Fix flaky patterns in `e2e/full-flow.spec.ts`:
   - **Registration test (line 76):** Replace `waitForTimeout(3000)` + triple-OR assertion (line 84) with a deterministic approach:
     - Use `Promise.race` with `page.waitForURL('**/game**')` and `page.waitForSelector('[data-testid="email-confirm"]')` to wait for whichever outcome occurs first
     - If redirected to `/game` → registration succeeded, continue test
     - If email confirmation required → test passes with a different assertion (confirm the message is displayed)
     - Remove the triple-OR pattern entirely — each possible outcome should be a separate, specific assertion
   - Replace any other `waitForTimeout()` calls > 1000ms with proper `waitForSelector()` or `waitForURL()` assertions
   - Use `test.describe.serial()` for dependent test sequences
2. Add forgot-password E2E flow:
   - Navigate to login page
   - Click "forgot password" link
   - Enter email
   - Verify confirmation message appears
3. Create `e2e/admin-crud.spec.ts`:
   - Login as admin (using E2E_ADMIN_EMAIL env var from TASK 3.1)
   - Navigate to admin dashboard
   - Test animal CRUD: list → create → edit → verify changes
   - Test user list: search, filter, export
   - **Test search sanitization:** enter PostgREST injection attempt (e.g., `test),full_name.eq.admin`) in search box, verify results are filtered safely (no injection, no error)
   - **Test cross-tenant admin 404 (AC 2.3):** attempt to navigate to `/admin/users/{other-tenant-user-id}`, verify "not found" message is displayed (not the user's data). This requires knowing a user ID from another tenant — use a known test ID or create via test setup.
   - Verify tenant scoping (admin only sees their tenant's data)
4. Run `npx playwright test`

**Acceptance Criteria:**
 - No `waitForTimeout()` calls with > 1000ms exist in E2E tests
 - No triple-OR assertions exist
 - Forgot-password E2E flow passes
 - Admin CRUD E2E tests pass (including search sanitization and cross-tenant 404)
 - All existing E2E tests still pass

**Required Tests:** E2E (this IS the deliverable)

---

### TASK 5.4: Create CI/CD GitHub Actions workflow
**JIRA:** [PAR-203](https://wiseguys.atlassian.net/browse/PAR-203)

**Complexity:** Simple
**Depends On:** None
**Parallel Group:** A
**Files to Create/Modify:**
- `.github/workflows/ci.yml` — NEW: CI workflow for PRs

**Implementation Steps:**
1. Create `.github/workflows/ci.yml`:
   ```yaml
   name: CI
   on:
     pull_request:
       branches: [main]
   jobs:
     quality:
       runs-on: ubuntu-latest
       env:
         # Required for next build — use dummy values for CI (no real DB access needed at build time)
         NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co' }}
         NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key' }}
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: npm
         - run: npm ci
         - run: npm run lint
         - run: npm test
         - run: npm run build
     e2e:
       runs-on: ubuntu-latest
       if: ${{ secrets.E2E_ADMIN_EMAIL != '' }}
       needs: quality
       env:
         NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
         NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
         E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
         E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
         E2E_VISITOR_PASSWORD: ${{ secrets.E2E_VISITOR_PASSWORD }}
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: npm
         - run: npm ci
         - run: npx playwright install --with-deps chromium
         - run: npx playwright test
   ```
2. Document required GitHub Secrets in a comment in the workflow file:
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (required for build + E2E)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (required for build + E2E)
   - `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_VISITOR_PASSWORD` — E2E test credentials (optional — E2E job skips if not set)
   - Note: Branch protection rules need to be enabled in GitHub Settings > Branches
   - Require status checks to pass (CI quality job)
3. Run `npm run lint`, `npm test`, `npm run build` locally to verify commands work

**Acceptance Criteria:**
 - `.github/workflows/ci.yml` exists and is valid YAML
 - Quality job runs lint, test, and build on PR to main with env vars configured
 - E2E job runs Playwright tests when credentials are available (conditional)
 - Required GitHub Secrets documented in workflow comments
 - Branch protection setup documented

**Required Tests:** Local command verification

---

### TASK 5.5: Cross-tenant E2E test exercising RLS
**JIRA:** [PAR-204](https://wiseguys.atlassian.net/browse/PAR-204)

**Complexity:** Medium
**Depends On:** TASK 2.1, TASK 2.3, TASK 4.2
**Parallel Group:** C
**Files to Create/Modify:**
- `e2e/cross-tenant-rls.spec.ts` — NEW: cross-tenant RLS validation E2E test

**Implementation Steps:**
1. Read existing `e2e/multi-tenant.spec.ts` to understand current cross-tenant test coverage
2. Create `e2e/cross-tenant-rls.spec.ts` with scenarios:
   - Set up two tenant contexts (using different subdomain slugs)
   - Test: User in Tenant A cannot read animals from Tenant B (gets empty results or 404)
   - Test: User in Tenant A cannot write user_progress for Tenant B (RLS blocks insert)
   - Test: Admin in Tenant A cannot view user detail from Tenant B (gets "not found")
   - Test: Scan with Tenant A context cannot access Tenant B animal by QR token
3. Use authenticated Supabase client (not admin client) to ensure RLS is exercised
4. Ensure tests use proper cleanup (don't leave test data behind)
5. Run `npx playwright test e2e/cross-tenant-rls.spec.ts`

**Acceptance Criteria:**
 - Cross-tenant E2E test exercises read/write across tenant boundaries
 - Test verifies RLS blocks cross-tenant data access
 - Test uses two different tenant contexts
 - All E2E tests pass (new and existing)

**Required Tests:** E2E (this IS the deliverable)

---

## Dependency Graph

```
Group A (parallel, first — no dependencies):
  TASK 1.1 (getSession→getUser)          Medium
  TASK 1.2 (consolidate createAdminClient) Simple
  TASK 1.3 (Math.random→crypto)           Simple
  TASK 2.1 (IDOR fixes)                   Medium
  TASK 2.2 (sanitize+CSV+branding)        Medium
  TASK 3.1 (hardcoded credentials)         Simple
  TASK 3.2 (suspended tenants + RLS fix)   Medium
  TASK 4.1 (fix listUsers)                Simple
  TASK 4.2 (storage RLS+rate limit docs)   Simple
  TASK 5.4 (CI/CD workflow)               Simple

Group A2 (after TASK 3.2 — depends on tenant resolution changes):
  TASK 2.3 (scan+animal isolation)         Simple  — depends on 3.2

Group B (after Group A — depends on security fixes):
  TASK 5.1 (lib unit tests)       Complex  — depends on 1.1, 1.2, 2.2, 3.2
  TASK 5.2 (API route unit tests) Complex  — depends on 1.1, 1.3, 2.2
  TASK 5.3 (flaky E2E + new E2E)  Medium   — depends on 2.1, 2.2, 3.1

Group C (after Groups A, A2, B):
  TASK 5.5 (cross-tenant E2E)     Medium   — depends on 2.1, 2.3, 4.2
```

## Summary

| Task | Story | Complexity | Parallel Group | Depends On | PRD Story |
|------|-------|-----------|----------------|------------|-----------|
| TASK 1.1 | Auth Hardening | Medium | A | — | US-1 |
| TASK 1.2 | Auth Hardening | Simple | A | — | US-7 |
| TASK 1.3 | Auth Hardening | Simple | A | — | US-9 |
| TASK 2.1 | Tenant Isolation | Medium | A | — | US-2 |
| TASK 2.2 | Tenant Isolation | Medium | A | — | US-3 |
| TASK 2.3 | Tenant Isolation | Simple | A2 | 3.2 | US-5 |
| TASK 3.1 | Credentials/Suspended | Simple | A | — | US-6 |
| TASK 3.2 | Credentials/Suspended | Medium | A | — | US-4 |
| TASK 4.1 | API/Storage | Simple | A | — | US-11 |
| TASK 4.2 | API/Storage | Simple | A | — | US-10 |
| TASK 5.1 | Testing/CI | Complex | B | 1.1, 1.2, 2.2, 3.2 | US-8 |
| TASK 5.2 | Testing/CI | Complex | B | 1.1, 1.3, 2.2, 4.1 | US-8, US-11 |
| TASK 5.3 | Testing/CI | Medium | B | 2.1, 2.2, 3.1 | US-2, US-3, US-8 |
| TASK 5.4 | Testing/CI | Simple | A | — | US-12 |
| TASK 5.5 | Testing/CI | Medium | C | 2.1, 2.3, 4.2 | US-13 |
