import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import PageShell from '@/components/ui/PageShell';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';
import LetterReveal from '@/components/LetterReveal';
import FloatingParticles from '@/components/FloatingParticles';
import { getIllustration } from '@/components/illustrations';
import SectionDivider from '@/components/ui/SectionDivider';
import TipBox from '@/components/ui/TipBox';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}

export default async function AnimalPage({ params, searchParams }: Props) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const isNew = resolvedSearchParams.new === 'true';
  const session = await requireAuth(`/animal/${id}`);
  const supabase = await createClient();

  const { data: animal } = await supabase
    .from('animals')
    .select('*')
    .eq('id', id)
    .single();

  if (!animal) {
    redirect('/game');
  }

  // Get user progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('animal_id')
    .eq('user_id', session.user.id);

  const { count: totalActive } = await supabase
    .from('animals')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const scannedCount = progress?.length || 0;
  const total = totalActive || 10;

  const IllustrationComponent = animal.illustration_key
    ? getIllustration(animal.illustration_key)
    : null;

  return (
    <PageShell>
      <FloatingParticles />
      <div className="space-y-5 relative z-10">
        {/* Illustration: image_url takes priority, then SVG illustration */}
        {animal.image_url ? (
          <div className="animate-enter-1 relative w-full aspect-video rounded-2xl overflow-hidden">
            <Image
              src={animal.image_url}
              alt={animal.name_he}
              fill
              className="object-cover"
              priority
            />
          </div>
        ) : IllustrationComponent ? (
          <div className="animate-enter-1 relative w-full aspect-[200/180] rounded-2xl overflow-hidden bg-gradient-to-b from-sky-blue/30 to-sand/50 flex items-center justify-center">
            <IllustrationComponent className="w-3/4 h-3/4 animate-illustration-float" />
          </div>
        ) : null}

        {/* Animal name and letter */}
        <div className="animate-enter-2 text-center space-y-2">
          <h1 className="text-3xl font-bold text-deep-green">{animal.name_he}</h1>
          <LetterReveal letter={animal.letter} isNew={isNew} />
        </div>

        {/* Section divider */}
        <SectionDivider variant="wave" />

        {/* Section 1 — Habitat */}
        {animal.habitat && (
          <Card className="animate-enter-3 border-r-4 border-r-sky-blue/30">
            <h2 className="text-lg font-semibold text-deep-green mb-2">🏞️ בית הגידול</h2>
            <p className="text-deep-green/80 leading-relaxed">{animal.habitat}</p>
          </Card>
        )}

        {/* Section 2 — Fun Facts */}
        <Card className="animate-enter-4 border-r-4 border-r-turquoise/30">
          <h2 className="text-lg font-semibold text-deep-green mb-2">🔍 עובדות מעניינות</h2>
          <p className="text-deep-green/80 leading-relaxed">{animal.fun_facts}</p>
        </Card>

        {/* Section 3 — Conservation Tip */}
        {animal.conservation_tip && (
          <TipBox icon="🌿" className="animate-enter-5">
            <div>
              <h2 className="text-lg font-semibold text-deep-green mb-1">טיפ ירוק</h2>
              <p className="text-deep-green/80 leading-relaxed">{animal.conservation_tip}</p>
            </div>
          </TipBox>
        )}

        {/* Video */}
        {animal.video_url && (
          <Card>
            <video
              src={animal.video_url}
              controls
              playsInline
              preload="none"
              className="w-full rounded-xl"
            />
          </Card>
        )}

        {/* Progress */}
        <ProgressBar current={scannedCount} total={total} label="התקדמות" />

        {/* Continue button */}
        <Link href="/game">
          <Button fullWidth variant="secondary">המשיכו לחידה</Button>
        </Link>
      </div>
    </PageShell>
  );
}
