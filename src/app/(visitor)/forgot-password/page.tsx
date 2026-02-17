'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import PageShell from '@/components/ui/PageShell';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <PageShell>
      <div className="animate-fade-in space-y-6">
        <h1 className="text-3xl font-bold text-deep-green text-center">שחזור סיסמה</h1>
        <Card>
          {sent ? (
            <div className="text-center space-y-3 py-4">
              <p className="text-lg text-deep-green">נשלח אליכם אימייל עם קישור לאיפוס הסיסמה</p>
              <p className="text-deep-green/50 text-sm">בדקו גם בתיקיית הספאם</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="אימייל" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? 'שולחים...' : 'שלחו קישור'}
              </Button>
            </form>
          )}
        </Card>
        <p className="text-center">
          <Link href="/login" className="text-turquoise underline">חזרה לכניסה</Link>
        </p>
      </div>
    </PageShell>
  );
}
