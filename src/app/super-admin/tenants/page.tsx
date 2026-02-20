'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  users_count: number;
  completion_rate: number;
  created_at: string;
}

export default function SuperAdminTenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch('/api/super-admin/tenants');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch {
      console.error('Failed to fetch tenants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleToggleActive = async (id: string, currentlyActive: boolean) => {
    setToggleLoading(id);
    try {
      const res = await fetch(`/api/super-admin/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentlyActive }),
      });
      if (res.ok) {
        await fetchTenants();
      }
    } catch {
      alert('שגיאה בעדכון הסטטוס');
    } finally {
      setToggleLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-deep-green/60 text-lg">טוען...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-deep-green">ניהול דיירים</h1>
        <Button
          onClick={() => router.push('/super-admin/tenants/new')}
          variant="secondary"
          className="text-base px-4 py-2"
        >
          + צור דייר חדש
        </Button>
      </div>

      {/* Search */}
      <Card>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפש לפי שם או slug..."
          className="w-full min-h-[44px] px-4 py-2 rounded-xl border-2 border-deep-green/20 bg-white text-nature-text focus:outline-none focus:ring-2 focus:ring-turquoise focus:border-turquoise text-sm"
        />
      </Card>

      {/* Tenants table */}
      <Card className="overflow-x-auto">
        {filteredTenants.length === 0 ? (
          <p className="text-deep-green/60 text-center py-8">לא נמצאו דיירים</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-deep-green/10">
                <th className="text-right py-3 px-3 font-semibold text-deep-green">שם</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">Slug</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">סטטוס</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">משתמשים</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">השלמה</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">תאריך</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-deep-green/5 hover:bg-sand/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/super-admin/tenants/${t.id}`)}
                >
                  <td className="py-3 px-3 font-medium text-nature-text">{t.name}</td>
                  <td className="py-3 px-3 text-nature-text/70 font-mono text-xs" dir="ltr">{t.slug}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      t.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {t.is_active ? 'פעיל' : 'מושעה'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-nature-text">{t.users_count}</td>
                  <td className="py-3 px-3 text-nature-text">{t.completion_rate}%</td>
                  <td className="py-3 px-3 text-nature-text/70">{formatDate(t.created_at)}</td>
                  <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleActive(t.id, t.is_active)}
                      disabled={toggleLoading === t.id}
                      className={`text-xs font-medium hover:underline disabled:opacity-50 min-h-[44px] min-w-[44px] ${
                        t.is_active ? 'text-error' : 'text-green-600'
                      }`}
                    >
                      {toggleLoading === t.id ? '...' : t.is_active ? 'השעה' : 'הפעל'}
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
