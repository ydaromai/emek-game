'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';

interface TenantStat {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  users: number;
  completed: number;
  completion_rate: number;
}

interface Totals {
  tenants: number;
  active_tenants: number;
  suspended_tenants: number;
  total_users: number;
  total_completed: number;
}

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [totals, setTotals] = useState<Totals | null>(null);
  const [tenantStats, setTenantStats] = useState<TenantStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/super-admin/analytics');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTotals(data.totals);
      setTenantStats(data.tenants || []);
    } catch {
      console.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-deep-green/60 text-lg">טוען...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      <h1 className="text-2xl font-bold text-deep-green">לוח בקרה</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-deep-green/60">דיירים פעילים</p>
          <p className="text-3xl font-bold text-turquoise">{totals?.active_tenants || 0}</p>
          {(totals?.suspended_tenants || 0) > 0 && (
            <p className="text-xs text-deep-green/40">{totals?.suspended_tenants} מושעים</p>
          )}
        </Card>
        <Card>
          <p className="text-sm text-deep-green/60">סה&quot;כ דיירים</p>
          <p className="text-3xl font-bold text-deep-green">{totals?.tenants || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-deep-green/60">סה&quot;כ משתמשים</p>
          <p className="text-3xl font-bold text-deep-green">{totals?.total_users || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-deep-green/60">סה&quot;כ השלמות</p>
          <p className="text-3xl font-bold text-green-600">{totals?.total_completed || 0}</p>
        </Card>
      </div>

      {/* Tenants table */}
      <Card className="overflow-x-auto">
        <h2 className="text-lg font-semibold text-deep-green mb-4">פירוט לפי דייר</h2>
        {tenantStats.length === 0 ? (
          <p className="text-deep-green/60 text-center py-8">אין דיירים</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-deep-green/10">
                <th className="text-right py-3 px-3 font-semibold text-deep-green">שם</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">סטטוס</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">משתמשים</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">השלמות</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">אחוז השלמה</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {tenantStats.map((t) => (
                <tr key={t.id} className="border-b border-deep-green/5 hover:bg-sand/30 transition-colors">
                  <td className="py-3 px-3 font-medium text-nature-text">{t.name}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      t.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {t.is_active ? 'פעיל' : 'מושעה'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-nature-text">{t.users}</td>
                  <td className="py-3 px-3 text-nature-text">{t.completed}</td>
                  <td className="py-3 px-3 text-nature-text">{t.completion_rate}%</td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => router.push(`/super-admin/tenants/${t.id}`)}
                      className="text-turquoise text-xs font-medium hover:underline min-h-[44px] min-w-[44px]"
                    >
                      ניהול
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
