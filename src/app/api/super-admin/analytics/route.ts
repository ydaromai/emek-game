import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function verifySuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!profile?.is_super_admin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user, adminClient };
}

export async function GET() {
  const auth = await verifySuperAdmin();
  if ('error' in auth && auth.error) return auth.error;
  const { adminClient } = auth as { user: { id: string }; adminClient: ReturnType<typeof createAdminClient> };

  try {
    // Fetch all tenants
    const { data: tenants } = await adminClient
      .from('tenants')
      .select('id, name, slug, is_active')
      .order('name');

    const activeTenants = (tenants || []).filter((t) => t.is_active).length;
    const suspendedTenants = (tenants || []).filter((t) => !t.is_active).length;

    // Get per-tenant stats
    const tenantStats = await Promise.all(
      (tenants || []).map(async (tenant) => {
        const { count: usersCount } = await adminClient
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('role', 'visitor');

        const { count: completedCount } = await adminClient
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('role', 'visitor')
          .eq('completion_status', 'completed');

        return {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          is_active: tenant.is_active,
          users: usersCount || 0,
          completed: completedCount || 0,
          completion_rate: usersCount ? Math.round(((completedCount || 0) / usersCount) * 100) : 0,
        };
      })
    );

    const totalUsers = tenantStats.reduce((sum, t) => sum + t.users, 0);
    const totalCompleted = tenantStats.reduce((sum, t) => sum + t.completed, 0);

    return NextResponse.json({
      totals: {
        tenants: (tenants || []).length,
        active_tenants: activeTenants,
        suspended_tenants: suspendedTenants,
        total_users: totalUsers,
        total_completed: totalCompleted,
      },
      tenants: tenantStats,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
