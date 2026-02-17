import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const type = formData.get('type') as string; // 'image' or 'video'

  if (!file || !type) {
    return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
  }

  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File too large (max ${maxSize / 1024 / 1024}MB)` }, { status: 400 });
  }

  const bucket = type === 'image' ? 'animal-images' : 'animal-videos';
  const ext = file.name.split('.').pop();
  const path = `${id}/${Date.now()}.${ext}`;

  const adminClient = createAdminClient();

  // Delete old file if exists
  const { data: animal } = await supabase.from('animals').select('image_url, video_url').eq('id', id).single();
  if (animal) {
    const oldUrl = type === 'image' ? animal.image_url : animal.video_url;
    if (oldUrl) {
      const oldPath = oldUrl.split(`${bucket}/`).pop();
      if (oldPath) {
        await adminClient.storage.from(bucket).remove([oldPath]);
      }
    }
  }

  // Upload new file
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await adminClient.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data: { publicUrl } } = adminClient.storage.from(bucket).getPublicUrl(path);

  // Update animal record
  const updateField = type === 'image' ? 'image_url' : 'video_url';
  await adminClient.from('animals').update({ [updateField]: publicUrl }).eq('id', id);

  return NextResponse.json({ url: publicUrl });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { type } = await request.json();

  if (type !== 'image' && type !== 'video') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const bucket = type === 'image' ? 'animal-images' : 'animal-videos';
  const urlField = type === 'image' ? 'image_url' : 'video_url';

  const { data: animal } = await supabase.from('animals').select('image_url, video_url').eq('id', id).single();
  if (animal) {
    const oldUrl = animal[urlField];
    if (oldUrl) {
      const oldPath = oldUrl.split(`${bucket}/`).pop();
      if (oldPath) {
        const adminClient = createAdminClient();
        await adminClient.storage.from(bucket).remove([oldPath]);
      }
    }
  }

  const adminClient = createAdminClient();
  await adminClient.from('animals').update({ [urlField]: null }).eq('id', id);

  return NextResponse.json({ success: true });
}
