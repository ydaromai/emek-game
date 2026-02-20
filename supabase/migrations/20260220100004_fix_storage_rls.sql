-- ============================================================================
-- Migration: Update storage RLS policies for multi-tenant
-- ============================================================================
-- Replace old storage write policies that check profiles.role with new
-- policies that check tenant_memberships.role. Public read (SELECT) policies
-- are intentionally left unchanged.
-- ============================================================================
--
-- ROLLBACK SQL:
-- -------------
-- BEGIN;
--
-- DROP POLICY IF EXISTS "Tenant admin insert animal-images" ON storage.objects;
-- DROP POLICY IF EXISTS "Tenant admin update animal-images" ON storage.objects;
-- DROP POLICY IF EXISTS "Tenant admin delete animal-images" ON storage.objects;
-- DROP POLICY IF EXISTS "Tenant admin insert animal-videos" ON storage.objects;
-- DROP POLICY IF EXISTS "Tenant admin update animal-videos" ON storage.objects;
-- DROP POLICY IF EXISTS "Tenant admin delete animal-videos" ON storage.objects;
--
-- CREATE POLICY "Admin write access for animal images" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'animal-images' AND
--     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
--   );
-- CREATE POLICY "Admin delete access for animal images" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'animal-images' AND
--     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
--   );
-- CREATE POLICY "Admin write access for animal videos" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'animal-videos' AND
--     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
--   );
-- CREATE POLICY "Admin delete access for animal videos" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'animal-videos' AND
--     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
--   );
--
-- COMMIT;
-- ============================================================================

BEGIN;

-- =========================================================================
-- SECTION 1: DROP OLD WRITE POLICIES (from 20260217100002_storage_buckets)
-- =========================================================================
-- These old policies reference profiles.role which is deprecated in favour
-- of tenant_memberships.role.

-- animal-images bucket
DROP POLICY IF EXISTS "Admin write access for animal images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access for animal images" ON storage.objects;

-- animal-videos bucket
DROP POLICY IF EXISTS "Admin write access for animal videos" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete access for animal videos" ON storage.objects;


-- =========================================================================
-- SECTION 2: CREATE NEW WRITE POLICIES — animal-images bucket
-- =========================================================================

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


-- =========================================================================
-- SECTION 3: CREATE NEW WRITE POLICIES — animal-videos bucket
-- =========================================================================

CREATE POLICY "Tenant admin insert animal-videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'animal-videos' AND
    EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Tenant admin update animal-videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'animal-videos' AND
    EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Tenant admin delete animal-videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'animal-videos' AND
    EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

COMMIT;
