-- ============================================================================
-- Migration: Rewrite RLS policies for multi-tenant isolation
-- ============================================================================
--
-- TENANT ISOLATION STRATEGY
-- -------------------------
-- Supabase uses PgBouncer in transaction-pool mode. SET LOCAL / current_setting()
-- is unreliable because each .from() call is a separate HTTP request to PostgREST
-- that may get a different pooled connection. Therefore:
--
--   PRIMARY isolation:   Application-layer explicit .eq('tenant_id', tenantId)
--                        on every query.
--
--   SECONDARY isolation: RLS policies use auth.uid() + tenant_memberships lookups
--   (belt-and-suspenders) to verify the authenticated user belongs to the tenant.
--                        RLS does NOT use session variables.
--
-- All policies use auth.uid() and explicit tenant_id column checks.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: DROP OLD SECURITY DEFINER FUNCTIONS
-- ============================================================================
-- The old is_admin() and is_admin_or_staff() check profiles.role which is
-- deprecated in favour of tenant_memberships.role.

DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin_or_staff();


-- ============================================================================
-- SECTION 2: CREATE NEW SECURITY DEFINER FUNCTIONS
-- ============================================================================
-- Order matters: is_super_admin() must be created first because the other
-- functions reference it.

-- 2a. is_super_admin() — checks profiles.is_super_admin flag
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
    false
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2b. is_admin() — user is admin of ANY tenant, or is super admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid() AND role = 'admin'
  ) OR public.is_super_admin()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2c. is_admin_or_staff() — user is admin or staff of ANY tenant, or is super admin
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ) OR public.is_super_admin()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2d. is_admin_of(tid) — user is admin of a SPECIFIC tenant, or is super admin
CREATE OR REPLACE FUNCTION public.is_admin_of(tid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid()
      AND tenant_id = tid
      AND role = 'admin'
  ) OR public.is_super_admin()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2e. is_admin_or_staff_of(tid) — user is admin or staff of a SPECIFIC tenant, or is super admin
CREATE OR REPLACE FUNCTION public.is_admin_or_staff_of(tid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid()
      AND tenant_id = tid
      AND role IN ('admin', 'staff')
  ) OR public.is_super_admin()
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================================
-- SECTION 3: DROP ALL EXISTING RLS POLICIES
-- ============================================================================

-- --- profiles ---
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- --- animals ---
DROP POLICY IF EXISTS "Anyone authenticated can read active animals" ON public.animals;
DROP POLICY IF EXISTS "Admins can read all animals" ON public.animals;
DROP POLICY IF EXISTS "Admins can insert animals" ON public.animals;
DROP POLICY IF EXISTS "Admins can update animals" ON public.animals;

-- --- user_progress ---
DROP POLICY IF EXISTS "Users can read own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Admins can read all progress" ON public.user_progress;

-- --- redemptions ---
DROP POLICY IF EXISTS "Users can read own redemption" ON public.redemptions;
DROP POLICY IF EXISTS "Service role can insert redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "Admins can read all redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "Admins can update redemptions" ON public.redemptions;

-- --- site_content ---
DROP POLICY IF EXISTS "Anyone can read site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admins can insert site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admins can update site_content" ON public.site_content;
DROP POLICY IF EXISTS "Admins can delete site_content" ON public.site_content;

-- --- tenants ---
DROP POLICY IF EXISTS "Public read active tenants" ON public.tenants;
DROP POLICY IF EXISTS "Service role full access" ON public.tenants;

-- --- tenant_memberships ---
DROP POLICY IF EXISTS "Users can view own memberships" ON public.tenant_memberships;
DROP POLICY IF EXISTS "Service role manages memberships" ON public.tenant_memberships;


-- ============================================================================
-- SECTION 4: CREATE NEW RLS POLICIES
-- ============================================================================

-- -------------------------------------------------------------------------
-- 4a. profiles
-- -------------------------------------------------------------------------

-- Users can read their own profile row(s)
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own profile row(s)
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can read profiles belonging to tenants they administer
CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tm.tenant_id FROM public.tenant_memberships tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
    )
  );

-- Super admins can read all profiles
CREATE POLICY "profiles_select_super_admin"
  ON public.profiles
  FOR SELECT
  USING (public.is_super_admin());

-- Service role can insert profiles (used by the auth trigger)
CREATE POLICY "profiles_insert_service_role"
  ON public.profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);


-- -------------------------------------------------------------------------
-- 4b. animals
-- -------------------------------------------------------------------------

-- Authenticated users can read active animals for their tenant
CREATE POLICY "animals_select_active"
  ON public.animals
  FOR SELECT
  USING (
    is_active = true
    AND tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  );

-- Admins can read ALL animals (including inactive) for their tenant
CREATE POLICY "animals_select_admin"
  ON public.animals
  FOR SELECT
  USING (public.is_admin_of(tenant_id));

-- Admins can insert animals for their tenant
CREATE POLICY "animals_insert_admin"
  ON public.animals
  FOR INSERT
  WITH CHECK (public.is_admin_of(tenant_id));

-- Admins can update animals for their tenant
CREATE POLICY "animals_update_admin"
  ON public.animals
  FOR UPDATE
  USING (public.is_admin_of(tenant_id));

-- Super admins have full access to all animals
CREATE POLICY "animals_all_super_admin"
  ON public.animals
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- -------------------------------------------------------------------------
-- 4c. user_progress
-- -------------------------------------------------------------------------

-- Users can read their own progress
CREATE POLICY "user_progress_select_own"
  ON public.user_progress
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own progress
CREATE POLICY "user_progress_insert_own"
  ON public.user_progress
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins/staff can read progress for their tenant
CREATE POLICY "user_progress_select_admin_staff"
  ON public.user_progress
  FOR SELECT
  USING (public.is_admin_or_staff_of(tenant_id));

-- Super admins have full access to all progress
CREATE POLICY "user_progress_all_super_admin"
  ON public.user_progress
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- -------------------------------------------------------------------------
-- 4d. redemptions
-- -------------------------------------------------------------------------

-- Users can read their own redemptions
CREATE POLICY "redemptions_select_own"
  ON public.redemptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can insert redemptions
CREATE POLICY "redemptions_insert_service_role"
  ON public.redemptions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admins/staff can read redemptions for their tenant
CREATE POLICY "redemptions_select_admin_staff"
  ON public.redemptions
  FOR SELECT
  USING (public.is_admin_or_staff_of(tenant_id));

-- Admins/staff can update redemptions for their tenant
CREATE POLICY "redemptions_update_admin_staff"
  ON public.redemptions
  FOR UPDATE
  USING (public.is_admin_or_staff_of(tenant_id));

-- Super admins have full access to all redemptions
CREATE POLICY "redemptions_all_super_admin"
  ON public.redemptions
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- -------------------------------------------------------------------------
-- 4e. site_content
-- -------------------------------------------------------------------------

-- Public read access (landing page visited by unauthenticated users, filtered at app layer)
CREATE POLICY "site_content_select_public"
  ON public.site_content
  FOR SELECT
  USING (true);

-- Admins can insert site_content for their tenant
CREATE POLICY "site_content_insert_admin"
  ON public.site_content
  FOR INSERT
  WITH CHECK (public.is_admin_of(tenant_id));

-- Admins can update site_content for their tenant
CREATE POLICY "site_content_update_admin"
  ON public.site_content
  FOR UPDATE
  USING (public.is_admin_of(tenant_id));

-- Admins can delete site_content for their tenant
CREATE POLICY "site_content_delete_admin"
  ON public.site_content
  FOR DELETE
  USING (public.is_admin_of(tenant_id));

-- Super admins have full access to all site_content
CREATE POLICY "site_content_all_super_admin"
  ON public.site_content
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- -------------------------------------------------------------------------
-- 4f. tenants
-- -------------------------------------------------------------------------

-- Public can read active tenants
CREATE POLICY "tenants_select_active"
  ON public.tenants
  FOR SELECT
  USING (is_active = true);

-- Super admins have full CRUD on tenants
CREATE POLICY "tenants_all_super_admin"
  ON public.tenants
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Service role has full access to tenants
CREATE POLICY "tenants_all_service_role"
  ON public.tenants
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- -------------------------------------------------------------------------
-- 4g. tenant_memberships
-- -------------------------------------------------------------------------

-- Users can view their own memberships
CREATE POLICY "tenant_memberships_select_own"
  ON public.tenant_memberships
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can read memberships for their tenant
CREATE POLICY "tenant_memberships_select_admin"
  ON public.tenant_memberships
  FOR SELECT
  USING (public.is_admin_of(tenant_id));

-- Admins can insert memberships for their tenant
CREATE POLICY "tenant_memberships_insert_admin"
  ON public.tenant_memberships
  FOR INSERT
  WITH CHECK (public.is_admin_of(tenant_id));

-- Admins can delete memberships for their tenant
CREATE POLICY "tenant_memberships_delete_admin"
  ON public.tenant_memberships
  FOR DELETE
  USING (public.is_admin_of(tenant_id));

-- Super admins have full access to all memberships
CREATE POLICY "tenant_memberships_all_super_admin"
  ON public.tenant_memberships
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Service role has full access to memberships
CREATE POLICY "tenant_memberships_all_service_role"
  ON public.tenant_memberships
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


COMMIT;
