'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { createClient } from '@/lib/supabase/client';

const FloatingParticles = dynamic(() => import('@/components/FloatingParticles'), { ssr: false });

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || '/game';
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/game';
  const prefersReducedMotion = useReducedMotion();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setError('אימייל או סיסמה שגויים');
      setLoading(false);
      return;
    }

    router.push(redirect);
  };

  return (
    <div className="bg-forest min-h-screen flex items-center justify-center p-4">
      <FloatingParticles />
      <div className="w-full max-w-sm relative z-10 space-y-6">
        {/* Otter mascot */}
        <div className="flex justify-center">
          <motion.div
            className="relative"
            animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Image
              src="https://images.unsplash.com/photo-1761117531132-bf2d8794ec6a?w=400&q=75"
              alt="otter mascot"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-[4px] border-accent shadow-lg shadow-accent/30"
            />
            <span className="absolute -top-2 -right-2 w-8 h-8 bg-orange rounded-full flex items-center justify-center text-sm">
              ✨
            </span>
          </motion.div>
        </div>

        <h1 className="text-3xl font-bold text-white text-center">כניסה למשחק</h1>

        {/* Form card */}
        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="sr-only">אימייל</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-accent" aria-hidden="true">✉️</span>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="example@email.com"
                  dir="ltr"
                  className="rounded-xl bg-muted px-4 py-3 w-full pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="sr-only">סיסמה</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-accent" aria-hidden="true">🔒</span>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="הסיסמה שלכם"
                  className="rounded-xl bg-muted px-4 py-3 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'מתחברים...' : 'כניסה'}
            </button>
          </form>
        </div>

        {/* Links */}
        <div className="text-center space-y-2">
          <Link href="/forgot-password" className="text-accent font-medium underline text-sm">
            שכחתם סיסמה?
          </Link>
          <p className="text-white/70">
            עדיין לא רשומים?{' '}
            <Link href="/register" className="text-primary font-medium underline">
              הירשמו כאן
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
