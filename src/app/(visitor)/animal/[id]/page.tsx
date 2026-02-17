import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import PageShell from '@/components/ui/PageShell';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AnimalPage({ params }: Props) {
  const { id } = await params;
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

  return (
    <PageShell>
      <div className="animate-fade-in space-y-5">
        {/* Animal image */}
        {animal.image_url && (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
            <Image
              src={animal.image_url}
              alt={animal.name_he}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Animal name and letter */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-deep-green">{animal.name_he}</h1>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-turquoise text-white text-3xl font-bold animate-slide-in">
            {animal.letter}
          </div>
        </div>

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

        {/* Fun facts */}
        <Card>
          <h2 className="text-lg font-semibold text-deep-green mb-2">עובדות מעניינות</h2>
          <p className="text-deep-green/80 leading-relaxed">{animal.fun_facts}</p>
        </Card>

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
