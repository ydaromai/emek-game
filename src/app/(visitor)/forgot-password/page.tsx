'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import FloatingParticles from '@/components/FloatingParticles';

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
    <div className="bg-forest min-h-screen flex items-center justify-center p-4">
      <FloatingParticles />
      <main className="w-full max-w-lg relative z-10">
        <div className="animate-fade-in space-y-6">
          <h1 className="text-3xl font-bold text-[#1a8a6e] text-center">שחזור סיסמה</h1>
          <div className="glass-card p-5">
            {sent ? (
              <div className="text-center space-y-3 py-4">
                <p className="text-lg text-deep-green">נשלח אליכם אימייל עם קישור לאיפוס הסיסמה</p>
                <p className="text-deep-green/50 text-sm">בדקו גם בתיקיית הספאם</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="w-full">
                  <label htmlFor="email" className="block text-sm font-medium text-deep-green mb-1">
                    אימייל
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                    className="bg-[#f0f7f0] rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-[#4ecdc4] text-lg min-h-[44px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient w-full min-h-[44px] px-6 py-3 text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-turquoise focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
                >
                  {loading ? 'שולחים...' : 'שלחו קישור'}
                </button>
              </form>
            )}
          </div>
          <p className="text-center">
            <Link href="/login" className="text-turquoise underline">חזרה לכניסה</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
