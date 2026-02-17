'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PageShell from '@/components/ui/PageShell';
import Card from '@/components/ui/Card';
import NatureParticles from '@/components/NatureParticles';

const SPARKLES = [
  { top: '-8px', left: '-8px', delay: '0s', size: 8 },
  { top: '-6px', right: '-6px', delay: '0.3s', size: 6 },
  { bottom: '-8px', left: '20%', delay: '0.6s', size: 7 },
  { bottom: '-6px', right: '15%', delay: '0.9s', size: 5 },
  { top: '50%', left: '-10px', delay: '1.2s', size: 6 },
] as const;

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
      <NatureParticles variant="leaves" />
      <div className="space-y-6 w-full relative z-10">
        {/* Heading with sparkle particles */}
        <div className="animate-enter-1 relative inline-block">
          <h1 className="text-3xl font-bold text-deep-green">מזל טוב!</h1>
          {SPARKLES.map((s, i) => (
            <span
              key={i}
              className="animate-sparkle absolute pointer-events-none"
              style={{
                ...s,
                width: s.size,
                height: s.size,
                animationDelay: s.delay,
                backgroundColor: '#D4A843',
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              }}
              aria-hidden="true"
            />
          ))}
        </div>
        <p className="animate-enter-2 text-lg text-deep-green/80">פתרתם את החידה בהצלחה!</p>

        <Card className="animate-stamp space-y-4">
          <p className="animate-pulse-highlight text-deep-green/70 rounded-lg px-2 py-1">
            הציגו את הקוד הזה בדלפק הפרסים:
          </p>
          <div className="bg-sand py-4 px-6 rounded-xl">
            <p className="golden-shimmer text-4xl font-mono font-bold tracking-widest" dir="ltr">
              {code}
            </p>
          </div>
          <p className="animate-enter-4 text-sm text-deep-green/50">שמרו על המסך פתוח או צלמו צילום מסך</p>
        </Card>
      </div>
    </PageShell>
  );
}
