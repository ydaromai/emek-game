'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { createClient } from '@/lib/supabase/client';

const FloatingParticles = dynamic(() => import('@/components/FloatingParticles'), { ssr: false });

const inputFields: ReadonlyArray<{
  key: 'full_name' | 'phone' | 'email' | 'password';
  type: string;
  icon: string;
  placeholder: string;
  label: string;
  dir?: 'ltr' | 'rtl';
}> = [
  { key: 'full_name', type: 'text', icon: '👤', placeholder: 'ישראל ישראלי', label: 'שם מלא' },
  { key: 'phone', type: 'tel', icon: '📱', placeholder: '050-1234567', label: 'טלפון' },
  { key: 'email', type: 'email', icon: '✉️', placeholder: 'example@email.com', label: 'אימייל', dir: 'ltr' },
  { key: 'password', type: 'password', icon: '🔒', placeholder: 'לפחות 8 תווים', label: 'סיסמה' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (form.password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          phone: form.phone,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('כתובת האימייל כבר רשומה במערכת');
      } else {
        setError('שגיאה בהרשמה. אנא נסו שוב.');
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
      });

      if (profileError) {
        setError('שגיאה ביצירת הפרופיל. אנא נסו שוב.');
        setLoading(false);
        return;
      }

      router.push('/game');
    }
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
            🌲
          </motion.div>
        </div>

        <h1 className="text-3xl font-bold text-white text-center">הרשמה למשחק</h1>

        {/* Form card */}
        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {inputFields.map((field, index) => (
              <motion.div
                key={field.key}
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <label htmlFor={`reg-${field.key}`} className="sr-only">{field.label}</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-accent" aria-hidden="true">
                    {field.icon}
                  </span>
                  <input
                    id={`reg-${field.key}`}
                    type={field.type}
                    required
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    dir={field.dir}
                    className="rounded-xl bg-muted px-4 py-3 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                {field.key === 'password' && form.password.length > 0 && form.password.length < 8 && (
                  <p className="text-red-500 text-xs mt-1" role="alert">הסיסמה חייבת להכיל לפחות 8 תווים</p>
                )}
              </motion.div>
            ))}

            {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient w-full py-3 text-lg disabled:opacity-50"
            >
              {loading ? 'נרשמים...' : 'הרשמה 🌿'}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-white/70">
          כבר רשומים?{' '}
          <Link href="/login" className="text-primary font-medium underline">
            התחברו כאן
          </Link>
        </p>
      </div>
    </div>
  );
}
