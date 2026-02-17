'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({ name_he: '', fun_facts: '', letter: '', order_index: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAnimal();
  }, []);

  async function loadAnimal() {
    const supabase = createClient();
    const { data } = await supabase.from('animals').select('*').eq('id', id).single();
    if (data) {
      setForm({
        name_he: data.name_he,
        fun_facts: data.fun_facts,
        letter: data.letter,
        order_index: data.order_index,
      });
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    await supabase.from('animals').update(form).eq('id', id);
    setSaving(false);
    router.push('/admin/animals');
  }

  if (loading) return <p className="text-center py-10">טוען...</p>;

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-2xl font-bold text-deep-green">עריכת תחנה</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="שם בעברית" value={form.name_he} onChange={(e) => setForm({ ...form, name_he: e.target.value })} required />
          <Input label="אות" value={form.letter} onChange={(e) => setForm({ ...form, letter: e.target.value })} maxLength={1} required />
          <Input label="מיקום" type="number" value={String(form.order_index)} onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })} required />
          <div>
            <label className="block text-sm font-medium text-deep-green mb-1">עובדות</label>
            <textarea
              value={form.fun_facts}
              onChange={(e) => setForm({ ...form, fun_facts: e.target.value })}
              className="w-full min-h-[100px] px-4 py-3 rounded-xl border-2 border-deep-green/20 bg-white text-nature-text"
              required
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? 'שומר...' : 'שמירה'}</Button>
            <Button variant="outline" type="button" onClick={() => router.back()}>ביטול</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
