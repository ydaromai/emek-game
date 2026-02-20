import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';
import { resolveTenant } from '@/lib/tenant';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: Props) {
  const tenant = await resolveTenant();
  if (!tenant) {
    return <div className="text-center py-10 text-deep-green/50">Tenant context required</div>;
  }

  await requireAdmin(tenant.id);
  const { id } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .single();

  if (!user) {
    return <div className="text-center py-10 text-deep-green/50">משתמש לא נמצא</div>;
  }

  const { data: progress } = await supabase
    .from('user_progress')
    .select('*, animals(name_he, order_index)')
    .eq('user_id', id)
    .eq('tenant_id', tenant.id)
    .order('scanned_at');

  const { count: totalActive } = await supabase
    .from('animals')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('tenant_id', tenant.id);

  const { data: redemption } = await supabase
    .from('redemptions')
    .select('*')
    .eq('user_id', id)
    .eq('tenant_id', tenant.id)
    .single();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-deep-green">{user.full_name}</h1>

      <Card>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-deep-green/50">אימייל:</span> <span dir="ltr">{user.email}</span></div>
          <div><span className="text-deep-green/50">טלפון:</span> <span dir="ltr">{user.phone}</span></div>
          <div><span className="text-deep-green/50">סטטוס:</span> {user.completion_status === 'completed' ? 'הושלם' : 'בתהליך'}</div>
          <div><span className="text-deep-green/50">הצטרפות:</span> {new Date(user.created_at).toLocaleDateString('he-IL')}</div>
          {user.completed_at && (
            <div><span className="text-deep-green/50">השלמה:</span> {new Date(user.completed_at).toLocaleDateString('he-IL')}</div>
          )}
        </div>
      </Card>

      <ProgressBar current={progress?.length || 0} total={totalActive || 10} label="התקדמות" />

      <Card>
        <h2 className="text-lg font-semibold text-deep-green mb-3">סריקות</h2>
        {progress && progress.length > 0 ? (
          <ul className="space-y-2">
            {progress.map((p: Record<string, unknown>) => {
              const animal = p.animals as { name_he: string; order_index: number } | null;
              return (
                <li key={p.id as string} className="flex justify-between items-center text-sm border-b border-deep-green/5 pb-2">
                  <span>{animal?.name_he || 'תחנה'} — אות: {p.letter as string}</span>
                  <span className="text-deep-green/50">{new Date(p.scanned_at as string).toLocaleString('he-IL')}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-deep-green/50">אין סריקות עדיין</p>
        )}
      </Card>

      {redemption && (
        <Card>
          <h2 className="text-lg font-semibold text-deep-green mb-2">פרס</h2>
          <p>קוד: <span className="font-mono font-bold" dir="ltr">{redemption.redemption_code}</span></p>
          <p>מומש: {redemption.redeemed ? `כן (${new Date(redemption.redeemed_at).toLocaleString('he-IL')})` : 'לא'}</p>
        </Card>
      )}
    </div>
  );
}
