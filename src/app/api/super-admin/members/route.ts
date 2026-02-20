import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
    // Fetch all memberships
    const { data: memberships, error: membershipsError } = await adminClient
      .from('tenant_memberships')
      .select('user_id, tenant_id, role, created_at')
      .order('created_at', { ascending: false });

    if (membershipsError) {
      return NextResponse.json({ error: membershipsError.message }, { status: 500 });
    }

    // Fetch all tenants for the dropdown and name resolution
    const { data: tenants, error: tenantsError } = await adminClient
      .from('tenants')
      .select('id, name')
      .order('name');

    if (tenantsError) {
      return NextResponse.json({ error: tenantsError.message }, { status: 500 });
    }

    // Fetch profiles for email resolution
    const userIds = [...new Set((memberships || []).map((m) => m.user_id))];
    let profiles: { user_id: string; email: string }[] = [];
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await adminClient
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      if (profilesError) {
        return NextResponse.json({ error: profilesError.message }, { status: 500 });
      }
      profiles = profilesData || [];
    }

    // Build lookup maps
    const tenantMap = new Map((tenants || []).map((t) => [t.id, t.name]));
    const emailMap = new Map(profiles.map((p) => [p.user_id, p.email]));

    // Join data
    const enrichedMemberships = (memberships || []).map((m) => ({
      user_id: m.user_id,
      tenant_id: m.tenant_id,
      role: m.role,
      created_at: m.created_at,
      email: emailMap.get(m.user_id) || 'unknown',
      tenant_name: tenantMap.get(m.tenant_id) || 'unknown',
    }));

    return NextResponse.json({
      memberships: enrichedMemberships,
      tenants: tenants || [],
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifySuperAdmin();
  if ('error' in auth && auth.error) return auth.error;
  const { adminClient } = auth as { user: { id: string }; adminClient: ReturnType<typeof createAdminClient> };

  try {
    const body = await request.json();
    const { email, tenant_id, role } = body;

    if (!email || !tenant_id || !role) {
      return NextResponse.json({ error: 'Missing required fields: email, tenant_id, role' }, { status: 400 });
    }

    if (!['admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Role must be admin or staff' }, { status: 400 });
    }

    // Verify tenant exists
    const { data: tenant, error: tenantError } = await adminClient
      .from('tenants')
      .select('id, name')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if user exists by email in auth.users
    const { data: authUsersData } = await adminClient.auth.admin.listUsers();
    const existingUser = authUsersData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create user with temp password
      const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}!${Date.now()}`;
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

      if (createError || !newUser?.user) {
        return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 });
      }

      userId = newUser.user.id;
    }

    // Check if profile exists for this user+tenant
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('tenant_id', tenant_id)
      .single();

    if (!existingProfile) {
      // Create profile for this tenant
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
          id: userId,
          user_id: userId,
          tenant_id,
          full_name: email.split('@')[0],
          phone: '',
          email,
          role: role === 'admin' ? 'admin' : 'staff',
        });

      if (profileError) {
        // Profile might already exist with different id — try with generated uuid
        // The profiles table PK is `id` referencing auth.users, but user_id+tenant_id is unique
        // If a profile already exists for this user (different tenant), we need a new row
        if (profileError.code === '23505') {
          // Duplicate key — profile with this id already exists (for another tenant)
          // Use crypto.randomUUID for the profile id
          const { error: retryError } = await adminClient
            .from('profiles')
            .insert({
              user_id: userId,
              tenant_id,
              full_name: email.split('@')[0],
              phone: '',
              email,
              role: role === 'admin' ? 'admin' : 'staff',
            });

          if (retryError) {
            return NextResponse.json({ error: retryError.message }, { status: 500 });
          }
        } else {
          return NextResponse.json({ error: profileError.message }, { status: 500 });
        }
      }
    }

    // Check if membership already exists
    const { data: existingMembership } = await adminClient
      .from('tenant_memberships')
      .select('user_id, tenant_id')
      .eq('user_id', userId)
      .eq('tenant_id', tenant_id)
      .single();

    if (existingMembership) {
      // Update role if it changed
      const { error: updateError } = await adminClient
        .from('tenant_memberships')
        .update({ role })
        .eq('user_id', userId)
        .eq('tenant_id', tenant_id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        membership: { user_id: userId, tenant_id, role, email, tenant_name: tenant.name },
        message: 'Membership updated',
      });
    }

    // Create membership
    const { data: membership, error: membershipError } = await adminClient
      .from('tenant_memberships')
      .insert({ user_id: userId, tenant_id, role })
      .select()
      .single();

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }

    return NextResponse.json({
      membership: { ...membership, email, tenant_name: tenant.name },
      message: existingUser ? 'Membership created for existing user' : 'User created and membership assigned',
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
