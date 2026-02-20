import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/auth';
import { resolveTenant } from '@/lib/tenant';
import FloatingParticles from '@/components/FloatingParticles';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ScanPage({ params }: Props) {
  const { token } = await params;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return (
      <div className="bg-forest min-h-screen flex items-center justify-center p-4">
        <FloatingParticles />
        <div className="glass-card p-5 text-center space-y-3 relative z-10">
          <h1 className="text-2xl font-bold text-error">קוד QR לא תקין</h1>
          <p className="text-deep-green/70">הקוד שסרקתם אינו תקף. אנא נסו לסרוק שוב.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const tenant = await resolveTenant();
  const user = await getAuthUser();

  if (!user) {
    redirect(`/login?redirect=/scan/${token}`);
  }

  // Look up animal by QR token scoped to current tenant
  const query = supabase
    .from('animals')
    .select('*')
    .eq('qr_token', token);
  if (tenant) {
    query.eq('tenant_id', tenant.id);
  }
  const { data: animal } = await query.single();

  if (!animal) {
    return (
      <div className="bg-forest min-h-screen flex items-center justify-center p-4">
        <FloatingParticles />
        <div className="glass-card p-5 text-center space-y-3 relative z-10">
          <h1 className="text-2xl font-bold text-error">תחנה לא נמצאה</h1>
          <p className="text-deep-green/70">הקוד שסרקתם אינו מקושר לתחנה. אנא נסו שוב.</p>
        </div>
      </div>
    );
  }

  if (!animal.is_active) {
    return (
      <div className="bg-forest min-h-screen flex items-center justify-center p-4">
        <FloatingParticles />
        <div className="glass-card p-5 text-center space-y-3 relative z-10">
          <h1 className="text-2xl font-bold text-deep-green">תחנה זמנית לא פעילה</h1>
          <p className="text-deep-green/70">התחנה הזו לא פעילה כרגע. נסו תחנה אחרת!</p>
        </div>
      </div>
    );
  }

  const tenantId = tenant?.id ?? animal.tenant_id;

  // Check if the user has already scanned this animal
  const { data: existingProgress } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', user.id)
    .eq('animal_id', animal.id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  const isFirstVisit = !existingProgress;

  // Record scan (upsert — ON CONFLICT DO NOTHING)
  await supabase.from('user_progress').upsert(
    {
      user_id: user.id,
      animal_id: animal.id,
      tenant_id: tenantId,
      letter: animal.letter,
    },
    { onConflict: 'user_id,animal_id', ignoreDuplicates: true }
  );

  // Append ?new=true on first visit to trigger the letter reveal animation
  redirect(`/animal/${animal.id}${isFirstVisit ? '?new=true' : ''}`);
}
