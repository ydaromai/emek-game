-- ============================================
-- Content Enhancement — New Columns & Site Content Table
-- ============================================

-- Add content columns to animals
ALTER TABLE public.animals ADD COLUMN habitat TEXT DEFAULT '';
ALTER TABLE public.animals ADD COLUMN conservation_tip TEXT DEFAULT '';
ALTER TABLE public.animals ADD COLUMN illustration_key TEXT DEFAULT '';

-- Create site_content table
CREATE TABLE public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key TEXT NOT NULL UNIQUE,
  content_value TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for site_content
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Public read (landing page is visited by unauthenticated users)
CREATE POLICY "Anyone can read site_content" ON public.site_content
  FOR SELECT USING (true);

-- Admin write policies using existing SECURITY DEFINER function
CREATE POLICY "Admins can insert site_content" ON public.site_content
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update site_content" ON public.site_content
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete site_content" ON public.site_content
  FOR DELETE USING (public.is_admin());

-- Reuse existing updated_at trigger function
CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
