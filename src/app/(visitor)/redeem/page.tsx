'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/components/TenantProvider';
import SectionDivider from '@/components/ui/SectionDivider';

const FloatingParticles = dynamic(() => import('@/components/FloatingParticles'), { ssr: false });

const SPARKLES = [
  { top: '-8px', left: '-8px', delay: '0s', size: 8 },
  { top: '-6px', right: '-6px', delay: '0.3s', size: 6 },
  { bottom: '-8px', left: '20%', delay: '0.6s', size: 7 },
  { bottom: '-6px', right: '15%', delay: '0.9s', size: 5 },
  { top: '50%', left: '-10px', delay: '1.2s', size: 6 },
] as const;

export default function RedeemPage() {
  const router = useRouter();
  const tenant = useTenant();
  const tenantId = tenant.id;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRedemption();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

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
      .eq('tenant_id', tenantId)
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
      <div className="bg-forest min-h-screen flex items-center justify-center">
        <p className="text-deep-green/70 text-lg relative z-10">טוען...</p>
      </div>
    );
  }

  return (
    <div className="bg-forest min-h-screen flex flex-col items-center justify-center text-center p-4">
      <FloatingParticles />
      <div className="space-y-6 w-full max-w-lg relative z-10">
        {/* Trophy badge */}
        <div className="animate-pop-in mx-auto w-20 h-20">
          <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="גביע" className="w-full h-full">
            <circle cx="40" cy="40" r="38" fill="#D4A843" opacity="0.2" />
            <circle cx="40" cy="40" r="28" fill="#D4A843" opacity="0.3" />
            <polygon points="40,18 45,32 60,32 48,41 52,55 40,46 28,55 32,41 20,32 35,32" fill="#D4A843" />
          </svg>
        </div>

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

        <SectionDivider variant="wave" />

        <div className="glass-card p-5 animate-stamp space-y-4">
          <p className="animate-pulse-highlight text-deep-green/70 rounded-lg px-2 py-1">
            הציגו את הקוד הזה בדלפק הפרסים:
          </p>
          <div className="bg-sand py-4 px-6 rounded-xl">
            <p className="golden-shimmer text-4xl font-mono font-bold tracking-widest" dir="ltr" data-testid="redemption-code">
              {code}
            </p>
          </div>
          <p className="animate-enter-4 text-sm text-deep-green/50">שמרו על המסך פתוח או צלמו צילום מסך</p>
        </div>
      </div>
    </div>
  );
}
