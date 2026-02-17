'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import PageShell from '@/components/ui/PageShell';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <PageShell>
      <div className="space-y-6">
        <h1 className="animate-enter-1 text-3xl font-bold text-deep-green text-center">הרשמה למשחק</h1>
        <Card className="animate-enter-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="שם מלא"
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="ישראל ישראלי"
            />
            <Input
              label="טלפון"
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="050-1234567"
            />
            <Input
              label="אימייל"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="example@email.com"
              dir="ltr"
            />
            <Input
              label="סיסמה"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="לפחות 8 תווים"
              error={form.password.length > 0 && form.password.length < 8 ? 'הסיסמה חייבת להכיל לפחות 8 תווים' : undefined}
            />
            {error && <p className="text-error text-sm">{error}</p>}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'נרשמים...' : 'הרשמה'}
            </Button>
          </form>
        </Card>
        <p className="animate-enter-3 text-center text-deep-green/70">
          כבר רשומים?{' '}
          <Link href="/login" className="text-turquoise font-medium underline">
            התחברו כאן
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
