-- ============================================
-- ROLLBACK: Remove tenant_id from all tables & restore profiles PK
-- ============================================
-- This script reverses migration 20260220100001_add_tenant_id.sql
-- WARNING: This is a destructive operation. Multi-tenant data separation
-- will be lost. Only use in development/staging environments.
--
-- NOTE: This rollback is conceptual and assumes the database still has
-- the original single-tenant data structure underneath. If new tenants
-- have been added with data, this rollback will fail or lose data.

BEGIN;

-- =============================================
-- 1. Reverse SUBTASK 1.2.3: Remove NOT NULL constraints first
-- =============================================

-- Re-add legacy_auth_id column (needed to restore original PK structure)
-- We cannot perfectly restore it since it was dropped, but we can
-- reconstruct it from profiles.user_id which held the original auth.users.id
ALTER TABLE public.profiles ADD COLUMN legacy_auth_id UUID;
UPDATE public.profiles SET legacy_auth_id = user_id;

-- Remove NOT NULL on tenant_id columns
ALTER TABLE public.profiles ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.animals ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.user_progress ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.redemptions ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.site_content ALTER COLUMN tenant_id DROP NOT NULL;


-- =============================================
-- 2. Reverse SUBTASK 1.2.2: Remove tenant_id from other tables
-- =============================================

-- ----- site_content -----
DROP INDEX IF EXISTS idx_site_content_tenant;
ALTER TABLE public.site_content DROP CONSTRAINT IF EXISTS site_content_tenant_content_key_unique;
ALTER TABLE public.site_content ADD CONSTRAINT site_content_content_key_key UNIQUE (content_key);
ALTER TABLE public.site_content DROP COLUMN IF EXISTS tenant_id;

-- ----- redemptions -----
DROP INDEX IF EXISTS idx_redemptions_tenant;
ALTER TABLE public.redemptions DROP CONSTRAINT IF EXISTS redemptions_user_tenant_unique;
ALTER TABLE public.redemptions ADD CONSTRAINT redemptions_user_id_key UNIQUE (user_id);
ALTER TABLE public.redemptions DROP COLUMN IF EXISTS tenant_id;

-- ----- user_progress -----
DROP INDEX IF EXISTS idx_user_progress_tenant;
ALTER TABLE public.user_progress DROP COLUMN IF EXISTS tenant_id;

-- ----- animals -----
DROP INDEX IF EXISTS idx_animals_tenant;
ALTER TABLE public.animals DROP CONSTRAINT IF EXISTS animals_tenant_order_index_unique;
ALTER TABLE public.animals ADD CONSTRAINT animals_order_index_key UNIQUE (order_index);
ALTER TABLE public.animals DROP CONSTRAINT IF EXISTS animals_tenant_qr_token_unique;
ALTER TABLE public.animals ADD CONSTRAINT animals_qr_token_key UNIQUE (qr_token);
ALTER TABLE public.animals DROP COLUMN IF EXISTS tenant_id;


-- =============================================
-- 3. Reverse SUBTASK 1.2.1: Restore profiles PK structure
-- =============================================

-- Drop the tenant-scoped unique constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_tenant_unique;

-- Re-add email unique constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Drop the surrogate PK
ALTER TABLE public.profiles DROP CONSTRAINT profiles_pkey CASCADE;

-- Rename columns back: id -> (dropped), legacy_auth_id -> id
ALTER TABLE public.profiles DROP COLUMN id;
ALTER TABLE public.profiles RENAME COLUMN legacy_auth_id TO id;

-- Restore original PK
ALTER TABLE public.profiles ADD PRIMARY KEY (id);

-- Restore FK from profiles.id -> auth.users
-- (The original CREATE TABLE had: id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Restore FKs from user_progress and redemptions to profiles(id)
ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;
ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.redemptions DROP CONSTRAINT IF EXISTS redemptions_user_id_fkey;
ALTER TABLE public.redemptions ADD CONSTRAINT redemptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Drop tenant-related columns from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS user_id;

COMMIT;
