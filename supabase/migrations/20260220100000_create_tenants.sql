-- ============================================
-- Multi-Tenancy Support: Tenants and Memberships
-- ============================================

-- ---------------------------------------------
-- 1. Create tenants table
-- ---------------------------------------------
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  branding JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add trigger for auto-updating updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------
-- 2. Seed Park HaMaayanot as tenant #1
-- ---------------------------------------------
INSERT INTO public.tenants (name, slug, contact_email, branding)
VALUES (
  'Park HaMaayanot',
  'park-hamaayanot',
  null,
  '{
    "primary": "#1a8a6e",
    "accent": "#4ecdc4",
    "background": "#f0f7f0",
    "text": "#1a2e1a",
    "error": "#d4183d",
    "success": "#2E7D32",
    "logo_url": null,
    "bg_image_url": null,
    "font_family": null
  }'::jsonb
);

-- ---------------------------------------------
-- 3. Enable RLS on tenants
-- ---------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Anyone can read active tenants
CREATE POLICY "Public read active tenants"
  ON public.tenants
  FOR SELECT
  USING (is_active = true);

-- Service role can manage all tenants
CREATE POLICY "Service role full access"
  ON public.tenants
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------
-- 4. Create tenant_memberships table
-- ---------------------------------------------
CREATE TABLE public.tenant_memberships (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, tenant_id)
);

-- Index for reverse lookups (find all users for a tenant)
CREATE INDEX idx_tenant_memberships_tenant_id ON public.tenant_memberships(tenant_id);

-- ---------------------------------------------
-- 5. Enable RLS on tenant_memberships
-- ---------------------------------------------
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Users can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON public.tenant_memberships
  FOR SELECT
  USING (user_id = auth.uid());

-- Service role can manage all memberships
CREATE POLICY "Service role manages memberships"
  ON public.tenant_memberships
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------
-- 6. Add super admin flag to profiles
-- ---------------------------------------------
ALTER TABLE public.profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;

-- Set super admin for initial admin user
UPDATE public.profiles SET is_super_admin = true WHERE email = 'ydarom@gmail.com';

-- ---------------------------------------------
-- 7. Seed tenant membership for admin user
-- ---------------------------------------------
INSERT INTO public.tenant_memberships (user_id, tenant_id, role)
SELECT p.id, t.id, 'admin'
FROM public.profiles p, public.tenants t
WHERE p.email = 'ydarom@gmail.com' AND t.slug = 'park-hamaayanot';
