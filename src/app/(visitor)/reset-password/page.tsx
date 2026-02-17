'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PageShell from '@/components/ui/PageShell';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      return;
    }
    if (password !== confirm) {
      setError('הסיסמאות לא תואמות');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError('שגיאה בעדכון הסיסמה. אנא נסו שוב.');
      setLoading(false);
      return;
    }

    router.push('/game');
  };

  return (
    <PageShell>
      <div className="animate-fade-in space-y-6">
        <h1 className="text-3xl font-bold text-deep-green text-center">סיסמה חדשה</h1>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="סיסמה חדשה" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="לפחות 8 תווים" />
            <Input label="אישור סיסמה" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="הקלידו שוב" />
            {error && <p className="text-error text-sm">{error}</p>}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'מעדכנים...' : 'עדכון סיסמה'}
            </Button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
