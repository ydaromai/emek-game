'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useTenant } from '@/components/TenantProvider';

interface VerifyResult {
  status: 'valid' | 'redeemed' | 'not_found';
  userName?: string;
  redeemedAt?: string;
  code?: string;
}

export default function VerifyPrizePage() {
  const { id: tenantId } = useTenant();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const supabase = createClient();
    const { data: redemption } = await supabase
      .from('redemptions')
      .select('*, profiles(full_name)')
      .eq('redemption_code', code.toUpperCase().trim())
      .eq('tenant_id', tenantId)
      .single();

    if (!redemption) {
      setResult({ status: 'not_found' });
    } else if (redemption.redeemed) {
      setResult({
        status: 'redeemed',
        userName: (redemption.profiles as { full_name: string })?.full_name,
        redeemedAt: new Date(redemption.redeemed_at).toLocaleString('he-IL'),
      });
    } else {
      setResult({
        status: 'valid',
        userName: (redemption.profiles as { full_name: string })?.full_name,
        code: redemption.redemption_code,
      });
    }
    setLoading(false);
  }

  async function handleRedeem() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from('redemptions')
      .update({ redeemed: true, redeemed_at: new Date().toISOString() })
      .eq('redemption_code', code.toUpperCase().trim())
      .eq('tenant_id', tenantId);

    setResult({
      status: 'redeemed',
      userName: result?.userName,
      redeemedAt: new Date().toLocaleString('he-IL'),
    });
    setLoading(false);
  }

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-bold text-deep-green">אימות פרס</h1>

      <Card>
        <form onSubmit={handleVerify} className="space-y-3">
          <Input
            label="קוד מימוש"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="הכניסו את הקוד"
            dir="ltr"
          />
          <Button type="submit" fullWidth disabled={loading || !code.trim()}>
            {loading ? 'בודקים...' : 'אימות'}
          </Button>
        </form>
      </Card>

      {result && (
        <Card>
          {result.status === 'not_found' && (
            <div className="text-center py-4">
              <p className="text-xl font-bold text-error">קוד לא נמצא</p>
              <p className="text-deep-green/50 mt-1">הקוד שהוזן אינו קיים במערכת</p>
            </div>
          )}
          {result.status === 'redeemed' && (
            <div className="text-center py-4">
              <p className="text-xl font-bold text-deep-green/70">כבר מומש</p>
              <p className="text-deep-green/50 mt-1">שם: {result.userName}</p>
              <p className="text-deep-green/50">מומש ב: {result.redeemedAt}</p>
            </div>
          )}
          {result.status === 'valid' && (
            <div className="text-center py-4 space-y-3">
              <p className="text-xl font-bold text-success">קוד תקין!</p>
              <p className="text-deep-green/70">שם: {result.userName}</p>
              <Button onClick={handleRedeem} fullWidth disabled={loading}>
                סימון כמומש
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
