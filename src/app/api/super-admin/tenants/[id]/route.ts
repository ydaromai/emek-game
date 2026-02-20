import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateBranding } from '@/lib/sanitize';

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

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await verifySuperAdmin();
  if ('error' in auth && auth.error) return auth.error;
  const { adminClient } = auth as { user: { id: string }; adminClient: ReturnType<typeof createAdminClient> };
  const { id } = await context.params;

  try {
    const { data: tenant, error } = await adminClient
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await verifySuperAdmin();
  if ('error' in auth && auth.error) return auth.error;
  const { adminClient } = auth as { user: { id: string }; adminClient: ReturnType<typeof createAdminClient> };
  const { id } = await context.params;

  try {
    const body = await request.json();
    const { name, slug, contact_email, is_active, branding } = body;

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return NextResponse.json({ error: 'Slug must be lowercase alphanumeric with hyphens' }, { status: 400 });
      }
      // Check uniqueness (excluding current tenant)
      const { data: existing } = await adminClient
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .single();
      if (existing) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
      }
      updates.slug = slug;
    }
    if (contact_email !== undefined) updates.contact_email = contact_email;
    if (is_active !== undefined) updates.is_active = is_active;
    if (branding !== undefined) {
      if (branding !== null && typeof branding === 'object') {
        const validation = validateBranding(branding);
        if (!validation.valid) {
          return NextResponse.json(
            { error: 'Invalid branding data', details: validation.errors },
            { status: 400 }
          );
        }
      }
      updates.branding = branding;
    }

    const { data: tenant, error } = await adminClient
      .from('tenants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tenant });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await verifySuperAdmin();
  if ('error' in auth && auth.error) return auth.error;
  const { adminClient } = auth as { user: { id: string }; adminClient: ReturnType<typeof createAdminClient> };
  const { id } = await context.params;

  try {
    const { error } = await adminClient
      .from('tenants')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
