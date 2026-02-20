import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenant } from '@/lib/tenant';

function generateRedemptionCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Excluded: 0, O, 1, I, L
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'לא מחוברים' }, { status: 401 });
  }

  // Resolve tenant from x-tenant-slug header
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  if (!slug) {
    return NextResponse.json({ error: 'טנאנט לא נמצא' }, { status: 400 });
  }
  const tenant = await getTenant(slug);
  if (!tenant) {
    return NextResponse.json({ error: 'טנאנט לא נמצא' }, { status: 404 });
  }
  const tenantId = tenant.id;

  const { answer } = await request.json();
  if (!answer || typeof answer !== 'string') {
    return NextResponse.json({ error: 'תשובה חסרה' }, { status: 400 });
  }

  // Check if already completed (tenant-scoped)
  const { data: existingRedemption } = await supabase
    .from('redemptions')
    .select('redemption_code')
    .eq('user_id', session.user.id)
    .eq('tenant_id', tenantId)
    .single();

  if (existingRedemption) {
    return NextResponse.json({
      correct: true,
      redemption_code: existingRedemption.redemption_code,
    });
  }

  // Get expected word from active animals for this tenant
  const { data: animals } = await supabase
    .from('animals')
    .select('letter, order_index')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (!animals || animals.length === 0) {
    return NextResponse.json({ error: 'שגיאה במערכת' }, { status: 500 });
  }

  const expectedWord = animals.map((a) => a.letter).join('');
  const normalizedAnswer = answer.trim();

  if (normalizedAnswer !== expectedWord) {
    return NextResponse.json({ correct: false });
  }

  // Correct! Generate redemption code and mark as completed
  const adminClient = createAdminClient();
  const redemptionCode = generateRedemptionCode();

  await adminClient.from('redemptions').insert({
    user_id: session.user.id,
    tenant_id: tenantId,
    redemption_code: redemptionCode,
  });

  await adminClient
    .from('profiles')
    .update({
      completion_status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('user_id', session.user.id)
    .eq('tenant_id', tenantId);

  return NextResponse.json({
    correct: true,
    redemption_code: redemptionCode,
  });
}
