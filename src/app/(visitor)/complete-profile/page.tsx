'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/components/TenantProvider';

const FloatingParticles = dynamic(() => import('@/components/FloatingParticles'), { ssr: false });

export default function CompleteProfilePage() {
  const router = useRouter();
  const tenant = useTenant();
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    async function loadUserEmail() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');
    }

    loadUserEmail();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('לא נמצא משתמש מחובר');
      setLoading(false);
      return;
    }

    // Create profile for this tenant
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: user.id,
      tenant_id: tenant.id,
      full_name: form.full_name,
      phone: form.phone,
      email: email,
    });

    if (profileError) {
      setError('שגיאה ביצירת הפרופיל. אנא נסו שוב.');
      setLoading(false);
      return;
    }

    router.push('/game');
  };

  return (
    <div className="bg-forest min-h-screen flex items-center justify-center p-4">
      <FloatingParticles />
      <div className="w-full max-w-sm relative z-10 space-y-6">
        {/* Header icon */}
        <div className="flex justify-center">
          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl"
            animate={prefersReducedMotion ? undefined : { rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            ✨
          </motion.div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">השלימו את הפרופיל</h1>
          <p className="text-white/70">כמעט שם! רק עוד כמה פרטים</p>
        </div>

        {/* Form card */}
        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="full-name" className="sr-only">שם מלא</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-accent" aria-hidden="true">
                  👤
                </span>
                <input
                  id="full-name"
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="ישראל ישראלי"
                  className="rounded-xl bg-muted px-4 py-3 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="sr-only">טלפון</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-accent" aria-hidden="true">
                  📱
                </span>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="050-1234567"
                  className="rounded-xl bg-muted px-4 py-3 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label htmlFor="email" className="sr-only">אימייל</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-accent" aria-hidden="true">
                  ✉️
                </span>
                <input
                  id="email"
                  type="email"
                  disabled
                  value={email}
                  dir="ltr"
                  className="rounded-xl bg-muted px-4 py-3 w-full pr-10 opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full py-3 text-lg disabled:opacity-50"
            >
              {loading ? 'שומרים...' : 'המשך למשחק 🌿'}
            </button>
          </form>
        </div>

        {/* Logout link */}
        <p className="text-center text-white/70">
          <Link href="/login" className="text-primary font-medium underline">
            חזרה להתחברות
          </Link>
        </p>
      </div>
    </div>
  );
}
