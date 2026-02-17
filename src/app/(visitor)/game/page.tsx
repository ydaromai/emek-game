'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import PageShell from '@/components/ui/PageShell';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface SlotData {
  order_index: number;
  letter: string | null;
  collected: boolean;
}

export default function GamePage() {
  const router = useRouter();
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login?redirect=/game'); return; }

    // Check if already completed
    const { data: profile } = await supabase
      .from('profiles')
      .select('completion_status')
      .eq('id', session.user.id)
      .single();

    if (profile?.completion_status === 'completed') {
      setCompleted(true);
    }

    // Get active animals
    const { data: animals } = await supabase
      .from('animals')
      .select('id, letter, order_index')
      .eq('is_active', true)
      .order('order_index');

    // Get user progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('animal_id, letter')
      .eq('user_id', session.user.id);

    const progressMap = new Map(progress?.map((p) => [p.animal_id, p.letter]) || []);

    const slotData: SlotData[] = (animals || []).map((a) => ({
      order_index: a.order_index,
      letter: progressMap.has(a.id) ? progressMap.get(a.id)! : null,
      collected: progressMap.has(a.id),
    }));

    setSlots(slotData);
    setAnswer(slotData.filter((s) => s.collected).map((s) => s.letter).join(''));
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await fetch('/api/puzzle/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    });

    const data = await res.json();

    if (data.correct) {
      // Confetti will be added in TASK 10.3
      router.push('/redeem');
    } else {
      setError('לא מדויק, נסו שוב!');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <PageShell className="flex items-center justify-center">
        <p className="text-deep-green/70 text-lg">טוען...</p>
      </PageShell>
    );
  }

  const collectedCount = slots.filter((s) => s.collected).length;
  const totalSlots = slots.length;

  return (
    <PageShell>
      <div className="animate-fade-in space-y-6">
        <h1 className="text-3xl font-bold text-deep-green text-center">החידה</h1>

        <ProgressBar current={collectedCount} total={totalSlots} label="תחנות" />

        {/* Letter slots */}
        <Card>
          <div className="flex flex-wrap justify-center gap-2">
            {slots.map((slot) => (
              <div
                key={slot.order_index}
                className={`
                  w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold
                  transition-all duration-300
                  ${slot.collected
                    ? 'bg-turquoise text-white shadow-md'
                    : 'bg-deep-green/10 text-deep-green/30'
                  }
                `}
              >
                {slot.collected ? slot.letter : '?'}
              </div>
            ))}
          </div>
        </Card>

        {/* Submit area */}
        {completed ? (
          <div className="text-center space-y-3">
            <p className="text-lg font-semibold text-success">כל הכבוד! פתרתם את החידה!</p>
            <Link href="/redeem">
              <Button fullWidth variant="secondary">לדף הפרס</Button>
            </Link>
          </div>
        ) : (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                label="הכניסו את המילה"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="הקלידו את המילה שגיליתם"
              />
              {error && <p className="text-error text-sm">{error}</p>}
              <Button type="submit" fullWidth disabled={submitting || collectedCount === 0}>
                {submitting ? 'בודקים...' : 'בדיקה'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
