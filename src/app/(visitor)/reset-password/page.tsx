'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import FloatingParticles from '@/components/FloatingParticles';

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
    <div className="bg-forest min-h-screen flex items-center justify-center p-4">
      <FloatingParticles />
      <main className="w-full max-w-lg relative z-10">
        <div className="animate-fade-in space-y-6">
          <h1 className="text-3xl font-bold text-[#1a8a6e] text-center">סיסמה חדשה</h1>
          <div className="glass-card p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="w-full">
                <label htmlFor="password" className="block text-sm font-medium text-deep-green mb-1">
                  סיסמה חדשה
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="לפחות 8 תווים"
                  className="bg-[#f0f7f0] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#4ecdc4] text-lg min-h-[44px]"
                />
              </div>
              <div className="w-full">
                <label htmlFor="confirm" className="block text-sm font-medium text-deep-green mb-1">
                  אישור סיסמה
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="הקלידו שוב"
                  className="bg-[#f0f7f0] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#4ecdc4] text-lg min-h-[44px]"
                />
              </div>
              {error && <p className="text-error text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full min-h-[44px] px-6 py-3 text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-turquoise focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
              >
                {loading ? 'מעדכנים...' : 'עדכון סיסמה'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
