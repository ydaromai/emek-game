'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import PageShell from '@/components/ui/PageShell';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

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
  const redirect = searchParams.get('redirect') || '/game';
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
    <PageShell>
      <div className="animate-fade-in space-y-6">
        <h1 className="text-3xl font-bold text-deep-green text-center">כניסה למשחק</h1>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="הסיסמה שלכם"
            />
            {error && <p className="text-error text-sm">{error}</p>}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'מתחברים...' : 'כניסה'}
            </Button>
          </form>
        </Card>
        <div className="text-center space-y-2">
          <Link href="/forgot-password" className="text-turquoise font-medium underline text-sm">
            שכחתם סיסמה?
          </Link>
          <p className="text-deep-green/70">
            עדיין לא רשומים?{' '}
            <Link href="/register" className="text-turquoise font-medium underline">
              הירשמו כאן
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
