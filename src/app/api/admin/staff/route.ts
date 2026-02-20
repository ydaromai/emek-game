import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenant } from '@/lib/tenant';

async function verifyAdminAccess() {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  if (!slug) {
    return { error: NextResponse.json({ error: 'No tenant' }, { status: 400 }) };
  }

  const tenant = await getTenant(slug);
  if (!tenant) {
    return { error: NextResponse.json({ error: 'Tenant not found' }, { status: 404 }) };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const adminClient = createAdminClient();
  const { data: membership } = await adminClient
    .from('tenant_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenant.id)
    .single();

  if (membership?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { tenant, user, adminClient };
}

export async function GET() {
  const auth = await verifyAdminAccess();
  if ('error' in auth) return auth.error;
  const { tenant, adminClient } = auth;

  // Fetch tenant memberships with profile info
  const { data: memberships, error } = await adminClient
    .from('tenant_memberships')
    .select('user_id, role, created_at')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }

  // Fetch profiles for these users
  const userIds = (memberships || []).map((m) => m.user_id);
  let profiles: { user_id: string; full_name: string; email: string }[] = [];

  if (userIds.length > 0) {
    const { data: profileData } = await adminClient
      .from('profiles')
      .select('user_id, full_name, email')
      .eq('tenant_id', tenant.id)
      .in('user_id', userIds);
    profiles = profileData || [];
  }

  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

  const staff = (memberships || []).map((m) => {
    const profile = profileMap.get(m.user_id);
    return {
      user_id: m.user_id,
      role: m.role,
      created_at: m.created_at,
      email: profile?.email || '',
      full_name: profile?.full_name || '',
    };
  });

  return NextResponse.json({ staff });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess();
  if ('error' in auth) return auth.error;
  const { tenant, adminClient } = auth;

  const body = await request.json();
  const { email, role } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Only allow 'staff' role assignment
  if (role !== 'staff') {
    return NextResponse.json({ error: 'Only staff role can be assigned' }, { status: 400 });
  }

  // Check if membership already exists for this email in this tenant
  const { data: existingProfiles } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('email', email.toLowerCase().trim())
    .eq('tenant_id', tenant.id)
    .limit(1);

  if (existingProfiles && existingProfiles.length > 0) {
    const existingUserId = existingProfiles[0].user_id;

    // Check if membership already exists
    const { data: existingMembership } = await adminClient
      .from('tenant_memberships')
      .select('role')
      .eq('user_id', existingUserId)
      .eq('tenant_id', tenant.id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: 'משתמש זה כבר חבר צוות בארגון זה' },
        { status: 409 }
      );
    }

    // User exists in this tenant but has no membership — create membership
    const { error: membershipError } = await adminClient
      .from('tenant_memberships')
      .insert({ user_id: existingUserId, tenant_id: tenant.id, role: 'staff' });

    if (membershipError) {
      return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user_id: existingUserId });
  }

  // Check if user exists in auth (by email across all tenants)
  const { data: allProfiles } = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('email', email.toLowerCase().trim())
    .limit(1);

  if (allProfiles && allProfiles.length > 0) {
    const existingUserId = allProfiles[0].user_id;

    // Create profile for this tenant
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        user_id: existingUserId,
        tenant_id: tenant.id,
        full_name: email.split('@')[0],
        email: email.toLowerCase().trim(),
        phone: '',
        role: 'staff',
        completion_status: 'in_progress',
      });

    if (profileError) {
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // Create membership
    const { error: membershipError } = await adminClient
      .from('tenant_memberships')
      .insert({ user_id: existingUserId, tenant_id: tenant.id, role: 'staff' });

    if (membershipError) {
      return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user_id: existingUserId });
  }

  // User does not exist at all — create auth user + profile + membership
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    email_confirm: true,
    user_metadata: { full_name: email.split('@')[0] },
  });

  if (createError || !newUser?.user) {
    return NextResponse.json(
      { error: createError?.message || 'Failed to create user' },
      { status: 500 }
    );
  }

  const userId = newUser.user.id;

  // Create profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      user_id: userId,
      tenant_id: tenant.id,
      full_name: email.split('@')[0],
      email: email.toLowerCase().trim(),
      phone: '',
      role: 'staff',
      completion_status: 'in_progress',
    });

  if (profileError) {
    return NextResponse.json({ error: 'User created but profile creation failed' }, { status: 500 });
  }

  // Create membership
  const { error: membershipError } = await adminClient
    .from('tenant_memberships')
    .insert({ user_id: userId, tenant_id: tenant.id, role: 'staff' });

  if (membershipError) {
    return NextResponse.json({ error: 'User created but membership creation failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, user_id: userId });
}
