-- ============================================
-- Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Animals policies
CREATE POLICY "Anyone authenticated can read active animals" ON public.animals
  FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can read all animals" ON public.animals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert animals" ON public.animals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update animals" ON public.animals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- User progress policies
CREATE POLICY "Users can read own progress" ON public.user_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all progress" ON public.user_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- Redemptions policies
CREATE POLICY "Users can read own redemption" ON public.redemptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can insert redemptions" ON public.redemptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read all redemptions" ON public.redemptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can update redemptions" ON public.redemptions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );
