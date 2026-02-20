'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export default function CreateTenantPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', slug: '', contact_email: '' });
  const [slugManual, setSlugManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugManual ? prev.slug : slugify(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/super-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'שגיאה ביצירת הדייר');
        return;
      }

      router.push(`/super-admin/tenants/${data.tenant.id}`);
    } catch {
      setError('שגיאה בלתי צפויה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-deep-green">צור דייר חדש</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="שם הדייר"
            required
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="פארק המעיינות"
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-deep-green mb-1">Slug</label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true);
                setForm((prev) => ({ ...prev, slug: e.target.value }));
              }}
              placeholder="park-hamaayanot"
              dir="ltr"
              className="w-full min-h-[44px] px-4 py-3 rounded-xl border-2 border-deep-green/20 bg-white text-nature-text font-mono text-sm focus:outline-none focus:ring-2 focus:ring-turquoise focus:border-turquoise"
            />
            <p className="mt-1 text-xs text-deep-green/50">
              אותיות קטנות באנגלית, מספרים ומקפים בלבד. ישמש ככתובת: {form.slug || 'slug'}.realife.co.il
            </p>
          </div>

          <Input
            label="אימייל ליצירת קשר"
            type="email"
            value={form.contact_email}
            onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))}
            placeholder="contact@park.co.il"
            dir="ltr"
          />

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="secondary" isLoading={loading} className="text-base px-4 py-2">
              צור דייר
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/super-admin/tenants')}
              className="text-base px-4 py-2"
            >
              ביטול
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
