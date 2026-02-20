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
    const { data: tenants, error } = await adminClient
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get user counts and completion rates per tenant
    const stats = await Promise.all(
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
          ...tenant,
          users_count: usersCount || 0,
          completion_rate: usersCount ? Math.round(((completedCount || 0) / usersCount) * 100) : 0,
        };
      })
    );

    return NextResponse.json({ tenants: stats });
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
    const { name, slug, contact_email } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Missing required fields: name, slug' }, { status: 400 });
    }

    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json({ error: 'Slug must be lowercase alphanumeric with hyphens' }, { status: 400 });
    }

    // Check slug uniqueness
    const { data: existing } = await adminClient
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    const { data: tenant, error } = await adminClient
      .from('tenants')
      .insert({
        name,
        slug,
        contact_email: contact_email || null,
        branding: {
          primary: '#1a8a6e',
          accent: '#4ecdc4',
          background: '#f0f7f0',
          text: '#1a2e1a',
          error: '#d4183d',
          success: '#2E7D32',
          logo_url: null,
          bg_image_url: null,
          font_family: null,
        },
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tenant }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
