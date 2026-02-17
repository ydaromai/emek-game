import Link from 'next/link';
import PageShell from '@/components/ui/PageShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import NatureParticles from '@/components/NatureParticles';

export default function HomePage() {
  return (
    <PageShell className="flex flex-col items-center justify-center text-center">
      <NatureParticles variant="leaves" />
      <div className="space-y-6 relative z-10">
        {/* Hero scene */}
        <div className="animate-enter-1 relative w-full h-48 rounded-2xl overflow-hidden shadow-lg">
          {/* Sky gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-blue via-sky-blue/60 to-sand" />

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
        </div>

        {/* Title with wavy underline */}
        <div className="animate-enter-2">
          <h1 className="text-4xl font-bold text-deep-green leading-tight relative inline-block">
            פארק המעיינות
            <span
              className="animate-wave-underline absolute bottom-0 left-[10%] w-[80%] h-1 bg-turquoise rounded-full"
              style={{ transformOrigin: 'center' }}
              aria-hidden="true"
            />
          </h1>
        </div>
        <h2 className="animate-enter-3 text-2xl font-semibold text-turquoise">
          מסע חיות הבר
        </h2>

        <Card className="animate-enter-4 text-right space-y-3">
          <p className="text-lg text-deep-green/80">
            ברוכים הבאים למסע חיות הבר של פארק המעיינות!
          </p>
          <p className="text-deep-green/70">
            סרקו קודי QR ב-10 תחנות, גלו חיות מדהימות, אספו אותיות ופתרו את החידה כדי לזכות בפרס!
          </p>
        </Card>
        <div className="animate-enter-5 space-y-3">
          <Link href="/register">
            <Button fullWidth>הרשמה למשחק</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" fullWidth>כניסה</Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
