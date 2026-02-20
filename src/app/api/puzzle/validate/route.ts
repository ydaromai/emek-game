import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTenant } from '@/lib/tenant';

function generateRedemptionCode(length = 8): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Excluded: 0, O, 1, I, L
  const maxValid = 256 - (256 % chars.length); // Rejection sampling to eliminate modulo bias
  const result: string[] = [];
  while (result.length < length) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const byte of randomBytes) {
      if (byte < maxValid && result.length < length) {
        result.push(chars[byte % chars.length]);
      }
    }
  }
  return result.join('');
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
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
    .eq('user_id', user.id)
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
    user_id: user.id,
    tenant_id: tenantId,
    redemption_code: redemptionCode,
  });

  await adminClient
    .from('profiles')
    .update({
      completion_status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId);

  return NextResponse.json({
    correct: true,
    redemption_code: redemptionCode,
  });
}
