import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

export async function getAuthUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth(redirectTo?: string): Promise<User> {
  const user = await getAuthUser();
  if (!user) {
    const loginUrl = redirectTo
      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
      : '/login';
    redirect(loginUrl);
  }
  return user;
}

export async function getProfile(userId: string, tenantId?: string): Promise<Profile | null> {
  const supabase = await createClient();
  let query = supabase.from('profiles').select('*').eq('user_id', userId);
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data } = await query.single();
  return data;
}

export async function requireAdmin(tenantId?: string | undefined) {
  if (!tenantId && process.env.NODE_ENV === 'development') {
    console.warn('requireAdmin() called without tenantId — admin check is not tenant-scoped');
  }
  const user = await requireAuth('/admin/login');
  const supabase = await createClient();

  // Check tenant_memberships for admin/staff role
  let query = supabase
    .from('tenant_memberships')
    .select('role')
    .eq('user_id', user.id);
  if (tenantId) query = query.eq('tenant_id', tenantId);

  const { data: memberships } = await query;

  if (!memberships || memberships.length === 0) {
    // Check if super admin
    const profile = await getProfile(user.id, tenantId);
    if (!profile?.is_super_admin) {
      redirect('/admin/login');
    }
    return { user, profile, role: 'super_admin' as const };
  }

  const profile = await getProfile(user.id, tenantId);
  return { user, profile, role: memberships[0].role as 'admin' | 'staff' };
}

export async function requireSuperAdmin() {
  const user = await requireAuth('/super-admin/login');
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!data?.is_super_admin) {
    redirect('/super-admin/login');
  }

  return user;
}
