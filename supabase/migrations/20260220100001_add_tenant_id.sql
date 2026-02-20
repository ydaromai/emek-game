-- ============================================
-- Add tenant_id to all tables & restructure profiles PK
-- ============================================
-- This migration converts the single-tenant schema to multi-tenant by:
--   1. Adding tenant_id + user_id to profiles and restructuring its PK
--   2. Adding tenant_id to animals, user_progress, redemptions, site_content
--   3. Backfilling all rows with the Park HaMaayanot tenant
--   4. Replacing unique constraints with tenant-scoped ones
--   5. Setting NOT NULL on all tenant_id columns

BEGIN;

-- =============================================
-- SUBTASK 1.2.1: Restructure profiles table
-- =============================================

-- 1a. Add new columns
ALTER TABLE public.profiles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- 1b. Backfill existing data — profiles.id currently equals auth.users.id
UPDATE public.profiles SET
  tenant_id = (SELECT id FROM public.tenants WHERE slug = 'park-hamaayanot'),
  user_id = id;

-- 1c. Drop the primary key CASCADE — this also drops FKs in user_progress and
--     redemptions that reference profiles(id)
ALTER TABLE public.profiles DROP CONSTRAINT profiles_pkey CASCADE;

-- 1d. Add new surrogate PK column
ALTER TABLE public.profiles ADD COLUMN new_id UUID DEFAULT gen_random_uuid();

-- 1e. Generate UUIDs for existing rows
UPDATE public.profiles SET new_id = gen_random_uuid();

-- 1f. Rename columns: old id -> legacy_auth_id, new_id -> id
ALTER TABLE public.profiles RENAME COLUMN id TO legacy_auth_id;
ALTER TABLE public.profiles RENAME COLUMN new_id TO id;

-- 1g. Set the new PK
ALTER TABLE public.profiles ADD PRIMARY KEY (id);

-- 1h. Re-point downstream FKs to auth.users(id) directly since profiles.id
--     is now a surrogate UUID (the CASCADE above already dropped these)
ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;
ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.redemptions DROP CONSTRAINT IF EXISTS redemptions_user_id_fkey;
ALTER TABLE public.redemptions ADD CONSTRAINT redemptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1i. Drop old unique constraint on email (no longer globally unique)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;

-- 1j. Add tenant-scoped unique constraint: one profile per user per tenant
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_tenant_unique UNIQUE (user_id, tenant_id);


-- =============================================
-- SUBTASK 1.2.2: Add tenant_id to other tables
-- =============================================

-- ----- animals -----
ALTER TABLE public.animals ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
UPDATE public.animals SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'park-hamaayanot');

-- Drop old unique constraints and add tenant-scoped ones
ALTER TABLE public.animals DROP CONSTRAINT IF EXISTS animals_order_index_key;
ALTER TABLE public.animals ADD CONSTRAINT animals_tenant_order_index_unique UNIQUE (tenant_id, order_index);

ALTER TABLE public.animals DROP CONSTRAINT IF EXISTS animals_qr_token_key;
ALTER TABLE public.animals ADD CONSTRAINT animals_tenant_qr_token_unique UNIQUE (tenant_id, qr_token);

-- Index for tenant lookups
CREATE INDEX idx_animals_tenant ON public.animals(tenant_id);


-- ----- user_progress -----
ALTER TABLE public.user_progress ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
UPDATE public.user_progress SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'park-hamaayanot');

-- Index for tenant lookups
CREATE INDEX idx_user_progress_tenant ON public.user_progress(tenant_id);


-- ----- redemptions -----
ALTER TABLE public.redemptions ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
UPDATE public.redemptions SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'park-hamaayanot');

-- Drop old unique constraint on user_id (was globally unique, now tenant-scoped)
ALTER TABLE public.redemptions DROP CONSTRAINT IF EXISTS redemptions_user_id_key;
ALTER TABLE public.redemptions ADD CONSTRAINT redemptions_user_tenant_unique UNIQUE (user_id, tenant_id);

-- Index for tenant lookups
CREATE INDEX idx_redemptions_tenant ON public.redemptions(tenant_id);


-- ----- site_content -----
ALTER TABLE public.site_content ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
UPDATE public.site_content SET tenant_id = (SELECT id FROM public.tenants WHERE slug = 'park-hamaayanot');

-- Drop old unique constraint on content_key (was globally unique, now tenant-scoped)
ALTER TABLE public.site_content DROP CONSTRAINT IF EXISTS site_content_content_key_key;
ALTER TABLE public.site_content ADD CONSTRAINT site_content_tenant_content_key_unique UNIQUE (tenant_id, content_key);

-- Index for tenant lookups
CREATE INDEX idx_site_content_tenant ON public.site_content(tenant_id);


-- =============================================
-- SUBTASK 1.2.3: Set NOT NULL and cleanup
-- =============================================

ALTER TABLE public.profiles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.animals ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.user_progress ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.redemptions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.site_content ALTER COLUMN tenant_id SET NOT NULL;

-- Drop legacy column — CASCADE drops dependent RLS policies that still
-- reference the old "id" column (renamed to legacy_auth_id above).
-- These policies are replaced by the next migration (20260220100002).
ALTER TABLE public.profiles DROP COLUMN IF EXISTS legacy_auth_id CASCADE;

-- profiles.role is superseded by tenant_memberships.role but kept for backward compat
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'visitor';

COMMIT;
