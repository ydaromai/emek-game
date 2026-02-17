'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PageShell from '@/components/ui/PageShell';
import Card from '@/components/ui/Card';

export default function RedeemPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRedemption();
  }, []);

  async function loadRedemption() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login?redirect=/redeem');
      return;
    }

    const { data: redemption } = await supabase
      .from('redemptions')
      .select('redemption_code')
      .eq('user_id', session.user.id)
      .single();

    if (!redemption) {
      router.push('/game');
      return;
    }

    setCode(redemption.redemption_code);
    setLoading(false);
  }

  if (loading) {
    return (
      <PageShell className="flex items-center justify-center">
        <p className="text-deep-green/70 text-lg">טוען...</p>
      </PageShell>
    );
  }

  return (
    <PageShell className="flex flex-col items-center justify-center text-center">
      <div className="animate-fade-in space-y-6 w-full">
        <h1 className="text-3xl font-bold text-deep-green">מזל טוב!</h1>
        <p className="text-lg text-deep-green/80">פתרתם את החידה בהצלחה!</p>

        <Card className="space-y-4">
          <p className="text-deep-green/70">הציגו את הקוד הזה בדלפק הפרסים:</p>
          <div className="bg-sand py-4 px-6 rounded-xl">
            <p className="text-4xl font-mono font-bold text-deep-green tracking-widest" dir="ltr">
              {code}
            </p>
          </div>
          <p className="text-sm text-deep-green/50">שמרו על המסך פתוח או צלמו צילום מסך</p>
        </Card>
      </div>
    </PageShell>
  );
}
