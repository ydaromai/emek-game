'use client';

import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { fireConfetti } from '@/components/Confetti';
import SectionDivider from '@/components/ui/SectionDivider';
import TipBox from '@/components/ui/TipBox';

const FloatingParticles = dynamic(() => import('@/components/FloatingParticles'), { ssr: false });

const QrScanner = lazy(() => import('@/components/QrScanner'));

interface SlotData {
  order_index: number;
  letter: string | null;
  collected: boolean;
  name_he: string;
}

const ANIMAL_EMOJI: Record<string, string> = {
  'שלדג': '🐦',
  'לוטרה': '🦦',
  'אנפה': '🦢',
  'צב ביצות': '🐢',
  'אילנית': '🐸',
  'סרטן מים מתוקים': '🦀',
  'שפירית': '🪰',
  'בינון': '🐟',
  'נמייה': '🦡',
  'פרפר': '🦋',
};

export default function GamePage() {
  const router = useRouter();
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [success, setSuccess] = useState(false);

  // Progress bar pulse key
  const [pulseKey, setPulseKey] = useState(0);
  const prevCollected = useRef(0);

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
      .select('id, letter, order_index, name_he')
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
      name_he: a.name_he,
    }));

    setSlots(slotData);
    setAnswer(slotData.filter((s) => s.collected).map((s) => s.letter).join(''));

    const newCollected = slotData.filter((s) => s.collected).length;
    if (newCollected !== prevCollected.current) {
      setPulseKey((k) => k + 1);
      prevCollected.current = newCollected;
    }

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
      setSuccess(true);
      fireConfetti();
      setTimeout(() => router.push('/redeem'), 2500);
    } else {
      setError('לא מדויק, נסו שוב!');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="bg-forest min-h-screen">
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-6 max-w-lg mx-auto">
          <p className="text-primary/70 text-lg">טוען...</p>
        </div>
      </div>
    );
  }

  const collectedCount = slots.filter((s) => s.collected).length;
  const totalSlots = slots.length;
  const percentage = totalSlots > 0 ? Math.round((collectedCount / totalSlots) * 100) : 0;

  return (
    <div className="bg-forest min-h-screen">
      <main className="relative z-10 px-4 py-6 max-w-lg mx-auto">
        <FloatingParticles />
        <div className="space-y-6 relative z-10">
          {/* Title */}
          <h1 className="animate-enter-1 text-3xl font-bold text-primary text-center">החידה</h1>

          {/* Progress bar — inline implementation */}
          <div className="animate-enter-2 w-full">
            <div className="flex justify-between items-center mb-2 text-sm font-medium">
              <span className="text-muted-fg">תחנות</span>
              <span className="text-primary">{collectedCount} מתוך {totalSlots}</span>
            </div>
            <div
              className={`w-full h-3 bg-muted rounded-full overflow-hidden ${pulseKey > 0 ? 'animate-pulse-once' : ''}`}
            >
              <div
                key={pulseKey}
                className="h-full w-full bg-gradient-to-r from-primary to-accent rounded-full animate-fill-bar progress-shimmer"
                style={{
                  '--fill-target': `${percentage / 100}`,
                  transformOrigin: 'right',
                } as React.CSSProperties}
              />
            </div>
          </div>

          <SectionDivider variant="leaves" />

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5" aria-hidden="true">
            {slots.map((slot) => (
              <div
                key={`dot-${slot.order_index}`}
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                  slot.collected ? 'bg-accent' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Letter slots card */}
          <div className="glass-card p-5">
            <div className="flex flex-wrap justify-center gap-2" style={{ perspective: '600px' }}>
              {slots.map((slot, i) => (
                <div
                  key={slot.order_index}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                    transition-transform duration-200 cursor-default relative overflow-hidden
                    ${slot.collected
                      ? 'bg-gradient-to-br from-accent to-primary text-white shadow-md animate-pop-in slot-shimmer'
                      : 'bg-muted text-muted-fg/50 animate-breathe'
                    }
                  `}
                  style={slot.collected ? { animationDelay: `${i * 80}ms` } : undefined}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'perspective(200px) rotateY(3deg) rotateX(2deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                  }}
                >
                  {slot.collected && ANIMAL_EMOJI[slot.name_he] && (
                    <span className="animate-emoji-bounce absolute -top-3 text-sm" aria-hidden="true">
                      {ANIMAL_EMOJI[slot.name_he]}
                    </span>
                  )}
                  {slot.collected ? slot.letter : '?'}
                </div>
              ))}
            </div>
          </div>

          {/* Scan button + prompt */}
          {!completed && collectedCount < totalSlots && (
            <div className="space-y-3">
              <button
                type="button"
                className="w-full min-h-[44px] min-w-[44px] px-6 py-3 btn-gradient text-lg transition-all duration-200 active:scale-[0.97] hover:opacity-90"
                onClick={() => setShowScanner(true)}
              >
                סרקו קוד QR 📸
              </button>
              <p className="text-sm text-muted-fg text-center">
                {collectedCount === 0
                  ? 'גשו לאחת מ-10 התחנות בפארק וסרקו את קוד ה-QR'
                  : `נשארו עוד ${totalSlots - collectedCount} תחנות — המשיכו לסרוק!`}
              </p>
              <TipBox icon="🔭">טיפ: חפשו את תחנות ה-QR ליד שילוט המעיינות והשבילים המסומנים</TipBox>
            </div>
          )}

          {/* QR Scanner overlay */}
          {showScanner && (
            <Suspense fallback={null}>
              <QrScanner
                onScan={(url) => {
                  setShowScanner(false);
                  // Extract the path from the URL and navigate — validate origin first
                  try {
                    const parsed = new URL(url);
                    if (parsed.origin === window.location.origin) {
                      router.push(parsed.pathname);
                    }
                  } catch {
                    // If not a full URL, only accept paths starting with /scan/
                    if (url.startsWith('/scan/')) {
                      router.push(url);
                    }
                  }
                }}
                onClose={() => setShowScanner(false)}
              />
            </Suspense>
          )}

          {/* Submit area */}
          {success ? (
            <>
              {/* Success modal overlay */}
              <div
                data-testid="success-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="success-title"
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="bg-white/95 rounded-3xl p-8 mx-4 max-w-sm w-full text-center space-y-3 animate-pop-in">
                  <div data-testid="success-trophy" className="text-5xl">🏆</div>
                  <p id="success-title" className="text-2xl font-bold text-primary">כל הכבוד!</p>
                  <p className="text-muted-fg">מעבירים אתכם לדף הפרס...</p>
                </div>
              </div>
            </>
          ) : completed ? (
            <div className="text-center space-y-3">
              <p className="text-lg font-semibold text-primary">כל הכבוד! פתרתם את החידה!</p>
              <Link
                href="/redeem"
                className="block w-full min-h-[44px] min-w-[44px] px-6 py-3 bg-gradient-to-r from-accent to-primary text-white font-medium text-lg text-center rounded-xl shadow-lg shadow-accent/30 transition-all duration-200 active:scale-[0.97] hover:opacity-90"
              >
                לדף הפרס
              </Link>
            </div>
          ) : (
            <div className="glass-card p-5">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="w-full">
                  <label
                    htmlFor="word-input"
                    className="block text-sm font-medium text-primary mb-1"
                  >
                    הכניסו את המילה
                  </label>
                  <input
                    id="word-input"
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="הקלידו את המילה שגיליתם"
                    className="w-full min-h-[44px] bg-sand rounded-xl px-4 py-3 text-lg text-nature-text placeholder:text-muted-fg/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent border-none"
                  />
                </div>
                {error && <p className="text-error text-sm" role="alert">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting || collectedCount === 0}
                  className="w-full min-h-[44px] min-w-[44px] px-6 py-3 btn-gradient font-medium text-lg transition-all duration-200 active:scale-[0.97] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'בודקים...' : 'בדיקה ✨'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
