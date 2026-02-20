'use client';

import { useEffect, useState, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Membership {
  user_id: string;
  tenant_id: string;
  role: 'admin' | 'staff';
  created_at: string;
  email: string;
  tenant_name: string;
}

interface Tenant {
  id: string;
  name: string;
}

export default function SuperAdminMembersPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTenant, setFilterTenant] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', tenant_id: '', role: 'staff' as 'admin' | 'staff' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [revokeLoading, setRevokeLoading] = useState<string | null>(null);

  const fetchMemberships = useCallback(async () => {
    try {
      const res = await fetch('/api/super-admin/members');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMemberships(data.memberships || []);
      setTenants(data.tenants || []);
    } catch {
      console.error('Failed to fetch memberships');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviteLoading(true);

    try {
      const res = await fetch('/api/super-admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error || 'שגיאה ביצירת החברות');
        return;
      }

      setInviteSuccess('החבר נוסף בהצלחה');
      setInviteForm({ email: '', tenant_id: '', role: 'staff' });
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess('');
      }, 1500);
      await fetchMemberships();
    } catch {
      setInviteError('שגיאה בלתי צפויה');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevoke = async (userId: string, tenantId: string) => {
    const key = `${userId}-${tenantId}`;
    if (!confirm('האם אתה בטוח שברצונך לבטל את החברות?')) return;

    setRevokeLoading(key);
    try {
      const res = await fetch(`/api/super-admin/members/${userId}?tenant_id=${tenantId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'שגיאה בביטול החברות');
        return;
      }

      await fetchMemberships();
    } catch {
      alert('שגיאה בלתי צפויה');
    } finally {
      setRevokeLoading(null);
    }
  };

  const filteredMemberships = filterTenant
    ? memberships.filter((m) => m.tenant_id === filterTenant)
    : memberships;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const roleLabel = (role: string) => {
    return role === 'admin' ? 'מנהל' : 'צוות';
  };

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
        <h1 className="text-2xl font-bold text-deep-green">ניהול חברים</h1>
        <Button onClick={() => setShowInviteModal(true)} variant="secondary" className="text-base px-4 py-2">
          + הזמן מנהל
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-deep-green whitespace-nowrap">סנן לפי דייר:</label>
          <select
            value={filterTenant}
            onChange={(e) => setFilterTenant(e.target.value)}
            className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-deep-green/20 bg-white text-nature-text focus:outline-none focus:ring-2 focus:ring-turquoise focus:border-turquoise text-sm flex-1 max-w-xs"
          >
            <option value="">הכל</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Members table */}
      <Card className="overflow-x-auto">
        {filteredMemberships.length === 0 ? (
          <p className="text-deep-green/60 text-center py-8">לא נמצאו חברים</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-deep-green/10">
                <th className="text-right py-3 px-3 font-semibold text-deep-green">אימייל</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">דייר</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">תפקיד</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">תאריך שיוך</th>
                <th className="text-right py-3 px-3 font-semibold text-deep-green">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredMemberships.map((m) => (
                <tr key={`${m.user_id}-${m.tenant_id}`} className="border-b border-deep-green/5 hover:bg-sand/30 transition-colors">
                  <td className="py-3 px-3 text-nature-text" dir="ltr">{m.email}</td>
                  <td className="py-3 px-3 text-nature-text">{m.tenant_name}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      m.role === 'admin'
                        ? 'bg-turquoise/15 text-turquoise'
                        : 'bg-deep-green/10 text-deep-green'
                    }`}>
                      {roleLabel(m.role)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-nature-text/70">{formatDate(m.created_at)}</td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => handleRevoke(m.user_id, m.tenant_id)}
                      disabled={revokeLoading === `${m.user_id}-${m.tenant_id}`}
                      className="text-error text-xs font-medium hover:underline disabled:opacity-50 min-h-[44px] min-w-[44px]"
                    >
                      {revokeLoading === `${m.user_id}-${m.tenant_id}` ? 'מבטל...' : 'ביטול'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowInviteModal(false)}>
          <Card className="w-full max-w-md" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-deep-green mb-4">הזמנת חבר חדש</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <Input
                label="אימייל"
                type="email"
                required
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="user@example.com"
                dir="ltr"
              />

              <div className="w-full">
                <label className="block text-sm font-medium text-deep-green mb-1">דייר</label>
                <select
                  required
                  value={inviteForm.tenant_id}
                  onChange={(e) => setInviteForm({ ...inviteForm, tenant_id: e.target.value })}
                  className="w-full min-h-[44px] px-4 py-3 rounded-xl border-2 border-deep-green/20 bg-white text-nature-text focus:outline-none focus:ring-2 focus:ring-turquoise focus:border-turquoise text-lg"
                >
                  <option value="">בחר דייר</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="w-full">
                <label className="block text-sm font-medium text-deep-green mb-1">תפקיד</label>
                <select
                  required
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'staff' })}
                  className="w-full min-h-[44px] px-4 py-3 rounded-xl border-2 border-deep-green/20 bg-white text-nature-text focus:outline-none focus:ring-2 focus:ring-turquoise focus:border-turquoise text-lg"
                >
                  <option value="staff">צוות</option>
                  <option value="admin">מנהל</option>
                </select>
              </div>

              {inviteError && <p className="text-error text-sm">{inviteError}</p>}
              {inviteSuccess && <p className="text-green-600 text-sm">{inviteSuccess}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="secondary" disabled={inviteLoading} className="text-base px-4 py-2">
                  {inviteLoading ? 'שולח...' : 'הזמן'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                  className="text-base px-4 py-2"
                >
                  ביטול
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
