import Link from 'next/link';
import FloatingParticles from '@/components/FloatingParticles';
import SectionDivider from '@/components/ui/SectionDivider';
import TipBox from '@/components/ui/TipBox';
import { getAllSiteContent } from '@/lib/site-content';
import { getTenantSlug, getTenant } from '@/lib/tenant';

export default async function HomePage() {
  const tenantSlug = await getTenantSlug();
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;

  // Bare domain landing (no tenant)
  if (!tenant) {
    return (
      <div className="bg-forest min-h-screen p-4">
        <FloatingParticles />
        <main className="flex flex-col items-center justify-center text-center max-w-lg mx-auto py-6">
          <div className="space-y-6 relative z-10">
            {/* Hero icon */}
            <div className="animate-enter-1 flex justify-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-5xl">
                🌲
              </div>
            </div>

            {/* Title */}
            <div className="animate-enter-2">
              <h1 className="text-4xl font-bold text-white leading-tight">
                ברוכים הבאים לריאלייף
              </h1>
              <h2 className="text-xl text-white/80 mt-2">
                Welcome to Realife
              </h2>
            </div>

            <div className="glass-card p-5 animate-enter-3 text-right space-y-3">
              <p className="text-lg text-white/90">
                פלטפורמה למשחקי חינוך חוויתיים
              </p>
              <p className="text-base text-white/70">
                צרו משחקים מותאמים אישית לארגון שלכם
              </p>
            </div>

            <div className="animate-enter-4 space-y-3">
              <Link
                href="/login"
                className="block btn-gradient w-full min-h-[44px] px-6 py-3 text-lg text-center transition-all duration-200 active:scale-[0.97]"
              >
                כניסה למערכת
              </Link>
              <Link
                href="/register"
                className="block w-full min-h-[44px] px-6 py-3 rounded-xl font-medium text-lg text-center border-2 border-white text-white bg-transparent hover:bg-white/5 active:bg-white/10 transition-all duration-200 active:scale-[0.97]"
              >
                הרשמה חדשה
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Tenant-specific landing
  const content = await getAllSiteContent(tenant.id);

  return (
    <div className="bg-forest min-h-screen p-4">
      <FloatingParticles />
      <main className="flex flex-col items-center justify-center text-center max-w-lg mx-auto py-6">
        <div className="space-y-6 relative z-10">
          {/* Hero scene */}
          <div className="animate-enter-1 relative w-full h-56 rounded-2xl overflow-hidden shadow-lg">
            {/* Sky gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-blue via-sky-blue/60 to-sand" />

            {/* Animated sun */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sand to-amber-200 absolute top-4 right-4 animate-breathe" aria-hidden="true" />

            {/* Hills */}
            <div
              className="absolute bottom-0 left-0 right-0 h-24"
              style={{
                background: 'linear-gradient(135deg, #2F5D50 0%, #4DB6AC 50%, #2F5D50 100%)',
                clipPath: 'polygon(0% 60%, 15% 30%, 30% 50%, 50% 20%, 70% 45%, 85% 25%, 100% 40%, 100% 100%, 0% 100%)',
              }}
            />

            {/* Water layer */}
            <div
              className="animate-wave absolute bottom-0 left-[10%] w-[80%] h-10 bg-turquoise/30"
              style={{ willChange: 'border-radius' }}
            />

            {/* Drifting silhouettes */}
            <span
              className="animate-drift absolute text-deep-green/20 text-2xl"
              style={{ top: '15%', animationDuration: '14s', animationDelay: '0s' }}
              aria-hidden="true"
            >
              🦅
            </span>
            <span
              className="animate-drift absolute text-deep-green/25 text-lg"
              style={{ top: '30%', animationDuration: '18s', animationDelay: '4s' }}
              aria-hidden="true"
            >
              🦋
            </span>
            <span
              className="animate-drift absolute text-turquoise/20 text-xl"
              style={{ top: '70%', animationDuration: '12s', animationDelay: '2s' }}
              aria-hidden="true"
            >
              🐟
            </span>
            <span
              className="animate-drift absolute text-deep-green/15 text-lg"
              style={{ top: '22%', animationDuration: '16s', animationDelay: '6s' }}
              aria-hidden="true"
            >
              🦆
            </span>
            <span
              className="animate-drift absolute text-turquoise/15 text-sm"
              style={{ top: '55%', animationDuration: '20s', animationDelay: '8s' }}
              aria-hidden="true"
            >
              🐢
            </span>
          </div>

          <SectionDivider variant="wave" />

          {/* Title with wavy underline */}
          <div className="animate-enter-2">
            <h1 className="text-4xl font-bold text-deep-green leading-tight relative inline-block">
              {content.landing_title}
              <span
                className="animate-wave-underline absolute bottom-0 left-[10%] w-[80%] h-1 bg-turquoise rounded-full"
                style={{ transformOrigin: 'center' }}
                aria-hidden="true"
              />
            </h1>
          </div>
          <h2 className="animate-enter-3 text-2xl font-semibold text-turquoise">
            {content.landing_subtitle}
          </h2>

          <div className="glass-card p-5 animate-enter-4 text-right space-y-3">
            <p className="text-lg text-deep-green/80">
              {content.landing_description}
            </p>
          </div>
          <div className="animate-enter-5 space-y-3">
            <Link
              href="/register"
              className="block btn-gradient w-full min-h-[44px] px-6 py-3 text-lg text-center transition-all duration-200 active:scale-[0.97]"
            >
              הרשמה למשחק
            </Link>
            <Link
              href="/login"
              className="block w-full min-h-[44px] px-6 py-3 rounded-xl font-medium text-lg text-center border-2 border-deep-green text-deep-green bg-transparent hover:bg-deep-green/5 active:bg-deep-green/10 transition-all duration-200 active:scale-[0.97]"
            >
              כניסה
            </Link>
          </div>
          <TipBox icon="💡" className="animate-enter-6">טיפ: הורידו את האפליקציה למסך הבית לחוויה מיטבית</TipBox>
        </div>
      </main>
    </div>
  );
}
