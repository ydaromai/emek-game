import Link from 'next/link';
import PageShell from '@/components/ui/PageShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function HomePage() {
  return (
    <PageShell className="flex flex-col items-center justify-center text-center">
      <div className="animate-fade-in space-y-6">
        <h1 className="text-4xl font-bold text-deep-green leading-tight">
          פארק המעיינות
        </h1>
        <h2 className="text-2xl font-semibold text-turquoise">
          מסע חיות הבר
        </h2>
        <Card className="text-right space-y-3">
          <p className="text-lg text-deep-green/80">
            ברוכים הבאים למסע חיות הבר של פארק המעיינות!
          </p>
          <p className="text-deep-green/70">
            סרקו קודי QR ב-10 תחנות, גלו חיות מדהימות, אספו אותיות ופתרו את החידה כדי לזכות בפרס!
          </p>
        </Card>
        <div className="space-y-3">
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
