'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface SiteContentRow {
  id: string;
  content_key: string;
  content_value: string;
  description: string | null;
}

interface RowFeedback {
  type: 'success' | 'error';
  message: string;
}

export default function AdminContentPage() {
  const [rows, setRows] = useState<SiteContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Record<string, RowFeedback>>({});

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_content')
      .select('id, content_key, content_value, description')
      .order('content_key');
    setRows(data || []);
    const initial: Record<string, string> = {};
    (data || []).forEach((row: SiteContentRow) => {
      initial[row.id] = row.content_value;
    });
    setEditedValues(initial);
    setLoading(false);
  }

  async function handleSave(row: SiteContentRow) {
    const content_value = editedValues[row.id];
    setSavingIds((prev) => new Set(prev).add(row.id));
    setFeedback((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });

    const supabase = createClient();
    const { error } = await supabase
      .from('site_content')
      .update({ content_value })
      .eq('id', row.id);

    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(row.id);
      return next;
    });

    if (error) {
      setFeedback((prev) => ({ ...prev, [row.id]: { type: 'error', message: 'שמירה נכשלה' } }));
    } else {
      setFeedback((prev) => ({ ...prev, [row.id]: { type: 'success', message: 'נשמר בהצלחה' } }));
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, content_value } : r))
      );
    }

    // Clear feedback after 3 seconds
    setTimeout(() => {
      setFeedback((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
    }, 3000);
  }

  if (loading) return <p className="text-center py-10 text-deep-green/50">טוען...</p>;

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-deep-green">תוכן האתר</h1>
        <Card>
          <p className="text-center text-deep-green/50 py-6">אין תוכן להצגה</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-deep-green">תוכן האתר</h1>
      {rows.map((row) => (
        <Card key={row.id}>
          <div className="space-y-3">
            <div>
              <span className="font-bold text-deep-green">{row.content_key}</span>
              {row.description && (
                <p className="text-sm text-deep-green/50 mt-1">{row.description}</p>
              )}
            </div>
            <textarea
              value={editedValues[row.id] ?? row.content_value}
              onChange={(e) =>
                setEditedValues((prev) => ({ ...prev, [row.id]: e.target.value }))
              }
              className="w-full min-h-[100px] px-4 py-3 rounded-xl border-2 border-deep-green/20 bg-white text-nature-text"
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                disabled={savingIds.has(row.id)}
                onClick={() => handleSave(row)}
              >
                {savingIds.has(row.id) ? 'שומר...' : 'שמירה'}
              </Button>
              {feedback[row.id] && (
                <span
                  className={`text-sm font-medium ${
                    feedback[row.id].type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {feedback[row.id].message}
                </span>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
