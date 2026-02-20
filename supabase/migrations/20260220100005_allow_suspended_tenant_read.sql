-- ============================================================================
-- Migration: Allow authenticated users to read suspended tenants
-- ============================================================================
-- Security rationale: Active tenants remain publicly readable (needed for
-- middleware slug resolution). Suspended tenants are readable only by
-- authenticated users so that the app can show the park name on the
-- suspended page instead of a generic message.
--
-- ROLLBACK: DROP POLICY IF EXISTS "tenants_select_active_or_authed" ON public.tenants;
-- ROLLBACK: CREATE POLICY "tenants_select_active" ON public.tenants FOR SELECT USING (is_active = true);
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS "tenants_select_active" ON public.tenants;

CREATE POLICY "tenants_select_active_or_authed" ON public.tenants
  FOR SELECT USING (is_active = true OR auth.uid() IS NOT NULL);

COMMIT;
