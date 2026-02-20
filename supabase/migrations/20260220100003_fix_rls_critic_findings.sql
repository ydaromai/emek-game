-- ============================================================================
-- Migration: Fix critical RLS policy gaps found during code review
-- ============================================================================
-- C1: Allow authenticated users to INSERT their own profile (registration)
-- C2: Tighten user_progress INSERT to validate tenant_id
-- ============================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- C1: profiles INSERT for authenticated users
-- -------------------------------------------------------------------------
-- The register and complete-profile pages insert profiles from the browser
-- using the anon key with an authenticated JWT. Without this policy, those
-- inserts are silently rejected by RLS.

CREATE POLICY "profiles_insert_authenticated"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());


-- -------------------------------------------------------------------------
-- C2: Tighten user_progress INSERT policy
-- -------------------------------------------------------------------------
-- The old policy only checked user_id = auth.uid(), allowing an authenticated
-- user to insert progress with an arbitrary tenant_id. Now we also verify
-- the tenant_id matches one of the user's profile tenant_ids.

DROP POLICY IF EXISTS "user_progress_insert_own" ON public.user_progress;

CREATE POLICY "user_progress_insert_own"
  ON public.user_progress
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );

COMMIT;
