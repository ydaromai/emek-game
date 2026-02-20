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

export async function getProfile(userId: string, tenantId?: string): Promise<Profile | null> {
  const supabase = await createClient();
  let query = supabase.from('profiles').select('*').eq('user_id', userId);
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data } = await query.single();
  return data;
}

export async function requireAdmin(tenantId?: string) {
  const session = await requireAuth('/admin/login');
  const supabase = await createClient();

  // Check tenant_memberships for admin/staff role
  let query = supabase
    .from('tenant_memberships')
    .select('role')
    .eq('user_id', session.user.id);
  if (tenantId) query = query.eq('tenant_id', tenantId);

  const { data: memberships } = await query;

  if (!memberships || memberships.length === 0) {
    // Check if super admin
    const profile = await getProfile(session.user.id, tenantId);
    if (!profile?.is_super_admin) {
      redirect('/admin/login');
    }
    return { session, profile, role: 'super_admin' as const };
  }

  const profile = await getProfile(session.user.id, tenantId);
  return { session, profile, role: memberships[0].role as 'admin' | 'staff' };
}

export async function requireSuperAdmin() {
  const session = await requireAuth('/super-admin/login');
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('user_id', session.user.id)
    .limit(1)
    .single();

  if (!data?.is_super_admin) {
    redirect('/super-admin/login');
  }

  return session;
}
