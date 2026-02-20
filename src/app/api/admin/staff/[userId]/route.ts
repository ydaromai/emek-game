import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenant } from '@/lib/tenant';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  if (!slug) {
    return NextResponse.json({ error: 'No tenant' }, { status: 400 });
  }

  const tenant = await getTenant(slug);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();

  // Verify caller is admin for this tenant
  const { data: callerMembership } = await adminClient
    .from('tenant_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenant.id)
    .single();

  if (callerMembership?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Verify target user is staff (not admin) in this tenant
  const { data: targetMembership } = await adminClient
    .from('tenant_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('tenant_id', tenant.id)
    .single();

  if (!targetMembership) {
    return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
  }

  if (targetMembership.role === 'admin') {
    return NextResponse.json({ error: 'Cannot revoke admin membership' }, { status: 403 });
  }

  // Delete the membership
  const { error } = await adminClient
    .from('tenant_memberships')
    .delete()
    .eq('user_id', userId)
    .eq('tenant_id', tenant.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to revoke membership' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
