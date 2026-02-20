import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getTenant } from '@/lib/tenant';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve tenant from middleware header
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  if (!slug) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 400 });
  }
  const tenant = await getTenant(slug);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  const tenantId = tenant.id;

  // Verify membership
  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .single();

  if (!membership || !['admin', 'staff'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Total users for this tenant
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'visitor')
    .eq('tenant_id', tenantId);

  // Completed users for this tenant
  const { count: completedUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'visitor')
    .eq('tenant_id', tenantId)
    .eq('completion_status', 'completed');

  // Checkpoint distribution for this tenant
  const { data: checkpointData } = await supabase
    .from('user_progress')
    .select('animal_id, animals(name_he, order_index)')
    .eq('tenant_id', tenantId)
    .order('animal_id');

  const checkpointCounts: Record<string, { name: string; count: number; order: number }> = {};
  for (const row of checkpointData || []) {
    const animal = row.animals as unknown as { name_he: string; order_index: number } | null;
    const key = row.animal_id;
    if (!checkpointCounts[key]) {
      checkpointCounts[key] = { name: animal?.name_he || '', count: 0, order: animal?.order_index || 0 };
    }
    checkpointCounts[key].count++;
  }

  const distribution = Object.values(checkpointCounts).sort((a, b) => a.order - b.order);

  const total = totalUsers || 0;
  const completed = completedUsers || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return NextResponse.json({
    totalUsers: total,
    completedUsers: completed,
    completionRate,
    distribution,
  });
}
