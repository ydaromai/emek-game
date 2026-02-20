import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { resolveTenant } from '@/lib/tenant';
import ProgressBar from '@/components/ui/ProgressBar';
import LetterReveal from '@/components/LetterReveal';
import FloatingParticles from '@/components/FloatingParticles';
import FloatingAvatar from '@/components/FloatingAvatar';
import AnimalFactsCarousel from '@/components/AnimalFactsCarousel';

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
  const tenant = await resolveTenant();

  // Tenant context is required — reject if missing
  if (!tenant) {
    return (
      <div className="bg-forest min-h-screen flex items-center justify-center p-4">
        <FloatingParticles />
        <div className="glass-card p-5 text-center space-y-3 relative z-10">
          <h1 className="text-2xl font-bold text-error">שגיאת גישה</h1>
          <p className="text-deep-green/70">אנא גש דרך כתובת הפארק</p>
        </div>
      </div>
    );
  }

  // Fetch animal — always scoped to tenant (security: verify belongs to tenant)
  const { data: animal } = await supabase
    .from('animals')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .single();

  if (!animal) {
    redirect('/game');
  }

  // Get user progress scoped to tenant
  const { data: progress } = await supabase
    .from('user_progress')
    .select('animal_id')
    .eq('user_id', session.user.id)
    .eq('tenant_id', tenant.id);

  const { count: totalActive } = await supabase
    .from('animals')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .eq('is_active', true);

  const scannedCount = progress?.length || 0;
  const total = totalActive || 0;

  // Build facts array for the carousel
  const facts: { icon: string; title: string; text: string }[] = [];

  if (animal.habitat) {
    facts.push({ icon: '🏞️', title: 'בית הגידול', text: animal.habitat });
  }

  if (animal.fun_facts) {
    facts.push({ icon: '🔍', title: 'עובדות מעניינות', text: animal.fun_facts });
  }

  if (animal.conservation_tip) {
    facts.push({ icon: '🌿', title: 'טיפ ירוק', text: animal.conservation_tip });
  }

  return (
    <main className="bg-forest min-h-screen">
      <FloatingParticles />
      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Animal avatar + name + letter */}
        <div className="animate-enter-1 flex flex-col items-center text-center space-y-3">
          <FloatingAvatar>
            <div className="w-20 h-20 rounded-full border-[4px] border-accent shadow-lg shadow-accent/30 overflow-hidden">
              {animal.image_url ? (
                <Image
                  src={animal.image_url}
                  alt={animal.name_he}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-sky-blue/30 to-sand/50 flex items-center justify-center text-2xl">
                  🐾
                </div>
              )}
            </div>
          </FloatingAvatar>

          <h1 className="text-3xl font-bold text-deep-green">{animal.name_he}</h1>
          <LetterReveal letter={animal.letter} isNew={isNew} />
        </div>

        {/* Facts carousel */}
        {facts.length > 0 && (
          <AnimalFactsCarousel facts={facts} />
        )}

        {/* Video */}
        {animal.video_url && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <video
              src={animal.video_url}
              controls
              playsInline
              preload="none"
              className="w-full rounded-xl"
            />
          </div>
        )}

        {/* Progress */}
        <div className="glass-card rounded-2xl p-4">
          <ProgressBar current={scannedCount} total={total} label="התקדמות" />
        </div>

        {/* Continue to puzzle button */}
        <Link
          href="/game"
          className="block w-full text-center py-4 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-accent to-primary shadow-lg shadow-primary/25 active:scale-[0.97] transition-transform"
        >
          המשיכו לחידה
        </Link>

        {/* Nature trail footer banner */}
        <div className="relative h-32 rounded-2xl overflow-hidden bg-nature-dark">
          <Image
            src="https://images.unsplash.com/photo-1766012166662-906c82c18d9f?w=1080&q=75"
            alt="שביל טבע"
            fill
            loading="lazy"
            sizes="(max-width: 512px) 100vw, 512px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-deep-green/60 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-lg font-bold drop-shadow-md">
              🌿 גלו את הטבע סביבכם
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
