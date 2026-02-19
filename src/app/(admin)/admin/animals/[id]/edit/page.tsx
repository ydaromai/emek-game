'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { getIllustration } from '@/components/illustrations';

const illustrationOptions = [
  { value: '', label: 'ללא' },
  { value: 'kingfisher', label: 'שלדג' },
  { value: 'otter', label: 'לוטרה' },
  { value: 'heron', label: 'אנפה' },
  { value: 'turtle', label: 'צב ביצות' },
  { value: 'frog', label: 'אילנית' },
  { value: 'crab', label: 'סרטן מים מתוקים' },
  { value: 'dragonfly', label: 'שפירית' },
  { value: 'fish', label: 'בינון' },
  { value: 'mongoose', label: 'נמייה' },
  { value: 'butterfly', label: 'פרפר' },
];

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState({
    name_he: '',
    fun_facts: '',
    letter: '',
    order_index: 1,
    habitat: '',
    conservation_tip: '',
    illustration_key: '',
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
        habitat: data.habitat || '',
        conservation_tip: data.conservation_tip || '',
        illustration_key: data.illustration_key || '',
      });
      setImageUrl(data.image_url);
      setVideoUrl(data.video_url);
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

  async function handleUpload(file: File, type: 'image' | 'video') {
    setMediaError(null);
    const setUploading = type === 'image' ? setUploadingImage : setUploadingVideo;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const res = await fetch(`/api/admin/animals/${id}/media`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setMediaError(data.error || 'העלאה נכשלה');
        return;
      }

      const data = await res.json();
      if (type === 'image') {
        setImageUrl(data.url);
      } else {
        setVideoUrl(data.url);
      }
    } catch {
      setMediaError('העלאה נכשלה');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(type: 'image' | 'video') {
    setMediaError(null);
    const setUploading = type === 'image' ? setUploadingImage : setUploadingVideo;
    setUploading(true);

    try {
      const res = await fetch(`/api/admin/animals/${id}/media`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMediaError(data.error || 'מחיקה נכשלה');
        return;
      }

      if (type === 'image') {
        setImageUrl(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
      } else {
        setVideoUrl(null);
        if (videoInputRef.current) videoInputRef.current.value = '';
      }
    } catch {
      setMediaError('מחיקה נכשלה');
    } finally {
      setUploading(false);
    }
  }

  const IllustrationPreview = form.illustration_key ? getIllustration(form.illustration_key) : null;

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
          <div>
            <label className="block text-sm font-medium text-deep-green mb-1">בית גידול</label>
            <textarea
              value={form.habitat}
              onChange={(e) => setForm({ ...form, habitat: e.target.value })}
              className="w-full min-h-[80px] px-4 py-3 rounded-xl border-2 border-deep-green/20 bg-white text-nature-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-deep-green mb-1">טיפ ירוק</label>
            <textarea
              value={form.conservation_tip}
              onChange={(e) => setForm({ ...form, conservation_tip: e.target.value })}
              className="w-full min-h-[80px] px-4 py-3 rounded-xl border-2 border-deep-green/20 bg-white text-nature-text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-deep-green mb-1">איור</label>
            <div className="flex items-center gap-3">
              <select
                value={form.illustration_key}
                onChange={(e) => setForm({ ...form, illustration_key: e.target.value })}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-deep-green/20 bg-white text-nature-text"
              >
                {illustrationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {IllustrationPreview && (
                <div className="w-12 h-12 flex-shrink-0">
                  <IllustrationPreview className="w-12 h-12" />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? 'שומר...' : 'שמירה'}</Button>
            <Button variant="outline" type="button" onClick={() => router.back()}>ביטול</Button>
          </div>
        </form>
      </Card>

      {mediaError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {mediaError}
        </div>
      )}

      <Card>
        <h2 className="text-lg font-bold text-deep-green mb-3">תמונה</h2>
        {imageUrl && (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-gray-100">
            <Image src={imageUrl} alt={form.name_he} fill className="object-cover" />
          </div>
        )}
        <div className="flex items-center gap-3">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            disabled={uploadingImage}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file, 'image');
            }}
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-deep-green/10 file:px-3 file:py-2 file:text-deep-green file:font-medium file:cursor-pointer"
          />
          {imageUrl && (
            <Button
              variant="outline"
              type="button"
              disabled={uploadingImage}
              onClick={() => handleRemove('image')}
              className="!text-red-600 !border-red-300 hover:!bg-red-50 text-sm !px-3 !py-1 !min-h-0"
            >
              הסרה
            </Button>
          )}
        </div>
        {uploadingImage && <p className="text-sm text-deep-green/60 mt-2">מעלה תמונה...</p>}
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-deep-green mb-3">סרטון</h2>
        {videoUrl && (
          <video src={videoUrl} controls preload="metadata" className="w-full rounded-xl mb-3" />
        )}
        <div className="flex items-center gap-3">
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            disabled={uploadingVideo}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file, 'video');
            }}
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-deep-green/10 file:px-3 file:py-2 file:text-deep-green file:font-medium file:cursor-pointer"
          />
          {videoUrl && (
            <Button
              variant="outline"
              type="button"
              disabled={uploadingVideo}
              onClick={() => handleRemove('video')}
              className="!text-red-600 !border-red-300 hover:!bg-red-50 text-sm !px-3 !py-1 !min-h-0"
            >
              הסרה
            </Button>
          )}
        </div>
        {uploadingVideo && <p className="text-sm text-deep-green/60 mt-2">מעלה סרטון...</p>}
      </Card>
    </div>
  );
}
