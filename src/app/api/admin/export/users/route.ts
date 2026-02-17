import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let query = supabase
    .from('profiles')
    .select('full_name, phone, email, completion_status, completed_at, created_at')
    .eq('role', 'visitor')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('completion_status', status);
  }
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: users } = await query;

  // Build CSV
  const header = 'שם,טלפון,אימייל,סטטוס,תאריך השלמה,תאריך הרשמה';
  const rows = (users || []).map((u) =>
    [
      u.full_name,
      u.phone,
      u.email,
      u.completion_status === 'completed' ? 'הושלם' : 'בתהליך',
      u.completed_at ? new Date(u.completed_at).toLocaleDateString('he-IL') : '',
      new Date(u.created_at).toLocaleDateString('he-IL'),
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
