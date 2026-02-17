'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PageShell from '@/components/ui/PageShell';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
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

    // Verify admin/staff role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('שגיאה באימות');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'staff'].includes(profile.role)) {
      await supabase.auth.signOut();
      setError('אין לך הרשאות גישה לממשק הניהול');
      setLoading(false);
      return;
    }

    router.push('/admin/dashboard');
  };

  return (
    <PageShell className="flex flex-col items-center justify-center">
      <div className="animate-fade-in space-y-6 w-full max-w-sm">
        <h1 className="text-3xl font-bold text-deep-green text-center">ניהול - כניסה</h1>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="אימייל"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@example.com"
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
      </div>
    </PageShell>
  );
}
