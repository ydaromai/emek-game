import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function requireAuth(redirectTo?: string) {
  const session = await getSession();
  if (!session) {
    const loginUrl = redirectTo
      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
      : '/login';
    redirect(loginUrl);
  }
  return session;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function requireAdmin() {
  const session = await requireAuth('/admin/login');
  const profile = await getProfile(session.user.id);

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    redirect('/admin/login');
  }

  return { session, profile };
}
