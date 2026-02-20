'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { TenantBranding } from '@/types/database';

const COLOR_FIELDS: { key: keyof TenantBranding; label: string }[] = [
  { key: 'primary', label: 'ראשי' },
  { key: 'accent', label: 'הדגשה' },
  { key: 'background', label: 'רקע' },
  { key: 'text', label: 'טקסט' },
  { key: 'error', label: 'שגיאה' },
  { key: 'success', label: 'הצלחה' },
];

interface TenantData {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  is_active: boolean;
  branding: TenantBranding;
  created_at: string;
  updated_at: string;
}

export default function EditTenantPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTenant = useCallback(async () => {
    try {
      const res = await fetch(`/api/super-admin/tenants/${params.id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setTenant(data.tenant);
    } catch {
      setError('דייר לא נמצא');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch(`/api/super-admin/tenants/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tenant.name,
          slug: tenant.slug,
          contact_email: tenant.contact_email,
          branding: tenant.branding,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה בשמירה');
        return;
      }

      setTenant(data.tenant);
      setSuccess('נשמר בהצלחה');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('שגיאה בלתי צפויה');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!tenant) return;
    const action = tenant.is_active ? 'להשעות' : 'להפעיל';
    if (!confirm(`האם אתה בטוח שברצונך ${action} את הדייר "${tenant.name}"?`)) return;

    try {
      const res = await fetch(`/api/super-admin/tenants/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !tenant.is_active }),
      });

      if (res.ok) {
        const data = await res.json();
        setTenant(data.tenant);
      }
    } catch {
      setError('שגיאה בעדכון הסטטוס');
    }
  };

  const updateBranding = (key: keyof TenantBranding, value: string) => {
    if (!tenant) return;
    setTenant({
      ...tenant,
      branding: { ...tenant.branding, [key]: value },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-deep-green/60 text-lg">טוען...</div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-error text-lg">{error || 'דייר לא נמצא'}</p>
        <Button onClick={() => router.push('/super-admin/tenants')} variant="outline" className="mt-4">
          חזרה לרשימה
        </Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-deep-green">עריכת דייר</h1>
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
          tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {tenant.is_active ? 'פעיל' : 'מושעה'}
        </span>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="שם הדייר"
            required
            value={tenant.name}
            onChange={(e) => setTenant({ ...tenant, name: e.target.value })}
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-deep-green mb-1">Slug</label>
            <input
              type="text"
              required
              value={tenant.slug}
              onChange={(e) => setTenant({ ...tenant, slug: e.target.value })}
              dir="ltr"
              className="w-full min-h-[44px] px-4 py-3 rounded-xl border-2 border-deep-green/20 bg-white text-nature-text font-mono text-sm focus:outline-none focus:ring-2 focus:ring-turquoise focus:border-turquoise"
            />
          </div>

          <Input
            label="אימייל ליצירת קשר"
            type="email"
            value={tenant.contact_email || ''}
            onChange={(e) => setTenant({ ...tenant, contact_email: e.target.value })}
            dir="ltr"
          />

          {/* Branding colors */}
          <div>
            <h3 className="text-sm font-semibold text-deep-green mb-3">צבעי מיתוג</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COLOR_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(tenant.branding[key] as string) || '#000000'}
                    onChange={(e) => updateBranding(key, e.target.value)}
                    className="w-10 h-10 rounded-lg border-2 border-deep-green/20 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-medium text-deep-green">{label}</span>
                    <span className="block text-xs text-deep-green/50 font-mono" dir="ltr">
                      {(tenant.branding[key] as string) || ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-error text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="secondary" isLoading={saving} className="text-base px-4 py-2">
              שמור שינויים
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/super-admin/tenants')}
              className="text-base px-4 py-2"
            >
              חזרה
            </Button>
          </div>
        </form>
      </Card>

      {/* Danger zone */}
      <Card className="border-error/30">
        <h3 className="text-sm font-bold text-error mb-3">אזור מסוכן</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-deep-green/70">
            {tenant.is_active
              ? 'השעיית הדייר תמנע גישה מכל המשתמשים'
              : 'הפעלת הדייר תחזיר גישה לכל המשתמשים'}
          </p>
          <Button
            type="button"
            variant={tenant.is_active ? 'outline' : 'secondary'}
            onClick={handleToggleActive}
            className={`text-sm px-3 py-1 ${tenant.is_active ? 'border-error text-error hover:bg-error/5' : ''}`}
          >
            {tenant.is_active ? 'השעה דייר' : 'הפעל דייר'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
