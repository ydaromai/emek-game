import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getTenant } from '@/lib/tenant';
import { sanitizeSearchInput, escapeCSVField } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
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

  // Verify admin membership for this tenant
  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('tenant_id', tenantId)
    .single();

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let query = supabase
    .from('profiles')
    .select('full_name, phone, email, completion_status, completed_at, created_at')
    .eq('role', 'visitor')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('completion_status', status);
  }
  if (search) {
    const sanitized = sanitizeSearchInput(search);
    if (sanitized) {
      query = query.or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
    }
  }

  const { data: users } = await query;

  // Build CSV with proper escaping
  const header = 'שם,טלפון,אימייל,סטטוס,תאריך השלמה,תאריך הרשמה';
  const rows = (users || []).map((u) =>
    [
      escapeCSVField(u.full_name),
      escapeCSVField(u.phone),
      escapeCSVField(u.email),
      escapeCSVField(u.completion_status === 'completed' ? 'הושלם' : 'בתהליך'),
      escapeCSVField(u.completed_at ? new Date(u.completed_at).toLocaleDateString('he-IL') : ''),
      escapeCSVField(new Date(u.created_at).toLocaleDateString('he-IL')),
    ].join(',')
  );

  const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM for Hebrew Excel

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=users-export.csv',
    },
  });
}
