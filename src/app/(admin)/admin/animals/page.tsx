'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTenant } from '@/components/TenantProvider';

interface AnimalRow {
  id: string;
  name_he: string;
  letter: string;
  order_index: number;
  is_active: boolean;
  qr_token: string;
}

export default function AdminAnimalsPage() {
  const { id: tenantId } = useTenant();
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnimals(); }, [tenantId]);

  async function loadAnimals() {
    const supabase = createClient();
    const { data } = await supabase
      .from('animals')
      .select('id, name_he, letter, order_index, is_active, qr_token')
      .eq('tenant_id', tenantId)
      .order('order_index');
    setAnimals(data || []);
    setLoading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from('animals').update({ is_active: !current }).eq('id', id).eq('tenant_id', tenantId);
    setAnimals((prev) => prev.map((a) => a.id === id ? { ...a, is_active: !current } : a));
  }

  function downloadQR(animal: AnimalRow) {
    const url = `${window.location.origin}/scan/${animal.qr_token}`;
    // Simple text-based QR download — real QR generation in TASK 7.1
    const blob = new Blob([`QR URL for ${animal.name_he}: ${url}`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${animal.order_index}-${animal.name_he}.txt`;
    a.click();
  }

  if (loading) return <p className="text-center py-10 text-deep-green/50">טוען...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-deep-green">תחנות חיות</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-deep-green/10 text-deep-green/70">
                <th className="text-right py-2 px-2">#</th>
                <th className="text-right py-2 px-2">שם</th>
                <th className="text-right py-2 px-2">אות</th>
                <th className="text-right py-2 px-2">פעיל</th>
                <th className="text-right py-2 px-2">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {animals.map((a) => (
                <tr key={a.id} className="border-b border-deep-green/5">
                  <td className="py-2 px-2">{a.order_index}</td>
                  <td className="py-2 px-2">{a.name_he}</td>
                  <td className="py-2 px-2 font-bold text-lg">{a.letter}</td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => toggleActive(a.id, a.is_active)}
                      className={`px-2 py-1 rounded-full text-xs min-h-[32px] ${a.is_active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
                    >
                      {a.is_active ? 'פעיל' : 'לא פעיל'}
                    </button>
                  </td>
                  <td className="py-2 px-2 space-x-2 space-x-reverse">
                    <Link href={`/admin/animals/${a.id}/edit`} className="text-turquoise underline text-xs">עריכה</Link>
                    <button onClick={() => downloadQR(a)} className="text-deep-green/50 underline text-xs">QR</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
