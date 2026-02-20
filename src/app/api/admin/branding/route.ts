import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenant } from '@/lib/tenant';
import { validateBranding } from '@/lib/sanitize';
import type { Tenant } from '@/types/database';

async function verifyAdminAndGetTenant() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  if (!slug) return { error: NextResponse.json({ error: 'Tenant not found' }, { status: 400 }) };

  const tenant = await getTenant(slug);
  if (!tenant) return { error: NextResponse.json({ error: 'Tenant not found' }, { status: 404 }) };

  // Verify admin role
  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenant.id)
    .single();

  // Allow super admins
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (membership?.role !== 'admin' && !profile?.is_super_admin) {
    return { error: NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 }) };
  }

  return { user, tenant };
}

export async function GET() {
  const auth = await verifyAdminAndGetTenant();
  if ('error' in auth && auth.error) return auth.error;
  const { tenant } = auth as { user: { id: string }; tenant: Tenant };

  return NextResponse.json({ branding: tenant.branding });
}

export async function PATCH(request: Request) {
  const auth = await verifyAdminAndGetTenant();
  if ('error' in auth && auth.error) return auth.error;
  const { tenant } = auth as { user: { id: string }; tenant: Tenant };

  try {
    const body = await request.json();
    const { branding } = body;

    if (!branding || typeof branding !== 'object') {
      return NextResponse.json({ error: 'Invalid branding data' }, { status: 400 });
    }

    // Strict schema validation
    const validation = validateBranding(branding);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid branding data', details: validation.errors },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tenants')
      .update({ branding })
      .eq('id', tenant.id)
      .select('branding')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ branding: data.branding });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
