# Dev Plan: Park HaMaayanot Wildlife Quest

## PRD Reference: [docs/prd/park-hamaayanot-wildlife-quest.md](../prd/park-hamaayanot-wildlife-quest.md)
## JIRA Project: PAR
## Date: 2026-02-17

---

## Architecture Decision

**Stack**: Next.js 14 (App Router) + Supabase (Auth, PostgreSQL, Storage, Edge Functions)

**Rationale**: Supabase provides integrated auth, database, storage, and edge functions — reducing infrastructure complexity and development time. Next.js App Router enables SSR/SSG for fast loads, API routes for server-side logic, and native React Server Components.

**Key Architecture Patterns**:
- Next.js App Router with server components (default) and client components (interactive UI)
- Supabase client SDK for auth + realtime, Supabase admin SDK for server-side operations
- **Unified auth via Supabase Auth** for both visitors and admins (role stored in `profiles.role` column, checked server-side via custom claims or DB lookup). No separate admin auth system — reduces complexity and leverages Supabase's built-in session management, token refresh, and password reset.
- Row Level Security (RLS) on all tables for data isolation
- UUID primary keys throughout (no sequential IDs exposed)
- Tailwind CSS with custom nature theme tokens
- RTL-first layout via `dir="rtl"` and Tailwind RTL plugin

---

## Database Schema

```sql
-- Users (extends Supabase auth.users) — unified for visitors, staff, and admins
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'visitor' CHECK (role IN ('visitor', 'staff', 'admin')),
  completion_status TEXT DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Animal Checkpoints
CREATE TABLE public.animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_he TEXT NOT NULL,
  qr_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  letter CHAR(1) NOT NULL,
  order_index INTEGER NOT NULL UNIQUE CHECK (order_index >= 1 AND order_index <= 20),
  fun_facts TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Progress (scan records)
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  letter CHAR(1) NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, animal_id)
);

-- Prize Redemptions
CREATE TABLE public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  redemption_code TEXT NOT NULL UNIQUE,
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTE: Admin/staff users use the same Supabase Auth + profiles table with role = 'admin' or 'staff'.
-- Password reset handled by Supabase Auth built-in flow (supabase.auth.resetPasswordForEmail()).
-- No separate admin_users or password_reset_tokens tables needed.
```

---

