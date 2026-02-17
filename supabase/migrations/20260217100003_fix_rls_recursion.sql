-- ============================================
-- Fix RLS infinite recursion on profiles table
-- ============================================
-- The "Admins can read all profiles" policy queries profiles from within
-- its own RLS check, causing infinite recursion. Fix: use a SECURITY DEFINER
-- function that bypasses RLS to check the user's role.

-- Create a helper function that bypasses RLS to check admin/staff role
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Also create an admin-only variant
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop the recursive policy on profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Recreate it using the SECURITY DEFINER function
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin_or_staff());

-- Also fix all other policies that query profiles (they work but are inefficient)
-- Animals
DROP POLICY IF EXISTS "Admins can read all animals" ON public.animals;
CREATE POLICY "Admins can read all animals" ON public.animals
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert animals" ON public.animals;
CREATE POLICY "Admins can insert animals" ON public.animals
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update animals" ON public.animals;
CREATE POLICY "Admins can update animals" ON public.animals
  FOR UPDATE USING (public.is_admin());

-- User progress
DROP POLICY IF EXISTS "Admins can read all progress" ON public.user_progress;
CREATE POLICY "Admins can read all progress" ON public.user_progress
  FOR SELECT USING (public.is_admin_or_staff());

-- Redemptions
DROP POLICY IF EXISTS "Admins can read all redemptions" ON public.redemptions;
CREATE POLICY "Admins can read all redemptions" ON public.redemptions
  FOR SELECT USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Admins can update redemptions" ON public.redemptions;
CREATE POLICY "Admins can update redemptions" ON public.redemptions
  FOR UPDATE USING (public.is_admin_or_staff());
