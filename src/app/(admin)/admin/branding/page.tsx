'use client';

import { useEffect, useState, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { TenantBranding } from '@/types/database';

const COLOR_FIELDS: { key: keyof TenantBranding; label: string; pairedWith?: keyof TenantBranding }[] = [
  { key: 'primary', label: 'צבע ראשי', pairedWith: 'background' },
  { key: 'accent', label: 'צבע הדגשה', pairedWith: 'background' },
  { key: 'background', label: 'צבע רקע' },
  { key: 'text', label: 'צבע טקסט', pairedWith: 'background' },
  { key: 'error', label: 'צבע שגיאה', pairedWith: 'background' },
  { key: 'success', label: 'צבע הצלחה', pairedWith: 'background' },
];

const DEFAULT_BRANDING: TenantBranding = {
  primary: '#1a8a6e',
  accent: '#4ecdc4',
  background: '#f0f7f0',
  text: '#1a2e1a',
  error: '#d4183d',
  success: '#2E7D32',
  logo_url: null,
  bg_image_url: null,
  font_family: null,
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return 0;
  const l1 = relativeLuminance(c1.r, c1.g, c1.b);
  const l2 = relativeLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function BrandingEditorPage() {
  const [branding, setBranding] = useState<TenantBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBranding = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/branding');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setBranding({ ...DEFAULT_BRANDING, ...data.branding });
    } catch {
      console.error('Failed to fetch branding');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch('/api/admin/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branding }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'שגיאה בשמירה');
        return;
      }

      setSuccess('המיתוג נשמר בהצלחה! רענן את הדף לראות את השינויים');
      setTimeout(() => setSuccess(''), 5000);
    } catch {
      setError('שגיאה בלתי צפויה');
    } finally {
      setSaving(false);
    }
  };

  const updateColor = (key: keyof TenantBranding, value: string) => {
    setBranding((prev) => ({ ...prev, [key]: value }));
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-deep-green">עורך מיתוג</h1>
        <Button onClick={handleSave} variant="secondary" isLoading={saving} className="text-base px-4 py-2">
          שמור שינויים
        </Button>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color pickers */}
        <Card>
          <h2 className="text-lg font-semibold text-deep-green mb-4">צבעים</h2>
          <div className="space-y-4">
            {COLOR_FIELDS.map(({ key, label, pairedWith }) => {
              const colorValue = (branding[key] as string) || '#000000';
              const ratio = pairedWith ? contrastRatio(colorValue, (branding[pairedWith] as string) || '#ffffff') : null;
              const passesAA = ratio === null || ratio >= 4.5;

              return (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(e) => updateColor(key, e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-deep-green/20 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-deep-green">{label}</span>
                      {ratio !== null && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          passesAA ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {passesAA ? 'AA' : `${ratio.toFixed(1)}:1`}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-deep-green/50 font-mono" dir="ltr">{colorValue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Live preview */}
        <Card>
          <h2 className="text-lg font-semibold text-deep-green mb-4">תצוגה מקדימה</h2>
          <div
            className="rounded-xl p-4 space-y-3 min-h-[300px]"
            style={{ backgroundColor: branding.background }}
          >
            {/* Mini landing page preview */}
            <div className="text-center space-y-2">
              <div
                className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center text-2xl"
                style={{ background: `linear-gradient(135deg, ${branding.primary}, ${branding.accent})` }}
              >
                🌲
              </div>
              <h3
                className="text-xl font-bold"
                style={{ color: branding.text }}
              >
                שם הפארק
              </h3>
              <p
                className="text-sm"
                style={{ color: branding.accent }}
              >
                מסע חיות הבר
              </p>
            </div>

            {/* Button preview */}
            <button
              className="w-full py-2 rounded-xl text-white font-medium text-sm"
              style={{ background: `linear-gradient(to left, ${branding.accent}, ${branding.primary})` }}
            >
              הרשמה למשחק
            </button>

            {/* Card preview */}
            <div className="bg-white/80 rounded-xl p-3 space-y-1">
              <p className="text-xs" style={{ color: branding.text }}>
                ברוכים הבאים למשחק
              </p>
              <p className="text-xs" style={{ color: branding.success }}>
                הצלחה!
              </p>
              <p className="text-xs" style={{ color: branding.error }}>
                שגיאה
              </p>
            </div>

            {/* Progress preview */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs" style={{ color: branding.text }}>
                <span>תחנות</span>
                <span>3 מתוך 5</span>
              </div>
              <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: '60%',
                    background: `linear-gradient(to left, ${branding.primary}, ${branding.accent})`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
