-- ============================================
-- Park HaMaayanot Wildlife Quest — Initial Schema
-- ============================================

-- Users (extends Supabase auth.users) — unified for visitors, staff, and admins
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'visitor' CHECK (role IN ('visitor', 'staff', 'admin')),
  completion_status TEXT DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Animal Checkpoints
CREATE TABLE public.animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_he TEXT NOT NULL,
  qr_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  letter CHAR(1) NOT NULL,
  order_index INTEGER NOT NULL UNIQUE CHECK (order_index >= 1 AND order_index <= 20),
  fun_facts TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Progress (scan records)
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  letter CHAR(1) NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, animal_id)
);

-- Prize Redemptions
CREATE TABLE public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  redemption_code TEXT NOT NULL UNIQUE,
  redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_animals_qr_token ON public.animals(qr_token);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_redemptions_code ON public.redemptions(redemption_code);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Updated_at trigger for animals
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_animals_updated_at
    BEFORE UPDATE ON public.animals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