## EPIC: Park HaMaayanot Wildlife Quest
**JIRA:** [PAR-16](https://wiseguys.atlassian.net/browse/PAR-16)

## STORY 1: Project Foundation & Database Setup
**JIRA:** [PAR-17](https://wiseguys.atlassian.net/browse/PAR-17)
**PRD**: US-1, US-10 (infrastructure)
**Priority**: P0

### TASK 1.1: Initialize Next.js Project with Nature Theme
**JIRA:** [PAR-18](https://wiseguys.atlassian.net/browse/PAR-18)
**Complexity**: Medium
**Depends On**: None
**Parallel Group**: A
**Covers**: Project scaffolding, design system

**Subtasks**:
1. Initialize Next.js 14 project with App Router, TypeScript, Tailwind CSS
2. Configure RTL support (`dir="rtl"`, Tailwind RTL plugin `tailwindcss-rtl`)
3. Set up nature theme in `tailwind.config.ts`:
   - Colors: deep-green (#2F5D50), turquoise (#4DB6AC), sand (#E8D8B9), sky-blue (#B3E5FC)
   - Typography: sans-serif, large headings, RTL-optimized
4. Create base layout component with Hebrew font (e.g., Rubik/Assistant from Google Fonts)
5. Create shared UI components: Button, Input, Card, ProgressBar, PageShell
6. Set up project directory structure:
   ```
   src/
     app/
       (visitor)/          # Visitor-facing routes
       (admin)/admin/      # Admin routes
       api/                # API routes
       scan/[token]/       # QR deep link handler
     components/           # Shared UI components
     lib/                  # Utilities, Supabase client, constants
     types/                # TypeScript types
   ```
7. Configure environment variables (.env.local template)

**AC Covered**: Foundation for all ACs (mobile-first, nature theme, RTL, Hebrew)
**Tests**: None (scaffolding)

---

### TASK 1.2: Set Up Supabase & Database Schema
**JIRA:** [PAR-19](https://wiseguys.atlassian.net/browse/PAR-19)
**Complexity**: Medium
**Depends On**: None
**Parallel Group**: A
**Covers**: Database, auth infrastructure

**Subtasks**:
1. Create Supabase project (or configure local dev with Supabase CLI)
2. Create all database tables per schema above (migration file)
3. Configure Row Level Security (RLS) policies:
   - `profiles`: Users can read/update own profile. Admins can read all.
   - `animals`: Anyone authenticated can read active animals. Admins can CRUD.
   - `user_progress`: Users can read own progress. Insert via API only. Admins read all.
   - `redemptions`: Users can read own. Admins can read/update all.
   - `admin_users`: No public access. Server-side only.
4. Set up Supabase Storage buckets:
   - `animal-images` (public read, admin write)
   - `animal-videos` (public read, admin write)
5. Seed initial data: 10 animal checkpoints with placeholder content
6. Create database indexes on: `animals.qr_token`, `user_progress.user_id`, `redemptions.redemption_code`

**AC Covered**: Foundation for AC 2.1 (UUID tokens), AC 8.4 (active/inactive)
**Tests**: Unit — migration runs without errors; seed data validates

---

### TASK 1.3: Configure Development Environment & CI
**JIRA:** [PAR-20](https://wiseguys.atlassian.net/browse/PAR-20)
**Complexity**: Simple
**Depends On**: TASK 1.1
**Parallel Group**: A
**Covers**: DX, CI/CD

**Subtasks**:
1. Set up ESLint + Prettier with project conventions
2. Create `.env.example` with all required env vars documented
3. Add `package.json` scripts: `dev`, `build`, `lint`, `test`, `db:migrate`, `db:seed`
4. Configure Vitest for unit/integration tests
5. Set up GitHub Actions CI: lint → test → build on push/PR

**AC Covered**: Infrastructure
**Tests**: CI pipeline runs green

---

## STORY 2: Visitor Authentication
**JIRA:** [PAR-21](https://wiseguys.atlassian.net/browse/PAR-21)
**PRD**: US-1, US-11
**Priority**: P0 (registration/login), P1 (password reset)

### TASK 2.1: Registration & Login Pages + API
**JIRA:** [PAR-22](https://wiseguys.atlassian.net/browse/PAR-22)
**Complexity**: Medium
**Depends On**: TASK 1.1, TASK 1.2
**Parallel Group**: B
**Covers**: US-1 (AC 1.1–1.5)

**Subtasks**:
1. Create registration page `/register`:
   - Form fields: full_name, phone, email, password (Hebrew labels, RTL)
   - Client-side validation (required fields, email format, password 8+ chars)
   - Submit → Supabase Auth `signUp` + create `profiles` row
   - Handle duplicate email error (Hebrew message)
   - On success: auto-login, redirect to `/game` (puzzle hub)
2. Create login page `/login`:
   - Form fields: email, password (Hebrew labels)
   - Submit → Supabase Auth `signInWithPassword`
   - On success: redirect to `/game` or return URL
   - On error: Hebrew error messages
3. Create API route `/api/auth/register` (server-side):
   - Validate input
   - Create auth user + profile in transaction
   - Return JWT session
4. Create auth middleware/hook (`useAuth`) for protected routes
5. Create redirect logic: unauthenticated visitors hitting protected routes go to `/login?redirect=<original>`

**AC Covered**: AC 1.1, AC 1.2, AC 1.3, AC 1.4, AC 1.5, AC 2.3
**Tests**:
- Unit: input validation, error message mapping
- Integration: registration creates user + profile, login returns JWT, duplicate email rejected
- UI: form renders RTL, validation messages display

---

### TASK 2.2: Password Reset Flow (P1)
**JIRA:** [PAR-23](https://wiseguys.atlassian.net/browse/PAR-23)
**Complexity**: Simple
**Depends On**: TASK 2.1
**Parallel Group**: D
**Covers**: US-11 (AC 11.1–11.3)

**Subtasks**:
1. Create "Forgot Password" page `/forgot-password`:
   - Email input field
   - Submit → `supabase.auth.resetPasswordForEmail(email)` (Supabase built-in)
   - Show confirmation message in Hebrew
2. Create "Reset Password" page `/reset-password`:
   - Supabase redirects user here with token in URL hash
   - New password + confirm password fields (8+ chars validation)
   - Submit → `supabase.auth.updateUser({ password })`
3. Configure Supabase email templates (Hebrew text, park branding)
4. Token expiration handled by Supabase (default 1 hour, configurable)

**AC Covered**: AC 11.1, AC 11.2, AC 11.3
**Tests**:
- Unit: token generation, expiration check
- Integration: full reset flow (request → email → reset → login with new password)
- UI: form validation, success/error states

---

## STORY 3: Game Engine — QR Scanning & Animal Checkpoints
**JIRA:** [PAR-24](https://wiseguys.atlassian.net/browse/PAR-24)
**PRD**: US-2, US-3
**Priority**: P0

### TASK 3.1: QR Scan Endpoint & Routing
**JIRA:** [PAR-25](https://wiseguys.atlassian.net/browse/PAR-25)
**Complexity**: Medium
**Depends On**: TASK 2.1
**Parallel Group**: C
**Covers**: US-2 (AC 2.1–2.5)

**Subtasks**:
1. Create dynamic route `/scan/[token]/page.tsx`:
   - Server-side: look up `animals` by `qr_token` = token (UUID)
   - If not found or inactive → render Hebrew error page ("QR code not valid")
   - If found + user not authenticated → redirect to `/login?redirect=/scan/<token>`
   - If found + user authenticated → record scan in `user_progress` (upsert, prevent duplicates), redirect to `/animal/<animal_id>`
2. Create API route `/api/scan` (POST):
   - Input: `{ token: UUID }`
   - Validate token exists in `animals` table and `is_active = true`
   - Check/create `user_progress` record (ON CONFLICT DO NOTHING)
   - Return animal data + letter
   - Rate limit: 10 requests/minute per IP
3. Handle edge cases:
   - Deactivated checkpoint → skip (do not record, show "station temporarily unavailable" in Hebrew)
   - Already-scanned checkpoint → show animal page, no duplicate progress entry

**AC Covered**: AC 2.1, AC 2.2, AC 2.3, AC 2.4, AC 2.5
**Tests**:
- Unit: UUID validation, token lookup, duplicate handling
- Integration: scan → progress recorded, duplicate scan → no new record, invalid token → error
- UI: error page renders Hebrew, redirect flow works
- E2E: full QR scan → login → animal page flow

---

### TASK 3.2: Animal Checkpoint Page
**JIRA:** [PAR-26](https://wiseguys.atlassian.net/browse/PAR-26)
**Complexity**: Complex
**Depends On**: TASK 3.1
**Parallel Group**: C
**Covers**: US-3 (AC 3.1–3.5)

**Subtasks**:
1. Create animal checkpoint page `/animal/[id]/page.tsx`:
   - Server component fetches animal data (name_he, image_url, video_url, fun_facts)
   - Client component for interactive elements
2. Layout (mobile-first, RTL):
   - Animal image (hero, optimized with Next.js `<Image>`)
   - Short video clip (HTML5 `<video>` with controls, poster image, inline playback)
   - Fun facts text (Hebrew, readable typography)
   - Letter reveal animation (animated card flip / slide-in)
   - Progress indicator: "X/10 completed" with visual bar
3. Letter reveal animation:
   - On first visit: animate letter appearing (CSS animation, 1.5s)
   - On repeat visit: show letter without animation
4. Performance optimization:
   - Lazy-load video (only load when in viewport)
   - Optimized image via Next.js Image component
   - Target: < 2s load on 4G
5. Navigation: "Continue to puzzle" button → `/game`

**AC Covered**: AC 3.1, AC 3.2, AC 3.3, AC 3.4, AC 3.5
**Tests**:
- Unit: progress calculation, letter display logic
- Integration: API returns correct animal data, progress count
- UI: layout renders RTL, video plays inline, animation triggers

---

## STORY 4: Puzzle Hub & Prize Redemption
**JIRA:** [PAR-27](https://wiseguys.atlassian.net/browse/PAR-27)
**PRD**: US-4, US-5
**Priority**: P0

### TASK 4.1: Puzzle Hub Page
**JIRA:** [PAR-28](https://wiseguys.atlassian.net/browse/PAR-28)
**Complexity**: Complex
**Depends On**: TASK 3.1
**Parallel Group**: D
**Covers**: US-4 (AC 4.1–4.6)

**Subtasks**:
1. Create puzzle hub page `/game/page.tsx`:
   - Fetch user progress: collected letters + animal order_index
   - Fetch active animal count (for total slots)
2. Letter slots UI:
   - Row of N slots (N = active animals count)
   - Each slot: ordered by `order_index`
   - Collected letters shown in their slot (filled state)
   - Uncollected slots show placeholder (empty/locked state)
3. Progress bar:
   - Visual bar showing X/N completion percentage
   - Text: "X מתוך N תחנות" (X of N stations)
4. Submit area:
   - Text input for submitting the assembled word (auto-filled from collected letters)
   - Submit button → POST `/api/puzzle/validate`
   - Incorrect → Hebrew "try again" message (no penalty, no lockout)
   - Correct → confetti animation (canvas-confetti library) → redirect to `/redeem`
5. Handle deactivated checkpoints:
   - Deactivated animals are excluded from total count and slot display
   - Puzzle word adjusts to only active checkpoint letters

**AC Covered**: AC 4.1, AC 4.2, AC 4.3, AC 4.4, AC 4.5, AC 4.6
**Tests**:
- Unit: slot ordering logic, progress calculation, deactivated checkpoint filtering
- Integration: validate endpoint accepts/rejects words correctly
- UI: slots render RTL, progress bar updates, confetti fires
- E2E: collect all letters → submit correct word → see confetti → redemption

---

### TASK 4.2: Word Validation API
**JIRA:** [PAR-29](https://wiseguys.atlassian.net/browse/PAR-29)
**Complexity**: Simple
**Depends On**: TASK 1.2
**Parallel Group**: C
**Covers**: US-4 (AC 4.3, 4.4)

**Subtasks**:
1. Create API route `/api/puzzle/validate` (POST):
   - Input: `{ answer: string }`
   - Server-side: fetch all active animals ordered by `order_index`, concatenate letters → expected word
   - Compare submitted answer (case-insensitive) to expected word
   - If correct: update `profiles.completion_status` = 'completed', set `completed_at`, generate redemption code
   - Return: `{ correct: boolean, redemption_code?: string }`
2. Edge case: user already completed → return existing redemption code

**AC Covered**: AC 4.3, AC 4.4, AC 5.1
**Tests**:
- Unit: word comparison logic, case insensitivity
- Integration: correct word → status updated + code generated, incorrect → no change, already completed → returns existing code

---

### TASK 4.3: Prize Redemption Page
**JIRA:** [PAR-30](https://wiseguys.atlassian.net/browse/PAR-30)
**Complexity**: Medium
**Depends On**: TASK 4.2
**Parallel Group**: D
**Covers**: US-5 (AC 5.1–5.4)

**Subtasks**:
1. Create redemption page `/redeem/page.tsx`:
   - Fetch redemption code for current user
   - Display redemption code as large text
   - Generate and display QR code (qrcode.react library)
   - Hebrew instructions: "Show this code at the prize booth"
2. Redemption code generation (in TASK 4.2 API):
   - 8-char alphanumeric (uppercase + digits, excluding ambiguous chars like 0/O, 1/I/L)
   - Stored in `redemptions` table with `redeemed = false`
3. Accessible from `/game` page after completion (link/button)
4. Handle non-completed users accessing `/redeem` → redirect to `/game`

**AC Covered**: AC 5.1, AC 5.2, AC 5.3, AC 5.4
**Tests**:
- Unit: code generation uniqueness + format
- Integration: completed user sees code, non-completed user redirected
- UI: QR renders correctly, code displayed prominently

---

## STORY 5: Admin Authentication & Shell
**JIRA:** [PAR-31](https://wiseguys.atlassian.net/browse/PAR-31)
**PRD**: US-10
**Priority**: P0

### TASK 5.1: Admin Authentication System
**JIRA:** [PAR-32](https://wiseguys.atlassian.net/browse/PAR-32)
**Complexity**: Medium
**Depends On**: TASK 1.1, TASK 1.2
**Parallel Group**: B
**Covers**: US-10 (AC 10.1–10.4)

**Subtasks**:
1. Create admin login page `/admin/login`:
   - Email + password form
   - Submit → Supabase Auth `signInWithPassword`
   - After login, check `profiles.role` — if not admin/staff, show "Access denied" and sign out
   - On success: redirect to `/admin/dashboard`
2. Create admin auth middleware (Next.js middleware or server-side check):
   - Verify Supabase session exists on all `/admin/*` routes (except `/admin/login`)
   - Fetch `profiles.role` for authenticated user
   - Check role for route access (staff: only `/admin/verify-prize`; admin: full access)
   - Invalid/expired/visitor role → redirect to `/admin/login`
3. Seed initial admin account via Supabase CLI or seed script:
   - Create auth user via Supabase Admin SDK
   - Set `profiles.role = 'admin'`
   - Password from env var (ADMIN_INITIAL_PASSWORD)
4. Create admin logout (calls Supabase `signOut`, redirects to `/admin/login`)

**AC Covered**: AC 10.1, AC 10.2, AC 10.3, AC 10.4
**Tests**:
- Unit: JWT generation/verification, role checking
- Integration: login flow, protected route redirect, role-based access
- UI: login form, error states
- E2E: login → access dashboard → logout

---

### TASK 5.2: Admin Layout Shell
**JIRA:** [PAR-33](https://wiseguys.atlassian.net/browse/PAR-33)
**Complexity**: Simple
**Depends On**: TASK 5.1
**Parallel Group**: C
**Covers**: Admin UI foundation

**Subtasks**:
1. Create admin layout `/admin/layout.tsx`:
   - Sidebar navigation: Dashboard, Users, Animals, Verify Prize
   - Top bar: admin name, logout button
   - Responsive: collapsible sidebar on mobile
2. Style with nature theme (darker palette variant for admin)
3. Role-based nav: staff sees only "Verify Prize"

**AC Covered**: Foundation for US-6, US-7, US-8, US-9, US-12
**Tests**: UI — navigation renders, role-based items hidden

---

## STORY 6: Admin User Management & Export
**JIRA:** [PAR-34](https://wiseguys.atlassian.net/browse/PAR-34)
**PRD**: US-6, US-7
**Priority**: P0 (user management), P1 (CSV export)

### TASK 6.1: Admin User List & Filters
**JIRA:** [PAR-35](https://wiseguys.atlassian.net/browse/PAR-35)
**Complexity**: Complex
**Depends On**: TASK 5.2
**Parallel Group**: D
**Covers**: US-6 (AC 6.1–6.3)

**Subtasks**:
1. Create admin users page `/admin/users/page.tsx`:
   - Server-side paginated query on `profiles` (join with `user_progress` count)
   - Table columns: name, email, phone, status (in-progress/completed), registration date
   - Pagination controls (20 per page)
2. Filters:
   - Completion status dropdown: All / In Progress / Completed
   - Date range picker: from/to registration date
   - Time spent filter (optional, computed from first scan to last scan or completion)
3. Search:
   - Text input: search by name or email (ILIKE partial match)
   - Debounced input (300ms)
4. API route `/api/admin/users` (GET):
   - Query params: `page`, `status`, `from`, `to`, `search`, `timeSpent`
   - Returns paginated results with total count

**AC Covered**: AC 6.1, AC 6.2, AC 6.3
**Tests**:
- Unit: filter query building, pagination logic
- Integration: API returns filtered results correctly, search works
- UI: table renders, filters update results

---

### TASK 6.2: Admin User Detail View
**JIRA:** [PAR-36](https://wiseguys.atlassian.net/browse/PAR-36)
**Complexity**: Medium
**Depends On**: TASK 6.1
**Parallel Group**: D
**Covers**: US-6 (AC 6.4)

**Subtasks**:
1. Create user detail page `/admin/users/[id]/page.tsx`:
   - Fetch user profile + all `user_progress` records (join with animal names)
   - Display: user info, progress timeline, checkpoint list with scan timestamps
2. Visual progress:
   - List of all active checkpoints, marked as scanned/unscanned
   - Timestamp per scanned checkpoint
   - Letters collected shown in order
3. Quick actions: view redemption status (if completed)

**AC Covered**: AC 6.4
**Tests**:
- Integration: API returns complete user progress
- UI: progress timeline renders correctly

---

### TASK 6.3: Admin CSV Export
**JIRA:** [PAR-37](https://wiseguys.atlassian.net/browse/PAR-37)
**Complexity**: Medium
**Depends On**: TASK 6.1
**Parallel Group**: E
**Covers**: US-7 (AC 7.1–7.3)

**Subtasks**:
1. Create API route `/api/admin/export/users` (GET):
   - Same filters as user list (status, date range, all)
   - Generate CSV with columns: name, phone, email, completion_status, completed_at, letters_collected
   - Return as downloadable file (Content-Type: text/csv)
2. Add "Export CSV" button to admin users page
3. Letters collected = comma-separated ordered letters

**AC Covered**: AC 7.1, AC 7.2, AC 7.3
**Tests**:
- Unit: CSV generation format
- Integration: filtered export returns correct data
- UI: download triggers correctly

---

## STORY 7: Admin Animal Content Management
**JIRA:** [PAR-38](https://wiseguys.atlassian.net/browse/PAR-38)
**PRD**: US-8
**Priority**: P0

### TASK 7.1: Animal Checkpoint CRUD
**JIRA:** [PAR-39](https://wiseguys.atlassian.net/browse/PAR-39)
**Complexity**: Complex
**Depends On**: TASK 5.2
**Parallel Group**: D
**Covers**: US-8 (AC 8.1, 8.3, 8.4, 8.5)

**Subtasks**:
1. Create animal list page `/admin/animals/page.tsx`:
   - Table: name, letter, order_index, active status, actions (edit, toggle active)
   - Toggle active/inactive inline
2. Create animal edit page `/admin/animals/[id]/edit/page.tsx`:
   - Form fields: name_he, fun_facts (textarea), letter, order_index
   - Validation: order_index unique, letter single char
   - Save → API updates DB immediately
3. API routes:
   - `GET /api/admin/animals` — list all
   - `GET /api/admin/animals/[id]` — single animal
   - `PUT /api/admin/animals/[id]` — update fields
   - `PATCH /api/admin/animals/[id]/toggle` — toggle is_active
4. Validation: prevent deactivating checkpoint if it would make puzzle unsolvable (warn admin)
5. QR code generation for each checkpoint:
   - Generate downloadable QR code image per animal (URL: `https://<domain>/scan/<qr_token>`)
   - "Download QR" button per animal in admin list
   - Regenerate QR token option (generates new UUID, invalidates old QR)

**AC Covered**: AC 8.1, AC 8.3, AC 8.4, AC 8.5
**Tests**:
- Unit: validation logic, toggle behavior
- Integration: CRUD operations persist correctly, changes effective immediately
- UI: form renders, inline toggle works

---

### TASK 7.2: Animal Media Upload (Image & Video)
**JIRA:** [PAR-40](https://wiseguys.atlassian.net/browse/PAR-40)
**Complexity**: Medium
**Depends On**: TASK 7.1
**Parallel Group**: E
**Covers**: US-8 (AC 8.2, 8.6)

**Subtasks**:
1. Add image upload to animal edit page:
   - File picker (accept: image/*)
   - Upload to Supabase Storage `animal-images` bucket
   - Update `animals.image_url` with public URL
   - Preview current image
2. Add video upload to animal edit page:
   - File picker (accept: video/*)
   - Upload to Supabase Storage `animal-videos` bucket
   - Update `animals.video_url` with public URL
   - Preview current video
3. API route for upload: `/api/admin/animals/[id]/media` (POST, multipart/form-data)
4. File size limits: image 5MB, video 50MB
5. Delete old file from storage when replacing

**AC Covered**: AC 8.2, AC 8.6
**Tests**:
- Integration: upload stores file, URL updated in DB, old file deleted
- UI: file picker, preview, upload progress indicator

---

## STORY 8: Admin Prize Verification
**JIRA:** [PAR-41](https://wiseguys.atlassian.net/browse/PAR-41)
**PRD**: US-9
**Priority**: P0

### TASK 8.1: Prize Verification Page
**JIRA:** [PAR-42](https://wiseguys.atlassian.net/browse/PAR-42)
**Complexity**: Medium
**Depends On**: TASK 5.1, TASK 4.2
**Parallel Group**: E
**Covers**: US-9 (AC 9.1–9.4)

**Subtasks**:
1. Create verification page `/admin/verify-prize/page.tsx`:
   - Text input for manual redemption code entry
   - Camera-based QR scanner option (html5-qrcode or @zxing/library) for scanning visitor's redemption QR
   - "Verify" button → POST `/api/admin/verify-prize`
   - Results display:
     - Valid + unredeemed: show user name, "Mark as redeemed" button
     - Valid + already redeemed: show "Previously redeemed" + timestamp
     - Invalid: show "Code not found"
2. API route `/api/admin/verify-prize` (POST):
   - Input: `{ code: string }`
   - Lookup in `redemptions` table
   - Return status + user info
3. API route `/api/admin/redeem` (POST):
   - Input: `{ code: string }`
   - Set `redeemed = true`, `redeemed_at = NOW()`
   - Return success
4. Accessible to both admin and staff roles

**AC Covered**: AC 9.1, AC 9.2, AC 9.3, AC 9.4
**Tests**:
- Unit: code lookup logic
- Integration: verify valid/redeemed/invalid codes, mark as redeemed
- UI: states render correctly (success, already redeemed, not found)
- E2E: enter code → verify → mark redeemed → re-verify shows already redeemed

---

## STORY 9: Basic Analytics Dashboard (P1)
**JIRA:** [PAR-43](https://wiseguys.atlassian.net/browse/PAR-43)
**PRD**: US-12
**Priority**: P1

### TASK 9.1: Analytics API & Dashboard
**JIRA:** [PAR-44](https://wiseguys.atlassian.net/browse/PAR-44)
**Complexity**: Medium
**Depends On**: TASK 5.2
**Parallel Group**: E
**Covers**: US-12 (AC 12.1–12.4)

**Subtasks**:
1. Create API route `/api/admin/analytics` (GET):
   - Total registered users: `COUNT(*) FROM profiles`
   - Completion rate: `COUNT(completed) / COUNT(total) * 100`
   - Avg completion time: `AVG(completed_at - first_scan_time)` for completed users
   - Checkpoint distribution: `COUNT(*) per animal_id FROM user_progress GROUP BY animal_id`
2. Create analytics dashboard page `/admin/dashboard/page.tsx`:
   - Card: total users (big number)
   - Card: completion rate (percentage + donut chart)
   - Card: average completion time (formatted duration)
   - Bar chart: checkpoint scan distribution (which stations are most/least popular)
3. Simple charting library (recharts or Chart.js via react-chartjs-2)

**AC Covered**: AC 12.1, AC 12.2, AC 12.3, AC 12.4
**Tests**:
- Unit: metric calculations
- Integration: API returns accurate metrics
- UI: charts render with data

---

## STORY 10: Security, Performance & Polish
**JIRA:** [PAR-45](https://wiseguys.atlassian.net/browse/PAR-45)
**PRD**: NFRs, design theme
**Priority**: P0

### TASK 10.1: Security Hardening
**JIRA:** [PAR-46](https://wiseguys.atlassian.net/browse/PAR-46)
**Complexity**: Medium
**Depends On**: TASK 3.1, TASK 5.1
**Parallel Group**: E
**Covers**: NFRs (Security)

**Subtasks**:
1. Rate limiting on `/scan/[token]` and `/api/scan`: 10 req/min per IP (use `next-rate-limit` or custom middleware)
2. Rate limiting on auth routes: 5 req/min per IP (prevent brute-force)
3. Security headers via Next.js config: CSP, X-Frame-Options, HSTS
4. Validate all inputs server-side (zod schemas)
5. Ensure parameterized queries throughout (Supabase SDK handles this)
6. JWT expiration: 24h for visitors, 8h for admin
7. Verify no PII in logs

**AC Covered**: Security NFRs
**Tests**:
- Integration: rate limiting triggers after threshold, security headers present
- Unit: input validation schemas

---

### TASK 10.2: Performance Optimization
**JIRA:** [PAR-47](https://wiseguys.atlassian.net/browse/PAR-47)
**Complexity**: Medium
**Depends On**: TASK 3.2, TASK 4.1
**Parallel Group**: E
**Covers**: NFRs (Performance)

**Subtasks**:
1. Next.js Image optimization for animal images (automatic with `<Image>`)
2. Lazy-load video component (intersection observer, load on viewport entry)
3. Static generation where possible (layout, shared components)
4. API response caching headers for animal data (5 min TTL)
5. Compress all static assets (Next.js handles gzip/brotli)
6. Bundle analysis to ensure < 100KB initial JS
7. Lighthouse audit: target > 90 performance score on mobile

**AC Covered**: AC 3.4 (< 2s), NFR performance (< 3s first load)
**Tests**:
- Performance: Lighthouse CI check, page load timing

---

### TASK 10.3: Design Polish & Animations
**JIRA:** [PAR-48](https://wiseguys.atlassian.net/browse/PAR-48)
**Complexity**: Medium
**Depends On**: TASK 3.2, TASK 4.1
**Parallel Group**: E
**Covers**: UX requirements, animations

**Subtasks**:
1. Refine nature theme across all pages:
   - Consistent color usage (primary: deep-green, accent: turquoise, background: sand)
   - Nature-inspired decorative elements (subtle leaf borders, water-wave dividers)
2. Letter reveal animation (CSS keyframes: flip card revealing letter)
3. Confetti animation on puzzle completion (canvas-confetti)
4. Progress bar animation (smooth fill on load)
5. Large tap zones (min 44x44px) audit across all interactive elements
6. Typography refinement: Hebrew font legibility on mobile
7. Error states: friendly Hebrew messages with nature-themed illustrations

**AC Covered**: AC 3.2, AC 4.5, design theme requirements
**Tests**: Visual regression tests (optional), manual QA

---

### TASK 10.4: Scalability, Backups & Ops
**JIRA:** [PAR-49](https://wiseguys.atlassian.net/browse/PAR-49)
**Complexity**: Simple
**Depends On**: TASK 1.2
**Parallel Group**: E
**Covers**: NFRs (Scalability, Reliability)

**Subtasks**:
1. Verify Supabase connection pooling (pgBouncer) is enabled and configured for 300 concurrent users
2. Configure Supabase automated daily DB backups (verify on paid plan, 30-day retention)
3. Set up basic uptime monitoring (UptimeRobot or similar) for frontend and API
4. Run basic load test (k6 or artillery): 300 concurrent users hitting QR scan + puzzle endpoints
5. Document production environment setup (env vars, Supabase project, Vercel deployment)

**AC Covered**: NFR scalability (300 concurrent), NFR reliability (daily backups, 99.5% uptime)
**Tests**:
- Load test: 300 concurrent users with < 2s response time

---

## Dependency Graph

```
Group A (Parallel - Foundation):
  TASK 1.1: Init Next.js project
  TASK 1.2: Set up Supabase & DB
  TASK 1.3: Dev environment & CI (depends on 1.1)

Group B (Parallel - Auth):
  TASK 2.1: Visitor registration & login (depends on 1.1, 1.2)
  TASK 5.1: Admin auth system (depends on 1.1, 1.2)

Group C (Parallel - Core Features):
  TASK 3.1: QR scan endpoint (depends on 2.1)
  TASK 3.2: Animal checkpoint page (depends on 3.1)
  TASK 4.2: Word validation API (depends on 1.2)
  TASK 5.2: Admin layout shell (depends on 5.1)

Group D (Parallel - Feature Pages):
  TASK 4.1: Puzzle hub page (depends on 3.1)
  TASK 4.3: Prize redemption page (depends on 4.2)
  TASK 6.1: Admin user list (depends on 5.2)
  TASK 6.2: Admin user detail (depends on 6.1)
  TASK 7.1: Animal checkpoint CRUD (depends on 5.2)
  TASK 2.2: Password reset flow (depends on 2.1)

Group E (Parallel - Extensions & Polish):
  TASK 6.3: CSV export (depends on 6.1)
  TASK 7.2: Media upload (depends on 7.1)
  TASK 8.1: Prize verification (depends on 5.1, 4.2)
  TASK 9.1: Analytics dashboard (depends on 5.2)
  TASK 10.1: Security hardening (depends on 3.1, 5.1)
  TASK 10.2: Performance optimization (depends on 3.2, 4.1)
  TASK 10.3: Design polish (depends on 3.2, 4.1)
  TASK 10.4: Scalability, backups & ops (depends on 1.2)
```

## Task Summary

| Task | Story | Complexity | Parallel Group | Dependencies |
|------|-------|-----------|----------------|--------------|
| TASK 1.1 | Foundation | Medium | A | None |
| TASK 1.2 | Foundation | Medium | A | None |
| TASK 1.3 | Foundation | Simple | A | 1.1 |
| TASK 2.1 | Visitor Auth | Medium | B | 1.1, 1.2 |
| TASK 2.2 | Visitor Auth | Simple | D | 2.1 |
| TASK 3.1 | Game Engine | Medium | C | 2.1 |
| TASK 3.2 | Game Engine | Complex | C | 3.1 |
| TASK 4.1 | Puzzle & Prize | Complex | D | 3.1 |
| TASK 4.2 | Puzzle & Prize | Simple | C | 1.2 |
| TASK 4.3 | Puzzle & Prize | Medium | D | 4.2 |
| TASK 5.1 | Admin Auth | Medium | B | 1.1, 1.2 |
| TASK 5.2 | Admin Shell | Simple | C | 5.1 |
| TASK 6.1 | Admin Users | Complex | D | 5.2 |
| TASK 6.2 | Admin Users | Medium | D | 6.1 |
| TASK 6.3 | Admin Export | Medium | E | 6.1 |
| TASK 7.1 | Content Mgmt | Complex | D | 5.2 |
| TASK 7.2 | Media Upload | Medium | E | 7.1 |
| TASK 8.1 | Prize Verify | Medium | E | 5.1, 4.2 |
| TASK 9.1 | Analytics | Medium | E | 5.2 |
| TASK 10.1 | Security | Medium | E | 3.1, 5.1 |
| TASK 10.2 | Performance | Medium | E | 3.2, 4.1 |
| TASK 10.3 | Design Polish | Medium | E | 3.2, 4.1 |
| TASK 10.4 | Ops & Scalability | Simple | E | 1.2 |

**Totals**: 23 tasks — Simple: 5, Medium: 14, Complex: 4

## Pipeline Status
- **Stage:** COMPLETE (Stage 4 of 4)
- **Started:** 2026-02-17
- **Completed:** 2026-02-17
- **PRD:** docs/prd/park-hamaayanot-wildlife-quest.md ✅
- **Dev Plan:** docs/dev_plans/park-hamaayanot-wildlife-quest.md ✅
- **JIRA:** PAR-16 (Epic) ✅
- **Progress:** 23/23 tasks complete ✅
