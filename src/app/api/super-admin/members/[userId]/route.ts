import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Verify super admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!profile?.is_super_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;

  // Get tenant_id from query params
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');

  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenant_id query parameter' }, { status: 400 });
  }

  try {
    const { error: deleteError } = await adminClient
      .from('tenant_memberships')
      .delete()
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('Failed to revoke membership:', deleteError.message);
      return NextResponse.json({ error: 'Failed to revoke membership' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Membership revoked' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
